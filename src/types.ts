export interface WorkflowRunContext {
  owner: string;
  repo: string;
  runId: string;
}

export type StepStatus = 'queued' | 'in_progress' | 'completed' | 'pending' | 'unknown';
export type StepConclusion = 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral' | null;
export type JobStatus = 'queued' | 'in_progress' | 'completed' | 'waiting' | 'unknown';
export type JobConclusion = 'success' | 'failure' | 'cancelled' | 'skipped' | null;

export interface StepState {
  number: number;
  name: string;
  status: StepStatus;
  conclusion: StepConclusion;
  startedAt?: string;
  completedAt?: string;
}

export interface JobState {
  id: number;
  name: string;
  status: JobStatus;
  conclusion: JobConclusion;
  steps: StepState[];
  currentStepIndex?: number;
}

// Messages between content script and background service worker
export interface FetchJobsMessage {
  type: 'FETCH_JOBS';
  context: WorkflowRunContext;
}

export interface GetTokenMessage {
  type: 'GET_TOKEN';
}

export interface SetTokenMessage {
  type: 'SET_TOKEN';
  token: string;
}

export interface ClearTokenMessage {
  type: 'CLEAR_TOKEN';
}

export type ExtensionMessage =
  | FetchJobsMessage
  | GetTokenMessage
  | SetTokenMessage
  | ClearTokenMessage;
