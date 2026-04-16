import { GitHubApiClient } from '../api/github';
import { getToken, setToken, clearToken } from '../utils/storage';
import { ExtensionMessage } from '../types';
import { log } from '../utils/logger';

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
        sendResponse({ error: msg });
      });
    return true; // keep channel open for async response
  }
);

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  log.info('Message:', message.type);
  switch (message.type) {
    case 'FETCH_JOBS': {
      const { owner, repo, runId } = message.context;
      const token = await getToken();
      const client = new GitHubApiClient(token);
      try {
        const jobs = await client.fetchJobs(owner, repo, runId);
        log.info(`FETCH_JOBS ok — ${jobs.length} jobs`);
        return { jobs };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
        log.error('FETCH_JOBS failed:', msg);
        throw err;
      }
    }
    case 'GET_TOKEN':
      return { token: await getToken() };
    case 'SET_TOKEN':
      await setToken(message.token);
      log.info('Token saved');
      return { ok: true };
    case 'CLEAR_TOKEN':
      await clearToken();
      log.info('Token cleared');
      return { ok: true };
  }
}
