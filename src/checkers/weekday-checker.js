// 曜日整合性チェッカー
// 日付と曜日の整合性を確認

const WeekdayChecker = {
  // 曜日の対応表
  weekdays: ['日', '月', '火', '水', '木', '金', '土'],
  weekdaysFull: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],

  /**
   * 曜日の整合性をチェックする
   * @param {string} text 本文テキスト
   * @param {Object} settings 設定
   * @returns {Object} チェック結果
   */
  check(text, settings = {}) {
    const result = {
      type: 'weekday',
      passed: true,
      message: '',
      severity: 'info',
      details: {
        issues: [],
        checked: []
      }
    };

    if (!text || text.trim().length === 0) {
      return result;
    }

    // 日付と曜日のパターンを抽出してチェック
    const patterns = this.extractDateWeekdayPatterns(text);
    result.details.checked = patterns;

    for (const pattern of patterns) {
      const actualWeekday = this.getActualWeekday(pattern.year, pattern.month, pattern.day);

      if (actualWeekday !== pattern.claimedWeekday) {
        result.details.issues.push({
          text: pattern.text,
          claimed: pattern.claimedWeekday,
          actual: actualWeekday,
          message: `${pattern.month}月${pattern.day}日は${actualWeekday}曜日です（${pattern.claimedWeekday}曜日と記載）`
        });
      }
    }

    // 結果の生成
    if (result.details.issues.length > 0) {
      result.passed = false;
      result.severity = 'error';
      const messages = result.details.issues.map(issue => issue.message);
      result.message = `曜日の誤り:\n${messages.join('\n')}`;
    } else if (patterns.length > 0) {
      result.message = `${patterns.length}個の日付・曜日を確認（問題なし）`;
    } else {
      result.message = '曜日付きの日付は検出されませんでした';
    }

    return result;
  },

  /**
   * 本文から日付+曜日のパターンを抽出する
   * @param {string} text 本文
   * @returns {Array} パターン情報の配列
   */
  extractDateWeekdayPatterns(text) {
    const results = [];
    const currentYear = new Date().getFullYear();

    // パターン1: MM月DD日（曜）or MM月DD日（曜日）
    const pattern1 = /(\d{1,2})月(\d{1,2})日[（(]([日月火水木金土])曜?日?[）)]/g;
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      results.push({
        text: match[0],
        year: currentYear,
        month: parseInt(match[1]),
        day: parseInt(match[2]),
        claimedWeekday: match[3]
      });
    }

    // パターン2: YYYY年MM月DD日（曜）
    const pattern2 = /(\d{4})[年\/](\d{1,2})[月\/](\d{1,2})日?[（(]([日月火水木金土])曜?日?[）)]/g;
    while ((match = pattern2.exec(text)) !== null) {
      results.push({
        text: match[0],
        year: parseInt(match[1]),
        month: parseInt(match[2]),
        day: parseInt(match[3]),
        claimedWeekday: match[4]
      });
    }

    // パターン3: YYYY/MM/DD（曜）
    const pattern3 = /(\d{4})\/(\d{1,2})\/(\d{1,2})[（(]([日月火水木金土])曜?日?[）)]/g;
    while ((match = pattern3.exec(text)) !== null) {
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
   * 実際の曜日を取得する
   * @param {number} year 年
   * @param {number} month 月（1-12）
   * @param {number} day 日
   * @returns {string} 曜日（漢字一文字）
   */
  getActualWeekday(year, month, day) {
    const date = new Date(year, month - 1, day);
    return this.weekdays[date.getDay()];
  }
};
