import { JobState, StepState } from '../types';
import { jobIcon, stepIcon } from './icons';

const PANEL_ID = 'ghash-panel';

const STYLES = `
#ghash-panel {
  position: fixed;
  top: 60px;
  right: 0;
  width: 420px;
  max-height: calc(100vh - 80px);
  background: #161b22;
  border: 1px solid #30363d;
  border-right: none;
  border-radius: 6px 0 0 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #e6edf3;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0,0,0,0.5);
  transition: width 0.2s ease;
  overflow: hidden;
}
#ghash-panel.ghash-collapsed { width: 32px; }

#ghash-panel .ghash-header {
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: #0d1117;
  border-bottom: 1px solid #30363d;
  flex-shrink: 0;
  height: 40px;
  gap: 8px;
  user-select: none;
  cursor: default;
}
#ghash-panel .ghash-title {
  flex: 1;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #8b949e;
  white-space: nowrap;
  overflow: hidden;
}
#ghash-panel.ghash-collapsed .ghash-title { display: none; }

#ghash-panel .ghash-toggle {
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  padding: 0;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
#ghash-panel .ghash-toggle:hover { color: #e6edf3; background: #21262d; }

#ghash-panel .ghash-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}
#ghash-panel.ghash-collapsed .ghash-body { display: none; }
#ghash-panel .ghash-body::-webkit-scrollbar { width: 3px; }
#ghash-panel .ghash-body::-webkit-scrollbar-track { background: transparent; }
#ghash-panel .ghash-body::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }

#ghash-panel .ghash-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
  gap: 10px;
  color: #8b949e;
  font-size: 11px;
}
@keyframes ghash-spin { to { transform: rotate(360deg); } }
#ghash-panel .ghash-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #30363d;
  border-top-color: #58a6ff;
  border-radius: 50%;
  animation: ghash-spin 0.7s linear infinite;
}

#ghash-panel .ghash-message {
  padding: 20px 16px;
  color: #8b949e;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}
#ghash-panel .ghash-error-msg { color: #f85149; }

#ghash-panel .ghash-job { border-bottom: 1px solid #21262d; }
#ghash-panel .ghash-job:last-child { border-bottom: none; }

#ghash-panel .ghash-job-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  cursor: pointer;
  user-select: none;
}
#ghash-panel .ghash-job-header:hover { background: #1c2128; }

#ghash-panel .ghash-job-icon { flex-shrink: 0; font-size: 13px; width: 16px; text-align: center; }
#ghash-panel .ghash-job-name {
  flex: 1;
  font-weight: 500;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#ghash-panel .ghash-job-meta { flex-shrink: 0; color: #8b949e; font-size: 11px; }
#ghash-panel .ghash-job-chevron { flex-shrink: 0; color: #484f58; font-size: 10px; }

#ghash-panel .ghash-steps { background: #0d1117; padding: 2px 0 8px; }

#ghash-panel .ghash-step {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px 4px 34px;
  border-left: 2px solid transparent;
}
#ghash-panel .ghash-step.ghash-step-active {
  border-left-color: #58a6ff;
  background: rgba(88,166,255,0.06);
  padding-left: 32px;
}
#ghash-panel .ghash-step-icon { flex-shrink: 0; font-size: 11px; width: 13px; text-align: center; }
#ghash-panel .ghash-step-name {
  flex: 1;
  font-size: 12px;
  color: #6e7681;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#ghash-panel .ghash-step.ghash-step-active .ghash-step-name { color: #e6edf3; font-weight: 500; }

#ghash-panel .ghash-success   { color: #3fb950; }
#ghash-panel .ghash-failure   { color: #f85149; }
#ghash-panel .ghash-cancelled { color: #d29922; }
#ghash-panel .ghash-skipped   { color: #484f58; }
#ghash-panel .ghash-queued    { color: #8b949e; }

@keyframes ghash-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
#ghash-panel .ghash-running {
  color: #58a6ff;
  animation: ghash-pulse 1.4s ease-in-out infinite;
}
`;


function errorMessage(code: string): string {
  if (code === 'UNAUTHORIZED')  return 'Authentication required. Add a token in the extension popup.';
  if (code === 'RATE_LIMITED')  return 'GitHub API rate limit reached. Retrying shortly.';
  if (code === 'FORBIDDEN')     return 'Access denied. Check your token permissions.';
  if (code === 'NOT_FOUND')     return 'Workflow run not found.';
  if (code.startsWith('API_ERROR:')) return `API error (${code.split(':')[1]}). Retrying.`;
  return 'Network error. Retrying.';
}

export class Panel {
  private el: HTMLDivElement | null = null;
  private bodyEl: HTMLDivElement | null = null;
  private panelCollapsed = false;
  private collapsedJobs = new Set<number>();
  private seenJobIds = new Set<number>();

  mount(): void {
    if (this.el && document.contains(this.el)) return;

    const el = document.createElement('div');
    el.id = PANEL_ID;

    const style = document.createElement('style');
    style.textContent = STYLES;
    el.appendChild(style);

    const header = document.createElement('div');
    header.className = 'ghash-header';

    const title = document.createElement('span');
    title.className = 'ghash-title';
    title.textContent = '⚡ Actions';

    const toggle = document.createElement('button');
    toggle.className = 'ghash-toggle';
    toggle.title = 'Toggle panel';
    toggle.textContent = '◀';
    toggle.addEventListener('click', () => this.togglePanel());

    header.appendChild(title);
    header.appendChild(toggle);
    el.appendChild(header);

    const body = document.createElement('div');
    body.className = 'ghash-body';
    el.appendChild(body);

    if (this.panelCollapsed) {
      el.classList.add('ghash-collapsed');
      toggle.textContent = '▶';
    }

    document.body.appendChild(el);
    this.el = el;
    this.bodyEl = body;
  }

  unmount(): void {
    this.el?.remove();
    this.el = null;
    this.bodyEl = null;
  }

  isInDocument(): boolean {
    return this.el !== null && document.contains(this.el);
  }

  setLoading(): void {
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'ghash-loading';
    const spinner = document.createElement('div');
    spinner.className = 'ghash-spinner';
    const label = document.createElement('span');
    label.textContent = 'Loading jobs\u2026';
    wrap.appendChild(spinner);
    wrap.appendChild(label);
    this.bodyEl.appendChild(wrap);
  }

  setError(code: string): void {
    this.setMessage(errorMessage(code), true);
  }

  setNeedsToken(): void {
    this.setMessage('Private repo or insufficient permissions — add or update your personal access token in the extension popup.', false);
  }

  update(jobs: JobState[]): void {
    for (const job of jobs) {
      if (!this.seenJobIds.has(job.id)) {
        this.seenJobIds.add(job.id);
        // Collapse completed-success jobs by default; keep active/failed expanded
        if (job.status === 'completed' && job.conclusion === 'success') {
          this.collapsedJobs.add(job.id);
        }
      }
    }

    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';

    if (jobs.length === 0) {
      this.setMessage('No jobs found for this run.', false);
      return;
    }

    for (const job of jobs) {
      this.bodyEl.appendChild(this.renderJob(job));
    }
  }

  private renderJob(job: JobState): HTMLElement {
    const isCollapsed = this.collapsedJobs.has(job.id);
    const completedCount = job.steps.filter(s => s.status === 'completed').length;
    const totalCount = job.steps.length;

    const wrapper = document.createElement('div');
    wrapper.className = 'ghash-job';

    // Header row
    const header = document.createElement('div');
    header.className = 'ghash-job-header';

    const { icon, cls } = jobIcon(job);

    const iconEl = document.createElement('span');
    iconEl.className = `ghash-job-icon ${cls}`;
    iconEl.textContent = icon;

    const nameEl = document.createElement('span');
    nameEl.className = 'ghash-job-name';
    nameEl.textContent = job.name;
    nameEl.title = job.name;

    const metaEl = document.createElement('span');
    metaEl.className = 'ghash-job-meta';
    if (totalCount > 0) metaEl.textContent = `${completedCount}/${totalCount}`;

    const chevronEl = document.createElement('span');
    chevronEl.className = 'ghash-job-chevron';
    chevronEl.textContent = isCollapsed ? '▶' : '▼';

    header.appendChild(iconEl);
    header.appendChild(nameEl);
    header.appendChild(metaEl);
    header.appendChild(chevronEl);
    wrapper.appendChild(header);

    // Steps container
    const stepsEl = document.createElement('div');
    stepsEl.className = 'ghash-steps';
    if (isCollapsed) stepsEl.style.display = 'none';

    for (let i = 0; i < job.steps.length; i++) {
      stepsEl.appendChild(this.renderStep(job.steps[i], i === job.currentStepIndex));
    }

    wrapper.appendChild(stepsEl);

    header.addEventListener('click', () => {
      if (this.collapsedJobs.has(job.id)) {
        this.collapsedJobs.delete(job.id);
        stepsEl.style.display = '';
        chevronEl.textContent = '▼';
      } else {
        this.collapsedJobs.add(job.id);
        stepsEl.style.display = 'none';
        chevronEl.textContent = '▶';
      }
    });

    return wrapper;
  }

  private renderStep(step: StepState, isActive: boolean): HTMLElement {
    const row = document.createElement('div');
    row.className = isActive ? 'ghash-step ghash-step-active' : 'ghash-step';

    const { icon, cls } = stepIcon(step);

    const iconEl = document.createElement('span');
    iconEl.className = `ghash-step-icon ${cls}`;
    iconEl.textContent = icon;

    const nameEl = document.createElement('span');
    nameEl.className = 'ghash-step-name';
    nameEl.textContent = step.name;
    nameEl.title = step.name;

    row.appendChild(iconEl);
    row.appendChild(nameEl);
    return row;
  }

  private togglePanel(): void {
    this.panelCollapsed = !this.panelCollapsed;
    if (!this.el) return;
    if (this.panelCollapsed) {
      this.el.classList.add('ghash-collapsed');
    } else {
      this.el.classList.remove('ghash-collapsed');
    }
    const btn = this.el.querySelector<HTMLButtonElement>('.ghash-toggle');
    if (btn) btn.textContent = this.panelCollapsed ? '▶' : '◀';
  }

  private setMessage(text: string, isError: boolean): void {
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';
    const msg = document.createElement('div');
    msg.className = isError ? 'ghash-message ghash-error-msg' : 'ghash-message';
    msg.textContent = text;
    this.bodyEl.appendChild(msg);
  }
}
