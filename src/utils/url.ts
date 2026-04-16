import { WorkflowRunContext } from '../types';

const RUN_PAGE_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/actions\/runs\/(\d+)/;

export function parseRunContext(url: string): WorkflowRunContext | null {
  const match = url.match(RUN_PAGE_RE);
  if (!match) return null;
  return { owner: match[1], repo: match[2], runId: match[3] };
}

export function isRunPage(url: string): boolean {
  return RUN_PAGE_RE.test(url);
}
