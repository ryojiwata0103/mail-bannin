// Gmail送信前チェッカー - メインContent Script
// 送信ボタンのインターセプトとチェック実行

(function() {
  'use strict';

  // 設定のデフォルト値
  let settings = {
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
  };

  // インターセプト済みボタンを追跡
  const interceptedButtons = new WeakSet();

  // MutationObserverのインスタンス
  let observer = null;

  /**
   * 初期化
   */
  async function initialize() {
    console.log('[Gmail送信前チェッカー] 初期化中...');

    // 設定を読み込む
    await loadSettings();

    if (!settings.enabled) {
      console.log('[Gmail送信前チェッカー] 無効化されています');
      return;
    }

    // 送信ボタンの監視を開始
    startObserving();

    console.log('[Gmail送信前チェッカー] 初期化完了');
  }

  /**
   * 設定を読み込む
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(null);
      if (result && Object.keys(result).length > 0) {
        settings = { ...settings, ...result };
      }
    } catch (error) {
      console.warn('[Gmail送信前チェッカー] 設定の読み込みに失敗:', error);
    }
  }

  /**
   * DOM監視を開始する
   */
  function startObserving() {
    // 初回の送信ボタン検出
    detectAndInterceptSendButtons();

    // MutationObserverで動的な変更を監視
    observer = new MutationObserver((mutations) => {
      // デバウンス処理
      clearTimeout(observer._debounceTimer);
      observer._debounceTimer = setTimeout(() => {
        detectAndInterceptSendButtons();
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 送信ボタンを検出してインターセプトする
   */
  function detectAndInterceptSendButtons() {
    const buttons = GmailDOM.findSendButtons();

    buttons.forEach(button => {
      if (!interceptedButtons.has(button)) {
        interceptButton(button);
        interceptedButtons.add(button);
      }
    });
  }

  /**
   * 送信ボタンをインターセプトする
   * @param {Element} button 送信ボタン要素
   */
  function interceptButton(button) {
    // クリックイベントをキャプチャフェーズでインターセプト
    button.addEventListener('click', handleSendClick, true);
  }

  /**
   * 送信ボタンクリック時のハンドラ
   * @param {Event} event クリックイベント
   */
  async function handleSendClick(event) {
    // 設定が無効の場合はスキップ
    if (!settings.enabled || !settings.showConfirmDialog) {
      return;
    }

    // イベントを一時停止
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;

    try {
      // Compose Windowを特定
      const composeWindow = findComposeWindowForButton(button);
      if (!composeWindow) {
        console.warn('[Gmail送信前チェッカー] Compose Windowが見つかりません');
        proceedWithSend(button);
        return;
      }

      // メールデータを抽出
      const emailData = GmailDOM.extractEmailData(composeWindow);

      // 全チェックを実行
      const checkResults = runAllChecks(emailData);

      // 確認ダイアログを表示
      const shouldSend = await ConfirmationDialog.show(emailData, checkResults);

      if (shouldSend) {
        proceedWithSend(button);
      }
    } catch (error) {
      console.error('[Gmail送信前チェッカー] エラー:', error);
      // エラー時は送信を許可
      proceedWithSend(button);
    }
  }

  /**
   * ボタンからCompose Windowを特定する
   * @param {Element} button 送信ボタン
   * @returns {Element|null} Compose Window
   */
  function findComposeWindowForButton(button) {
    // ボタンの親要素をたどってCompose Windowを探す
    let element = button;
    while (element) {
      // Compose Windowの特徴的なクラスを持つ要素を探す
      if (element.classList.contains('M9') ||
          element.classList.contains('AD') ||
          (element.getAttribute('role') === 'dialog' && element.querySelector('div[aria-label*="メッセージ本文"]'))) {
        return element;
      }
      element = element.parentElement;
    }

    // 見つからない場合はアクティブなCompose Windowを返す
    return GmailDOM.findComposeWindow();
  }

  /**
   * 全チェックを実行する
   * @param {Object} emailData メールデータ
   * @returns {Array} チェック結果の配列
   */
  function runAllChecks(emailData) {
    const results = [];

    // 送信元チェック
    if (settings.checkers.sender) {
      results.push(SenderChecker.check(emailData.sender, settings));
    }

    // 送信先チェック
    if (settings.checkers.recipient) {
      results.push(RecipientChecker.check(emailData.recipients, settings));
    }

    // 添付ファイルチェック
    if (settings.checkers.attachment) {
      results.push(AttachmentChecker.check(emailData.body, emailData.attachments, settings));
    }

    // 誤字脱字チェック
    if (settings.checkers.typo) {
      results.push(TypoChecker.check(emailData.body, settings));
    }

    // 日付整合性チェック
    if (settings.checkers.date) {
      results.push(DateChecker.check(emailData.body, emailData.timestamp, settings));
    }

    // 曜日整合性チェック
    if (settings.checkers.weekday) {
      results.push(WeekdayChecker.check(emailData.body, settings));
    }

    return results;
  }

  /**
   * 送信を続行する
   * @param {Element} button 送信ボタン
   */
  function proceedWithSend(button) {
    // インターセプトを一時的に解除して元のクリックを実行
    button.removeEventListener('click', handleSendClick, true);

    // 元のクリックイベントを発火
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    button.dispatchEvent(clickEvent);

    // 少し待ってから再度インターセプトを設定
    setTimeout(() => {
      if (!interceptedButtons.has(button)) {
        button.addEventListener('click', handleSendClick, true);
        interceptedButtons.add(button);
      }
    }, 500);
  }

  // 設定変更の監視
  chrome.storage.onChanged.addListener((changes) => {
    for (const key of Object.keys(changes)) {
      settings[key] = changes[key].newValue;
    }
  });

  // 初期化を実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
