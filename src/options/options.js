// Gmail送信前チェッカー - 設定画面ロジック

document.addEventListener('DOMContentLoaded', async () => {
  // 設定を読み込む
  await loadSettings();

  // 保存ボタンのイベント
  document.getElementById('save-btn').addEventListener('click', saveSettings);
});

/**
 * 設定を読み込む
 */
async function loadSettings() {
  const defaults = {
    enabled: true,
    showConfirmDialog: true,
    checkers: {
      sender: true,
      recipient: true,
      attachment: true,
      typo: true,
      date: true,
      weekday: true
    }
  };

  try {
    const result = await chrome.storage.sync.get(null);
    const settings = { ...defaults, ...result };

    // チェックボックスに反映
    document.getElementById('enabled').checked = settings.enabled;
    document.getElementById('showConfirmDialog').checked = settings.showConfirmDialog;

    // チェッカー設定
    const checkers = { ...defaults.checkers, ...settings.checkers };
    document.getElementById('checker-sender').checked = checkers.sender;
    document.getElementById('checker-recipient').checked = checkers.recipient;
    document.getElementById('checker-attachment').checked = checkers.attachment;
    document.getElementById('checker-typo').checked = checkers.typo;
    document.getElementById('checker-date').checked = checkers.date;
    document.getElementById('checker-weekday').checked = checkers.weekday;
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
  }
}

/**
 * 設定を保存する
 */
async function saveSettings() {
  const settings = {
    enabled: document.getElementById('enabled').checked,
    showConfirmDialog: document.getElementById('showConfirmDialog').checked,
    checkers: {
      sender: document.getElementById('checker-sender').checked,
      recipient: document.getElementById('checker-recipient').checked,
      attachment: document.getElementById('checker-attachment').checked,
      typo: document.getElementById('checker-typo').checked,
      date: document.getElementById('checker-date').checked,
      weekday: document.getElementById('checker-weekday').checked
    }
  };

  try {
    await chrome.storage.sync.set(settings);

    // 保存完了表示
    const status = document.getElementById('save-status');
    status.textContent = '保存しました';
    status.classList.add('show');

    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    alert('設定の保存に失敗しました');
  }
}
