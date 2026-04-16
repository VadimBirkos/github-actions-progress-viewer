import { GitHubApiClient } from '../api/github';
import { getToken, setToken, clearToken } from '../utils/storage';
import { ExtensionMessage } from '../types';

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
  switch (message.type) {
    case 'FETCH_JOBS': {
      const token = await getToken();
      const client = new GitHubApiClient(token);
      const { owner, repo, runId } = message.context;
      const jobs = await client.fetchJobs(owner, repo, runId);
      return { jobs };
    }
    case 'GET_TOKEN':
      return { token: await getToken() };
    case 'SET_TOKEN':
      await setToken(message.token);
      return { ok: true };
    case 'CLEAR_TOKEN':
      await clearToken();
      return { ok: true };
  }
}
