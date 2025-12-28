// 添付ファイルチェッカー
// 添付忘れの検出

const AttachmentChecker = {
  // 添付を示唆するキーワード
  keywords: [
    '添付', '別添', '同封', 'ファイル', '資料', '書類',
    'PDFを', 'エクセルを', 'Excelを', 'Wordを', '画像を', '写真を',
    '見積書', '請求書', '契約書', '報告書', '図面', 'データを', '表を',
    'スクリーンショット', 'スクショ', 'キャプチャ',
    'attached', 'attachment', 'enclosed', 'file', 'document'
  ],

  // 添付しない場合の表現（除外パターン）
  excludePatterns: [
    '添付不要', '添付は不要', '添付はありません', '添付なし',
    '別途送付', '後ほど送付', '追って送付',
    'no attachment', 'without attachment'
  ],

  /**
   * 添付ファイルをチェックする
   * @param {string} body 本文テキスト
   * @param {Array} attachments 添付ファイル名の配列
   * @param {Object} settings 設定
   * @returns {Object} チェック結果
   */
  check(body, attachments, settings = {}) {
    const result = {
      type: 'attachment',
      passed: true,
      message: '',
      severity: 'info',
      details: {
        attachments: attachments || [],
        detectedKeywords: [],
        hasExcludePattern: false
      }
    };

    const bodyLower = body.toLowerCase();

    // 除外パターンのチェック
    for (const pattern of this.excludePatterns) {
      if (bodyLower.includes(pattern.toLowerCase())) {
        result.details.hasExcludePattern = true;
        break;
      }
    }

    // 添付キーワードの検出
    for (const keyword of this.keywords) {
      if (bodyLower.includes(keyword.toLowerCase())) {
        result.details.detectedKeywords.push(keyword);
      }
    }

    // 添付ファイルがある場合
    if (attachments && attachments.length > 0) {
      result.message = `添付ファイル: ${attachments.join(', ')}`;
      return result;
    }

    // 添付ファイルがない場合
    if (result.details.detectedKeywords.length > 0 && !result.details.hasExcludePattern) {
      result.passed = false;
      result.severity = 'warning';
      result.message = `添付ファイルがありません\n本文に「${result.details.detectedKeywords[0]}」という記述があります`;
    } else {
      result.message = '添付ファイルなし';
    }

    return result;
  }
};
