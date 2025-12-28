// Gmail送信前チェッカー - Service Worker
// Manifest V3 Background Script

// 拡張機能インストール時の初期設定
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // デフォルト設定を保存
    chrome.storage.sync.set({
      enabled: true,
      checkers: {
        sender: true,
        recipient: true,
        attachment: true,
        typo: true,
        date: true,
        weekday: true
      },
      showConfirmDialog: true
    });
    console.log('Gmail送信前チェッカーがインストールされました');
  }
});

// Content Scriptからのメッセージ受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse(settings);
    });
    return true; // 非同期レスポンスを有効化
  }

  if (message.type === 'LOG') {
    console.log('[Gmail Check]', message.data);
  }
});
