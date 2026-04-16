import { WorkflowRunContext } from '../types';

const TOKEN_KEY = 'github_pat';
const RUN_CONTEXT_KEY = 'current_run_context';

export async function setRunContext(context: WorkflowRunContext): Promise<void> {
  await chrome.storage.local.set({ [RUN_CONTEXT_KEY]: context });
}

export async function getRunContext(): Promise<WorkflowRunContext | null> {
  const result = await chrome.storage.local.get(RUN_CONTEXT_KEY);
  const val = result[RUN_CONTEXT_KEY];
  return val && typeof val === 'object' ? (val as WorkflowRunContext) : null;
}

export async function clearRunContext(): Promise<void> {
  await chrome.storage.local.remove(RUN_CONTEXT_KEY);
}

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return (result[TOKEN_KEY] as string | undefined) ?? null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}
