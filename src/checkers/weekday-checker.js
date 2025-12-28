// 曜日整合性チェッカー
// 日付と曜日の組み合わせを抽出して確認を促す

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
        patterns: []
      }
    };

    if (!text || text.trim().length === 0) {
      return result;
    }

    // 日付と曜日のパターンを抽出
    const patterns = this.extractDateWeekdayPatterns(text);
    result.details.patterns = patterns;

    // 日付・曜日が検出された場合は確認を促す
    if (patterns.length > 0) {
      result.passed = true; // エラーではなく確認のみ
      result.severity = 'warning'; // 警告として表示

      const patternList = patterns.map(p => {
        const actualWeekday = this.getActualWeekday(p.year, p.month, p.day);
        const match = (actualWeekday === p.claimedWeekday) ? '✓' : '?';
        return `  ${match} ${p.text}`;
      }).join('\n');

      result.message = `以下の日付と曜日をご確認ください:\n${patternList}`;
    } else {
      result.message = '';
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
    const seenTexts = new Set(); // 重複排除用

    // パターン1: MM月DD日（曜）or MM月DD日（曜日）
    const pattern1 = /(\d{1,2})月(\d{1,2})日[（(]([日月火水木金土])曜?日?[）)]/g;
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      if (!seenTexts.has(match[0])) {
        seenTexts.add(match[0]);
        results.push({
          text: match[0],
          year: currentYear,
          month: parseInt(match[1]),
          day: parseInt(match[2]),
          claimedWeekday: match[3]
        });
      }
    }

    // パターン2: MM/DD（曜）or MM/DD（曜日）- 年なしスラッシュ形式
    const pattern2 = /(\d{1,2})\/(\d{1,2})[（(]([日月火水木金土])曜?日?[）)]/g;
    while ((match = pattern2.exec(text)) !== null) {
      if (!seenTexts.has(match[0])) {
        seenTexts.add(match[0]);
        results.push({
          text: match[0],
          year: currentYear,
          month: parseInt(match[1]),
          day: parseInt(match[2]),
          claimedWeekday: match[3]
        });
      }
    }

    // パターン3: YYYY年MM月DD日（曜）
    const pattern3 = /(\d{4})年(\d{1,2})月(\d{1,2})日[（(]([日月火水木金土])曜?日?[）)]/g;
    while ((match = pattern3.exec(text)) !== null) {
      if (!seenTexts.has(match[0])) {
        seenTexts.add(match[0]);
        results.push({
          text: match[0],
          year: parseInt(match[1]),
          month: parseInt(match[2]),
          day: parseInt(match[3]),
          claimedWeekday: match[4]
        });
      }
    }

    // パターン4: YYYY/MM/DD（曜）- 年ありスラッシュ形式
    const pattern4 = /(\d{4})\/(\d{1,2})\/(\d{1,2})[（(]([日月火水木金土])曜?日?[）)]/g;
    while ((match = pattern4.exec(text)) !== null) {
      if (!seenTexts.has(match[0])) {
        seenTexts.add(match[0]);
        results.push({
          text: match[0],
          year: parseInt(match[1]),
          month: parseInt(match[2]),
          day: parseInt(match[3]),
          claimedWeekday: match[4]
        });
      }
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
