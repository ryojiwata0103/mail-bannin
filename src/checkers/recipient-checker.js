// 送信先チェッカー
// 宛先の確認

const RecipientChecker = {
  /**
   * 送信先をチェックする
   * @param {Object} recipients {to: [], cc: [], bcc: []}
   * @param {Object} settings 設定
   * @returns {Object} チェック結果
   */
  check(recipients, settings = {}) {
    const result = {
      type: 'recipient',
      passed: true,
      message: '',
      severity: 'info',
      details: {
        to: recipients.to || [],
        cc: recipients.cc || [],
        bcc: recipients.bcc || [],
        totalCount: 0
      }
    };

    const allRecipients = [
      ...(recipients.to || []),
      ...(recipients.cc || []),
      ...(recipients.bcc || [])
    ];

    result.details.totalCount = allRecipients.length;

    // 宛先がない場合
    if (allRecipients.length === 0) {
      result.passed = false;
      result.message = '宛先が指定されていません';
      result.severity = 'error';
      return result;
    }

    // 宛先の要約を作成
    const messages = [];

    if (recipients.to && recipients.to.length > 0) {
      messages.push(`To: ${recipients.to.join(', ')}`);
    }

    if (recipients.cc && recipients.cc.length > 0) {
      messages.push(`Cc: ${recipients.cc.join(', ')}`);
    }

    if (recipients.bcc && recipients.bcc.length > 0) {
      messages.push(`Bcc: ${recipients.bcc.join(', ')}`);
    }

    result.message = messages.join('\n');

    // 重複チェック
    const duplicates = this.findDuplicates(allRecipients);
    if (duplicates.length > 0) {
      result.passed = false;
      result.message += `\n※重複アドレス: ${duplicates.join(', ')}`;
      result.severity = 'warning';
    }

    // 大量送信警告
    if (allRecipients.length > 10) {
      result.severity = 'warning';
      result.message += `\n※多数の宛先に送信します（${allRecipients.length}件）`;
    }

    return result;
  },

  /**
   * 重複アドレスを検出する
   * @param {Array} emails メールアドレスの配列
   * @returns {Array} 重複しているアドレス
   */
  findDuplicates(emails) {
    const seen = new Set();
    const duplicates = [];

    for (const email of emails) {
      const normalized = email.toLowerCase().trim();
      if (seen.has(normalized)) {
        duplicates.push(email);
      } else {
        seen.add(normalized);
      }
    }

    return duplicates;
  }
};
