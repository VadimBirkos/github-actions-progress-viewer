import { JobState, StepState } from '../types';
import { stepIcon } from './icons';
import { log } from '../utils/logger';

const STYLE_ID = 'ghash-inline-style';
const STEPS_CLASS = 'ghash-inline-steps';
const JOB_SELECTOR = '[data-test-selector="job-link"]';

const CSS = `
.${STEPS_CLASS} {
  padding: 2px 0 6px 36px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ghash-is {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px 2px 4px;
  border-radius: 4px;
  border-left: 2px solid transparent;
  font-size: 11px;
  line-height: 1.4;
}
.ghash-is-active {
  border-left-color: #58a6ff;
  background: rgba(88,166,255,0.08);
}
.ghash-is-icon {
  flex-shrink: 0;
  width: 12px;
  font-size: 10px;
  text-align: center;
}
.ghash-is-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8b949e;
  font-size: 11px;
}
.ghash-is-active .ghash-is-name {
  color: #e6edf3;
  font-weight: 500;
}
@keyframes ghash-is-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.ghash-running { color:#58a6ff; animation: ghash-is-pulse 1.4s ease-in-out infinite; }
.ghash-success  { color: #3fb950; }
.ghash-failure  { color: #f85149; }
.ghash-cancelled{ color: #d29922; }
.ghash-skipped  { color: #484f58; }
.ghash-queued   { color: #8b949e; }
`;

function getJobName(link: HTMLElement): string {
  const labelId = link.getAttribute('aria-labelledby');
  if (labelId) {
    const text = document.getElementById(labelId)?.textContent?.trim();
    if (text) return text;
  }
  return link.textContent?.trim() ?? '';
}

export class InlineSteps {
  private jobs: JobState[] = [];
  private observer: MutationObserver | null = null;

  mount(): void {
    this.ensureStyles();
    this.startObserver();
  }

  unmount(): void {
    this.observer?.disconnect();
    this.observer = null;
    document.querySelectorAll(`.${STEPS_CLASS}`).forEach(el => el.remove());
  }

  update(jobs: JobState[]): void {
    this.jobs = jobs;
    this.renderAll();
  }

  private ensureStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  private startObserver(): void {
    this.observer = new MutationObserver(mutations => {
      // Skip mutations that only contain our own injected nodes
      const isOwnChange = mutations.every(m =>
        Array.from(m.addedNodes).every(
          n => n instanceof Element && (n.classList.contains(STEPS_CLASS) || n.id === STYLE_ID)
        ) && Array.from(m.removedNodes).every(
          n => n instanceof Element && n.classList.contains(STEPS_CLASS)
        )
      );
      if (!isOwnChange) this.renderAll();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private renderAll(): void {
    if (this.jobs.length === 0) return;

    const links = document.querySelectorAll<HTMLElement>(JOB_SELECTOR);
    if (links.length === 0) return;

    log.info(`Inline: rendering ${links.length} job links`);

    links.forEach(link => {
      const name = getJobName(link);
      const job = this.jobs.find(j => j.name === name)
        ?? this.jobs.find(j => j.name.includes(name) || name.includes(j.name));

      if (!job) {
        log.warn(`Inline: no job match for "${name}"`);
        return;
      }

      // Find existing container or create a new one
      let container = link.parentElement?.querySelector<HTMLElement>(`.${STEPS_CLASS}`);
      if (!container) {
        container = document.createElement('div');
        container.className = STEPS_CLASS;
        link.insertAdjacentElement('afterend', container);
      }

      container.innerHTML = '';
      for (let i = 0; i < job.steps.length; i++) {
        container.appendChild(this.renderStep(job.steps[i], i === job.currentStepIndex));
      }
    });
  }

  private renderStep(step: StepState, isActive: boolean): HTMLElement {
    const row = document.createElement('div');
    row.className = isActive ? 'ghash-is ghash-is-active' : 'ghash-is';

    const { icon, cls } = stepIcon(step);

    const iconEl = document.createElement('span');
    iconEl.className = `ghash-is-icon ${cls}`;
    iconEl.textContent = icon;

    const nameEl = document.createElement('span');
    nameEl.className = 'ghash-is-name';
    nameEl.textContent = step.name;
    nameEl.title = step.name;

    row.appendChild(iconEl);
    row.appendChild(nameEl);
    return row;
  }
}
