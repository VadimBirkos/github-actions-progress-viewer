import { WorkflowRunContext, JobState } from '../types';
import { parseRunContext } from '../utils/url';
import { Panel } from '../ui/panel';
import { Poller } from '../utils/polling';
import { setRunContext, clearRunContext } from '../utils/storage';
import { log } from '../utils/logger';

const POLL_INTERVAL_MS = 7000;
const SLOW_POLL_INTERVAL_MS = 30000;

class ContentScript {
  private panel: Panel | null = null;
  private poller: Poller | null = null;
  private currentRunId: string | null = null;

  init(): void {
    this.checkPage();
    this.watchNavigation();
  }

  private checkPage(): void {
    const context = parseRunContext(window.location.href);
    if (context) {
      if (context.runId !== this.currentRunId) {
        log.info('Run page detected:', `${context.owner}/${context.repo}`, 'run', context.runId);
        this.activate(context);
      }
    } else {
      this.deactivate();
    }
  }

  private watchNavigation(): void {
    const origPush = history.pushState.bind(history);
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      origPush(...args);
      this.checkPage();
    };

    const origReplace = history.replaceState.bind(history);
    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      origReplace(...args);
      this.checkPage();
    };

    window.addEventListener('popstate', () => this.checkPage());

    document.addEventListener('turbo:load', () => this.checkPage());
    document.addEventListener('turbo:visit', () => this.checkPage());
  }

  private activate(context: WorkflowRunContext): void {
    this.deactivate();
    this.currentRunId = context.runId;
    setRunContext(context).catch(() => undefined);

    const panel = new Panel();
    panel.mount();
    panel.setContext(context);
    panel.setLoading();
    this.panel = panel;

    const poller = new Poller(POLL_INTERVAL_MS);
    this.poller = poller;

    poller.start(async () => {
      if (!panel.isInDocument()) {
        log.warn('Panel detached — remounting');
        panel.mount();
      }

      let response: { jobs?: JobState[]; error?: string };
      try {
        response = await chrome.runtime.sendMessage({
          type: 'FETCH_JOBS',
          context,
        }) as { jobs?: JobState[]; error?: string };
      } catch {
        log.error('sendMessage failed — extension context may have been invalidated');
        panel.setError('NETWORK_ERROR');
        return;
      }

      if (response.error === 'UNAUTHORIZED' || response.error === 'FORBIDDEN') {
        log.warn('Auth error — stopping poll:', response.error);
        panel.setNeedsToken();
        poller.stop();
        return;
      }

      if (response.error) {
        log.error('Poll error:', response.error);
        panel.setError(response.error);
        return;
      }

      const jobs = response.jobs ?? [];
      log.info(`Updated panel: ${jobs.length} jobs`);
      panel.update(jobs);

      const allDone = jobs.length > 0 && jobs.every(j => j.status === 'completed');
      if (allDone) {
        log.info('All jobs complete — switching to slow poll');
        poller.setIntervalMs(SLOW_POLL_INTERVAL_MS);
      }
    });
  }

  private deactivate(): void {
    if (this.currentRunId) log.info('Deactivating run', this.currentRunId);
    clearRunContext().catch(() => undefined);
    this.poller?.stop();
    this.poller = null;
    this.panel?.unmount();
    this.panel = null;
    this.currentRunId = null;
  }
}

new ContentScript().init();
