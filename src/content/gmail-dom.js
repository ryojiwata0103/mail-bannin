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
    // 新規作成ウィンドウ
    'div.M9',
    'div[role="dialog"]',
    'div.AD',
    // 返信・インライン返信
    'div.iN',
    'div.nH.Hd',
    'div.aO7',
    'div.Am.Al.editable',
    // 返信ボックスの親要素
    'div.ip.iq'
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

    // From ドロップダウン（複数アカウント時）のセレクタ
    const fromDropdownSelectors = [
      // From選択ドロップダウン内のメールアドレス
      'div.az4 span.ams',
      'div[data-tooltip*="差出人"] span',
      'div.az4 div[data-hovercard-id]',
      'td.az3 span[email]',
      // 送信元選択エリア
      'div.dW.E span[email]',
      'div.az2 span[email]'
    ];

    // まずFromドロップダウンを確認
    for (const selector of fromDropdownSelectors) {
      const elem = composeWindow.querySelector(selector);
      if (elem) {
        const email = elem.getAttribute('email') || elem.textContent;
        if (email) {
          // メールアドレスを抽出
          const match = email.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
          if (match) {
            return match[0].trim();
          }
        }
      }
    }

    // ログインしているGoogleアカウントを取得（より確実な方法）
    const accountSelectors = [
      'a[aria-label*="Google アカウント"]',
      'a[aria-label*="Google Account"]',
      'a[href*="SignOutOptions"]',
      'header a[href*="accounts.google.com"]'
    ];

    for (const selector of accountSelectors) {
      const accountBtn = document.querySelector(selector);
      if (accountBtn) {
        const label = accountBtn.getAttribute('aria-label') || '';
        const match = label.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
        if (match) return match[0];
      }
    }

    // ページ内のメタ情報から取得
    const gmailUser = document.querySelector('meta[name="user"]');
    if (gmailUser) {
      const content = gmailUser.getAttribute('content');
      if (content && content.includes('@')) {
        return content.trim();
      }
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

    // 宛先フィールドのセレクタ（返信・新規作成両対応）
    const fieldMap = {
      to: [
        // 返信時・新規作成時の共通セレクタ
        'div[name="to"] span[email]',
        'div[data-hovercard-id][email]',
        'span[email][data-hovercard-id]',
        'div.fX span[email]',
        'div.aoD.hl span[email]',
        'div.GS span[email]',
        // 返信インライン時
        'div.aCj span[email]',
        'div.anV span[email]',
        // To行全体から検索
        'tr.GS td.GR span[email]',
        'div[aria-label*="宛先"] span[email]',
        'div[aria-label*="To"] span[email]',
        // input要素
        'input[name="to"]'
      ],
      cc: [
        'div[name="cc"] span[email]',
        'div.aoD.hl span[email]',
        'tr.GS td.GR span[email]',
        'div[aria-label*="Cc"] span[email]',
        'input[name="cc"]'
      ],
      bcc: [
        'div[name="bcc"] span[email]',
        'div[aria-label*="Bcc"] span[email]',
        'input[name="bcc"]'
      ]
    };

    // 全体からemail属性を持つ要素を検索する汎用関数
    const extractEmailsFromElements = (container, selectors) => {
      const emails = [];
      for (const selector of selectors) {
        try {
          const elems = container.querySelectorAll(selector);
          elems.forEach(elem => {
            const email = elem.getAttribute('email') || elem.value || '';
            if (email && email.includes('@') && !emails.includes(email.trim())) {
              emails.push(email.trim());
            }
          });
          if (emails.length > 0) break;
        } catch (e) {
          console.log('Selector error:', selector, e);
        }
      }
      return emails;
    };

    // 各フィールドを検索
    for (const [field, selectors] of Object.entries(fieldMap)) {
      recipients[field] = extractEmailsFromElements(composeWindow, selectors);
    }

    // Toが空の場合、より広範囲で検索
    if (recipients.to.length === 0) {
      // email属性を持つ全ての要素から検索
      const allEmailElems = composeWindow.querySelectorAll('[email]');
      const foundEmails = [];
      allEmailElems.forEach(elem => {
        const email = elem.getAttribute('email');
        if (email && email.includes('@')) {
          // 送信者と思われるアドレスは除外（後で追加）
          foundEmails.push(email.trim());
        }
      });

      // 重複除去して設定
      if (foundEmails.length > 0) {
        recipients.to = [...new Set(foundEmails)];
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
   * 本文を取得する（引用部分を除外）
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
        // 本文要素のクローンを作成
        const clone = body.cloneNode(true);

        // 引用部分を除去（Gmailの引用マーカー）
        const quoteSelectors = [
          '.gmail_quote',           // 標準の引用
          '.gmail_extra',           // 追加情報
          'blockquote',             // 引用ブロック
          'div.gmail_attr',         // 引用属性
          'div[data-smartmail]',    // スマートメール引用
          '.im',                    // インライン引用マーカー
          'div.h5',                 // 古い形式の引用
          'div.moz-cite-prefix'     // Mozilla形式
        ];

        quoteSelectors.forEach(sel => {
          clone.querySelectorAll(sel).forEach(el => el.remove());
        });

        // "On ... wrote:" や "-------- Original Message --------" などの行も除去
        let text = clone.innerText || '';

        // 返信ヘッダーパターンを除去
        const replyHeaderPatterns = [
          /^On .+ wrote:$/gm,
          /^.+さんが.+に送信:$/gm,
          /^-{3,}\s*Original Message\s*-{3,}$/gmi,
          /^-{3,}\s*元のメッセージ\s*-{3,}$/gm,
          /^From:.+$/gm,
          /^送信日時:.+$/gm,
          /^宛先:.+$/gm,
          /^件名:.+$/gm
        ];

        replyHeaderPatterns.forEach(pattern => {
          text = text.replace(pattern, '');
        });

        return text.trim();
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
