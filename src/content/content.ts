import { WorkflowRunContext, JobState } from '../types';
import { parseRunContext } from '../utils/url';
import { Panel } from '../ui/panel';
import { Poller } from '../utils/polling';

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
        this.activate(context);
      }
    } else {
      this.deactivate();
    }
  }

  private watchNavigation(): void {
    // Intercept History API calls (GitHub SPA navigation)
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

    // GitHub Turbo events
    document.addEventListener('turbo:load', () => this.checkPage());
    document.addEventListener('turbo:visit', () => this.checkPage());
  }

  private activate(context: WorkflowRunContext): void {
    this.deactivate();
    this.currentRunId = context.runId;

    const panel = new Panel();
    panel.mount();
    panel.setLoading();
    this.panel = panel;

    const poller = new Poller(POLL_INTERVAL_MS);
    this.poller = poller;

    poller.start(async () => {
      // Remount if GitHub's Turbo replaced the body
      if (!panel.isInDocument()) panel.mount();

      let response: { jobs?: JobState[]; error?: string };
      try {
        response = await chrome.runtime.sendMessage({
          type: 'FETCH_JOBS',
          context,
        }) as { jobs?: JobState[]; error?: string };
      } catch {
        // Extension context invalidated (e.g. extension reloaded)
        panel.setError('NETWORK_ERROR');
        return;
      }

      if (response.error === 'UNAUTHORIZED') {
        panel.setNeedsToken();
        poller.stop();
        return;
      }

      if (response.error) {
        panel.setError(response.error);
        return;
      }

      const jobs = response.jobs ?? [];
      panel.update(jobs);

      const allDone = jobs.length > 0 && jobs.every(j => j.status === 'completed');
      if (allDone) {
        poller.setIntervalMs(SLOW_POLL_INTERVAL_MS);
      }
    });
  }

  private deactivate(): void {
    this.poller?.stop();
    this.poller = null;
    this.panel?.unmount();
    this.panel = null;
    this.currentRunId = null;
  }
}

new ContentScript().init();
