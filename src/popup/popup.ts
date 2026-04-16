import { JobState, StepState } from '../types';
import { getRunContext } from '../utils/storage';

const POLL_MS = 5000;

document.addEventListener('DOMContentLoaded', () => {
  // ── Resize button ──────────────────────────────────────────
  const resizeBtn = document.getElementById('resize') as HTMLButtonElement;
  resizeBtn.addEventListener('click', () => {
    const expanded = document.body.classList.toggle('expanded');
    resizeBtn.textContent = expanded ? '⤡' : '⤢';
    resizeBtn.title = expanded ? 'Collapse popup' : 'Expand popup';
  });

  // ── Tab switching ──────────────────────────────────────────
  const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      target?.classList.remove('hidden');
    });
  });

  // ── Settings form ──────────────────────────────────────────
  const tokenInput = document.getElementById('token') as HTMLInputElement;
  const saveBtn    = document.getElementById('save')  as HTMLButtonElement;
  const clearBtn   = document.getElementById('clear') as HTMLButtonElement;
  const statusEl   = document.getElementById('status') as HTMLDivElement;

  chrome.runtime.sendMessage({ type: 'GET_TOKEN' }).then((res: unknown) => {
    const r = res as { token?: string | null };
    if (r?.token) tokenInput.value = r.token;
  }).catch(() => undefined);

  saveBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (!token) { flash('Enter a token first.', 'err'); return; }
    chrome.runtime.sendMessage({ type: 'SET_TOKEN', token })
      .then(() => flash('Saved.', 'ok'))
      .catch(() => flash('Failed to save.', 'err'));
  });

  clearBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_TOKEN' })
      .then(() => { tokenInput.value = ''; flash('Cleared.', 'ok'); })
      .catch(() => flash('Failed to clear.', 'err'));
  });

  function flash(msg: string, cls: 'ok' | 'err'): void {
    statusEl.textContent = msg;
    statusEl.className = `status ${cls}`;
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'status'; }, 2000);
  }

  // ── Jobs view ──────────────────────────────────────────────
  const jobsBody = document.getElementById('jobs-body') as HTMLDivElement;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  const collapsedJobs = new Set<number>();
  const seenJobs = new Set<number>();

  async function fetchAndRender(): Promise<void> {
    const context = await getRunContext();
    if (!context) {
      setMsg('Open a GitHub Actions run page to see jobs.');
      return;
    }

    let res: { jobs?: JobState[]; error?: string };
    try {
      res = await chrome.runtime.sendMessage({ type: 'FETCH_JOBS', context }) as typeof res;
    } catch {
      setMsg('Could not reach the extension background.', true);
      return;
    }

    if (res.error === 'UNAUTHORIZED' || res.error === 'FORBIDDEN') {
      setMsg('Private repo — add a token in the Settings tab.');
      switchToSettings();
      return;
    }
    if (res.error) {
      setMsg(`Error: ${res.error}`, true);
      return;
    }

    renderJobs(res.jobs ?? []);

    const allDone = (res.jobs ?? []).every(j => j.status === 'completed');
    if (!allDone) schedulePoll();
  }

  function schedulePoll(): void {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(() => { fetchAndRender().catch(() => undefined); }, POLL_MS);
  }

  function switchToSettings(): void {
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector<HTMLButtonElement>('[data-tab="settings"]')?.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    document.getElementById('tab-settings')?.classList.remove('hidden');
  }

  function setMsg(text: string, isError = false): void {
    jobsBody.innerHTML = '';
    const el = document.createElement('div');
    el.className = isError ? 'state-msg error' : 'state-msg';
    el.textContent = text;
    jobsBody.appendChild(el);
  }

  function renderJobs(jobs: JobState[]): void {
    // Track defaults for newly seen jobs
    for (const job of jobs) {
      if (!seenJobs.has(job.id)) {
        seenJobs.add(job.id);
        if (job.status === 'completed' && job.conclusion === 'success') {
          collapsedJobs.add(job.id);
        }
      }
    }

    jobsBody.innerHTML = '';

    if (jobs.length === 0) {
      setMsg('No jobs found for this run.');
      return;
    }

    for (const job of jobs) {
      jobsBody.appendChild(buildJobEl(job));
    }
  }

  function buildJobEl(job: JobState): HTMLElement {
    const isCollapsed = collapsedJobs.has(job.id);
    const done = job.steps.filter(s => s.status === 'completed').length;

    const wrapper = document.createElement('div');
    wrapper.className = 'job';

    // Header
    const header = document.createElement('div');
    header.className = 'job-header';

    const { icon, cls } = jobStatusIcon(job);

    const iconEl = document.createElement('span');
    iconEl.className = `job-icon ${cls}`;
    iconEl.textContent = icon;

    const nameEl = document.createElement('span');
    nameEl.className = 'job-name';
    nameEl.textContent = job.name;
    nameEl.title = job.name;

    const metaEl = document.createElement('span');
    metaEl.className = 'job-meta';
    if (job.steps.length > 0) metaEl.textContent = `${done}/${job.steps.length}`;

    const chevron = document.createElement('span');
    chevron.className = 'job-chevron';
    chevron.textContent = isCollapsed ? '▶' : '▼';

    header.appendChild(iconEl);
    header.appendChild(nameEl);
    header.appendChild(metaEl);
    header.appendChild(chevron);

    // Steps
    const stepsEl = document.createElement('div');
    stepsEl.className = 'steps';
    if (isCollapsed) stepsEl.style.display = 'none';

    for (let i = 0; i < job.steps.length; i++) {
      stepsEl.appendChild(buildStepEl(job.steps[i], i === job.currentStepIndex));
    }

    header.addEventListener('click', () => {
      if (collapsedJobs.has(job.id)) {
        collapsedJobs.delete(job.id);
        stepsEl.style.display = '';
        chevron.textContent = '▼';
      } else {
        collapsedJobs.add(job.id);
        stepsEl.style.display = 'none';
        chevron.textContent = '▶';
      }
    });

    wrapper.appendChild(header);
    wrapper.appendChild(stepsEl);
    return wrapper;
  }

  function buildStepEl(step: StepState, isActive: boolean): HTMLElement {
    const row = document.createElement('div');
    row.className = isActive ? 'step active' : 'step';

    const { icon, cls } = stepStatusIcon(step);

    const iconEl = document.createElement('span');
    iconEl.className = `step-icon ${cls}`;
    iconEl.textContent = icon;

    const nameEl = document.createElement('span');
    nameEl.className = 'step-name';
    nameEl.textContent = step.name;
    nameEl.title = step.name;

    row.appendChild(iconEl);
    row.appendChild(nameEl);
    return row;
  }

  // Show loading then start first fetch
  jobsBody.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div><span>Loading\u2026</span></div>';
  fetchAndRender().catch(() => undefined);
});

// ── Icon helpers ─────────────────────────────────────────────

function jobStatusIcon(job: JobState): { icon: string; cls: string } {
  if (job.status === 'in_progress')                        return { icon: '●', cls: 'c-running' };
  if (job.status === 'queued' || job.status === 'waiting') return { icon: '○', cls: 'c-queued' };
  if (job.status === 'completed') {
    switch (job.conclusion) {
      case 'success':   return { icon: '✓', cls: 'c-success' };
      case 'failure':   return { icon: '✗', cls: 'c-failure' };
      case 'cancelled': return { icon: '⊘', cls: 'c-cancelled' };
      case 'skipped':   return { icon: '−', cls: 'c-skipped' };
      default:          return { icon: '✓', cls: 'c-success' };
    }
  }
  return { icon: '○', cls: 'c-queued' };
}

function stepStatusIcon(step: StepState): { icon: string; cls: string } {
  if (step.status === 'in_progress')                         return { icon: '●', cls: 'c-running' };
  if (step.status === 'queued' || step.status === 'pending') return { icon: '○', cls: 'c-queued' };
  if (step.status === 'completed') {
    switch (step.conclusion) {
      case 'success':   return { icon: '✓', cls: 'c-success' };
      case 'failure':   return { icon: '✗', cls: 'c-failure' };
      case 'cancelled': return { icon: '⊘', cls: 'c-cancelled' };
      case 'skipped':   return { icon: '−', cls: 'c-skipped' };
      case 'neutral':   return { icon: '●', cls: 'c-queued' };
      default:          return { icon: '✓', cls: 'c-success' };
    }
  }
  return { icon: '○', cls: 'c-queued' };
}
