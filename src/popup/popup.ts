document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('token') as HTMLInputElement;
  const saveBtn = document.getElementById('save') as HTMLButtonElement;
  const clearBtn = document.getElementById('clear') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLDivElement;

  // Load existing token (show placeholder dots if set)
  chrome.runtime.sendMessage({ type: 'GET_TOKEN' }).then((res: unknown) => {
    const response = res as { token?: string | null };
    if (response?.token) tokenInput.value = response.token;
  }).catch(() => undefined);

  saveBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (!token) {
      flash('Enter a token first.', 'err');
      return;
    }
    chrome.runtime.sendMessage({ type: 'SET_TOKEN', token })
      .then(() => flash('Saved.', 'ok'))
      .catch(() => flash('Failed to save.', 'err'));
  });

  clearBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_TOKEN' })
      .then(() => {
        tokenInput.value = '';
        flash('Cleared.', 'ok');
      })
      .catch(() => flash('Failed to clear.', 'err'));
  });

  function flash(msg: string, cls: 'ok' | 'err'): void {
    statusEl.textContent = msg;
    statusEl.className = `status ${cls}`;
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'status';
    }, 2000);
  }
});
