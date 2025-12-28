// 送信元チェッカー
// 正しいアカウントから送信しているか確認

const SenderChecker = {
  /**
   * 送信元をチェックする
   * @param {string} senderEmail 送信元メールアドレス
   * @param {Object} settings 設定
   * @returns {Object} チェック結果
   */
  check(senderEmail, settings = {}) {
    const result = {
      type: 'sender',
      passed: true,
      message: '',
      severity: 'info',
      details: {
        senderEmail: senderEmail
      }
    };

    if (!senderEmail) {
      result.passed = false;
      result.message = '送信元アドレスを検出できませんでした';
      result.severity = 'warning';
      return result;
    }

    result.message = `送信元: ${senderEmail}`;

    // 期待するアカウントが設定されている場合
    if (settings.expectedAccounts && settings.expectedAccounts.length > 0) {
      if (!settings.expectedAccounts.includes(senderEmail)) {
        result.passed = false;
        result.message = `送信元が通常と異なります: ${senderEmail}`;
        result.severity = 'warning';
      }
    }

    return result;
  }
};
