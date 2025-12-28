// メール内容解析モジュール
// 本文から日付・曜日・キーワードなどを抽出する

const EmailParser = {
  /**
   * 日本語の日付パターンを抽出する
   * @param {string} text 本文テキスト
   * @returns {Array} 抽出された日付情報
   */
  extractDates(text) {
    const dates = [];
    const currentYear = new Date().getFullYear();

    // パターン: YYYY年MM月DD日、YYYY/MM/DD、MM月DD日、MM/DD
    const patterns = [
      {
        regex: /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/g,
        handler: (match) => ({
          text: match[0],
          year: parseInt(match[1]),
          month: parseInt(match[2]),
          day: parseInt(match[3])
        })
      },
      {
        regex: /(\d{1,2})月(\d{1,2})日/g,
        handler: (match) => ({
          text: match[0],
          year: currentYear,
          month: parseInt(match[1]),
          day: parseInt(match[2])
        })
      },
      {
        regex: /(\d{1,2})\/(\d{1,2})/g,
        handler: (match) => ({
          text: match[0],
          year: currentYear,
          month: parseInt(match[1]),
          day: parseInt(match[2])
        })
      }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        const dateInfo = pattern.handler(match);
        dateInfo.date = new Date(dateInfo.year, dateInfo.month - 1, dateInfo.day);
        dates.push(dateInfo);
      }
    }

    return dates;
  },

  /**
   * 曜日付きの日付パターンを抽出する
   * @param {string} text 本文テキスト
   * @returns {Array} 抽出された日付と曜日の情報
   */
  extractDatesWithWeekday(text) {
    const results = [];
    const currentYear = new Date().getFullYear();

    // パターン: MM月DD日（曜日）、MM月DD日(曜)
    const patterns = [
      /(\d{1,2})月(\d{1,2})日[（(]([日月火水木金土])曜?日?[）)]/g,
      /(\d{4})[年\/](\d{1,2})[月\/](\d{1,2})日?[（(]([日月火水木金土])曜?日?[）)]/g
    ];

    // 最初のパターン（年なし）
    let match;
    while ((match = patterns[0].exec(text)) !== null) {
      results.push({
        text: match[0],
        year: currentYear,
        month: parseInt(match[1]),
        day: parseInt(match[2]),
        claimedWeekday: match[3]
      });
    }

    // 2番目のパターン（年あり）
    while ((match = patterns[1].exec(text)) !== null) {
      results.push({
        text: match[0],
        year: parseInt(match[1]),
        month: parseInt(match[2]),
        day: parseInt(match[3]),
        claimedWeekday: match[4]
      });
    }

    return results;
  },

  /**
   * 相対的な日付表現を抽出する
   * @param {string} text 本文テキスト
   * @returns {Array} 相対日付表現の配列
   */
  extractRelativeDates(text) {
    const relativeDates = [];
    const patterns = [
      { regex: /明日/g, offset: 1 },
      { regex: /明後日/g, offset: 2 },
      { regex: /昨日/g, offset: -1 },
      { regex: /一昨日/g, offset: -2 },
      { regex: /今日/g, offset: 0 },
      { regex: /来週/g, offset: 7 },
      { regex: /先週/g, offset: -7 },
      { regex: /来月/g, offset: 30 },
      { regex: /先月/g, offset: -30 }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        relativeDates.push({
          text: match[0],
          offset: pattern.offset,
          index: match.index
        });
      }
    }

    return relativeDates;
  },

  /**
   * 添付関連のキーワードを検出する
   * @param {string} text 本文テキスト
   * @returns {Array} 検出されたキーワード
   */
  detectAttachmentKeywords(text) {
    const keywords = [
      '添付', '別添', '同封', 'ファイル', '資料', '書類',
      'PDFを', 'エクセルを', 'Excelを', '画像を', '写真を', '見積書',
      '請求書', '契約書', '報告書', '図面', 'データを', '表を',
      'attached', 'attachment', 'enclosed', 'file'
    ];

    const found = [];
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        found.push(keyword);
      }
    }

    return found;
  },

  /**
   * 数字の整合性チェック用に数値を抽出する
   * @param {string} text 本文テキスト
   * @returns {Array} 抽出された数値情報
   */
  extractNumbers(text) {
    const numbers = [];

    // 金額パターン
    const moneyPattern = /[\d,]+円|¥[\d,]+|[\d,]+ドル|\$[\d,]+/g;
    let match;
    while ((match = moneyPattern.exec(text)) !== null) {
      numbers.push({
        type: 'money',
        text: match[0],
        index: match.index
      });
    }

    // 個数・数量パターン
    const countPattern = /\d+[個件名人枚本台]/g;
    while ((match = countPattern.exec(text)) !== null) {
      numbers.push({
        type: 'count',
        text: match[0],
        index: match.index
      });
    }

    return numbers;
  }
};
