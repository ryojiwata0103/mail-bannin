// Gmail DOM操作モジュール
// Gmail UIからメール情報を取得するための抽象化レイヤー

const GmailDOM = {
  // 送信ボタンのセレクタパターン（Gmailの更新に対応するため複数用意）
  SEND_BUTTON_SELECTORS: [
    'div[role="button"][data-tooltip*="送信"]',
    'div[role="button"][aria-label*="送信"]',
    'div[role="button"][data-tooltip*="Send"]',
    'div[role="button"][aria-label*="Send"]',
    'div.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3'
  ],

  // Compose Window（メール作成画面）のセレクタ
  COMPOSE_SELECTORS: [
    'div.M9',
    'div[role="dialog"]',
    'div.AD'
  ],

  /**
   * 送信ボタンを検出する
   * @returns {NodeList} 送信ボタンのNodeList
   */
  findSendButtons() {
    for (const selector of this.SEND_BUTTON_SELECTORS) {
      const buttons = document.querySelectorAll(selector);
      if (buttons.length > 0) {
        return buttons;
      }
    }
    return [];
  },

  /**
   * Compose Windowを検出する
   * @returns {Element|null} Compose Window要素
   */
  findComposeWindow() {
    for (const selector of this.COMPOSE_SELECTORS) {
      const compose = document.querySelector(selector);
      if (compose) {
        return compose;
      }
    }
    return null;
  },

  /**
   * 送信元アドレスを取得する
   * @param {Element} composeWindow Compose Window要素
   * @returns {string} 送信元メールアドレス
   */
  getSenderEmail(composeWindow) {
    if (!composeWindow) return '';

    // From フィールドのセレクタパターン
    const fromSelectors = [
      'div[data-hovercard-owner-id]',
      'span[email]',
      'div.Kj-JD-Jz span[email]',
      'input[name="from"]'
    ];

    for (const selector of fromSelectors) {
      const elem = composeWindow.querySelector(selector);
      if (elem) {
        const email = elem.getAttribute('email') || elem.textContent;
        if (email && email.includes('@')) {
          return email.trim();
        }
      }
    }

    // デフォルトアカウントを取得
    const accountBtn = document.querySelector('a[aria-label*="Google アカウント"]');
    if (accountBtn) {
      const label = accountBtn.getAttribute('aria-label');
      const match = label?.match(/[\w.-]+@[\w.-]+/);
      if (match) return match[0];
    }

    return '';
  },

  /**
   * 宛先（To/Cc/Bcc）を取得する
   * @param {Element} composeWindow Compose Window要素
   * @returns {Object} {to: [], cc: [], bcc: []}
   */
  getRecipients(composeWindow) {
    if (!composeWindow) return { to: [], cc: [], bcc: [] };

    const recipients = { to: [], cc: [], bcc: [] };

    // 宛先フィールドのセレクタ
    const fieldMap = {
      to: ['div[name="to"] span[email]', 'input[name="to"]', 'div.fX span[email]'],
      cc: ['div[name="cc"] span[email]', 'input[name="cc"]', 'div.fX span[email]'],
      bcc: ['div[name="bcc"] span[email]', 'input[name="bcc"]']
    };

    for (const [field, selectors] of Object.entries(fieldMap)) {
      for (const selector of selectors) {
        const elems = composeWindow.querySelectorAll(selector);
        elems.forEach(elem => {
          const email = elem.getAttribute('email') || elem.value || elem.textContent;
          if (email && email.includes('@')) {
            recipients[field].push(email.trim());
          }
        });
        if (recipients[field].length > 0) break;
      }
    }

    // 重複を除去
    for (const field of ['to', 'cc', 'bcc']) {
      recipients[field] = [...new Set(recipients[field])];
    }

    return recipients;
  },

  /**
   * 件名を取得する
   * @param {Element} composeWindow Compose Window要素
   * @returns {string} 件名
   */
  getSubject(composeWindow) {
    if (!composeWindow) return '';

    const subjectSelectors = [
      'input[name="subjectbox"]',
      'input[aria-label="件名"]',
      'input[aria-label="Subject"]',
      'input.aoT'
    ];

    for (const selector of subjectSelectors) {
      const input = composeWindow.querySelector(selector);
      if (input) {
        return input.value || '';
      }
    }

    return '';
  },

  /**
   * 本文を取得する
   * @param {Element} composeWindow Compose Window要素
   * @returns {string} 本文テキスト
   */
  getBody(composeWindow) {
    if (!composeWindow) return '';

    const bodySelectors = [
      'div[aria-label="メッセージ本文"]',
      'div[aria-label="Message Body"]',
      'div.Am.Al.editable',
      'div[role="textbox"]',
      'div.Ar.Au div[contenteditable="true"]'
    ];

    for (const selector of bodySelectors) {
      const body = composeWindow.querySelector(selector);
      if (body) {
        return body.innerText || '';
      }
    }

    return '';
  },

  /**
   * 添付ファイル情報を取得する
   * @param {Element} composeWindow Compose Window要素
   * @returns {Array} 添付ファイル名の配列
   */
  getAttachments(composeWindow) {
    if (!composeWindow) return [];

    const attachments = [];
    const attachmentSelectors = [
      'div.aQH span.vI',
      'div[role="listitem"] span.vI',
      'div.gmail_chip span',
      'span[data-name]'
    ];

    for (const selector of attachmentSelectors) {
      const elems = composeWindow.querySelectorAll(selector);
      elems.forEach(elem => {
        const name = elem.getAttribute('data-name') || elem.textContent;
        if (name) {
          attachments.push(name.trim());
        }
      });
      if (attachments.length > 0) break;
    }

    return attachments;
  },

  /**
   * メールデータをまとめて取得する
   * @param {Element} composeWindow Compose Window要素
   * @returns {Object} メールデータ
   */
  extractEmailData(composeWindow) {
    return {
      sender: this.getSenderEmail(composeWindow),
      recipients: this.getRecipients(composeWindow),
      subject: this.getSubject(composeWindow),
      body: this.getBody(composeWindow),
      attachments: this.getAttachments(composeWindow),
      timestamp: new Date()
    };
  }
};
