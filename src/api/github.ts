import { JobState, StepState, StepStatus, StepConclusion, JobStatus, JobConclusion } from '../types';

interface RawStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

interface RawJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  steps?: RawStep[];
}

interface JobsApiResponse {
  jobs: RawJob[];
}

function toStepStatus(s: string): StepStatus {
  switch (s) {
    case 'in_progress': return 'in_progress';
    case 'completed':   return 'completed';
    case 'queued':      return 'queued';
    case 'pending':     return 'pending';
    default:            return 'unknown';
  }
}

function toStepConclusion(c: string | null): StepConclusion {
  switch (c) {
    case 'success':   return 'success';
    case 'failure':   return 'failure';
    case 'cancelled': return 'cancelled';
    case 'skipped':   return 'skipped';
    case 'neutral':   return 'neutral';
    default:          return null;
  }
}

function toJobStatus(s: string): JobStatus {
  switch (s) {
    case 'in_progress': return 'in_progress';
    case 'completed':   return 'completed';
    case 'queued':      return 'queued';
    case 'waiting':     return 'waiting';
    default:            return 'unknown';
  }
}

function toJobConclusion(c: string | null): JobConclusion {
  switch (c) {
    case 'success':   return 'success';
    case 'failure':   return 'failure';
    case 'cancelled': return 'cancelled';
    case 'skipped':   return 'skipped';
    default:          return null;
  }
}

function findCurrentStepIndex(steps: StepState[]): number | undefined {
  const running = steps.findIndex(s => s.status === 'in_progress');
  if (running !== -1) return running;
  // For a finished job, point to the last non-skipped completed step
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].status === 'completed' && steps[i].conclusion !== 'skipped') return i;
  }
  return undefined;
}

function normalizeJob(raw: RawJob): JobState {
  const steps: StepState[] = (raw.steps ?? []).map(s => ({
    number: s.number,
    name: s.name,
    status: toStepStatus(s.status),
    conclusion: toStepConclusion(s.conclusion),
    startedAt: s.started_at ?? undefined,
    completedAt: s.completed_at ?? undefined,
  }));

  return {
    id: raw.id,
    name: raw.name,
    status: toJobStatus(raw.status),
    conclusion: toJobConclusion(raw.conclusion),
    steps,
    currentStepIndex: findCurrentStepIndex(steps),
  };
}

export class GitHubApiClient {
  private static BASE = 'https://api.github.com';

  constructor(private readonly token: string | null) {}

  async fetchJobs(owner: string, repo: string, runId: string): Promise<JobState[]> {
    const url = `${GitHubApiClient.BASE}/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=100`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(url, { headers });

    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (res.status === 403) {
      if (res.headers.get('x-ratelimit-remaining') === '0') throw new Error('RATE_LIMITED');
      throw new Error('FORBIDDEN');
    }
    if (res.status === 404) throw new Error('NOT_FOUND');
    if (!res.ok) throw new Error(`API_ERROR:${res.status}`);

    const data: JobsApiResponse = await res.json() as JobsApiResponse;
    return data.jobs.map(normalizeJob);
  }
}
