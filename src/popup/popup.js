// メール番人 - ポップアップロジック

document.addEventListener('DOMContentLoaded', async () => {
  // 設定を読み込む
  await loadSettings();

  // トグルイベント
  document.getElementById('enabled-toggle').addEventListener('change', async (e) => {
    await chrome.storage.sync.set({ enabled: e.target.checked });
    updateStatusDisplay(e.target.checked);
  });

  // 設定画面を開く
  document.getElementById('open-options').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

/**
 * 設定を読み込む
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['enabled']);
    const enabled = result.enabled !== false;

    document.getElementById('enabled-toggle').checked = enabled;
    updateStatusDisplay(enabled);
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
  }
}

/**
 * ステータス表示を更新する
 * @param {boolean} enabled 有効かどうか
 */
function updateStatusDisplay(enabled) {
  const indicator = document.getElementById('status-indicator');
  const text = document.getElementById('status-text');

  if (enabled) {
    indicator.classList.remove('disabled');
    text.textContent = '有効';
  } else {
    indicator.classList.add('disabled');
    text.textContent = '無効';
  }
}
