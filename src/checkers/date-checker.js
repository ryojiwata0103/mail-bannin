// 日付整合性チェッカー
// 「明日」と書いて過去日付など矛盾を検出

const DateChecker = {
  /**
   * 日付の整合性をチェックする
   * @param {string} text 本文テキスト
   * @param {Date} sendDate 送信日時
   * @param {Object} settings 設定
   * @returns {Object} チェック結果
   */
  check(text, sendDate = new Date(), settings = {}) {
    const result = {
      type: 'date',
      passed: true,
      message: '',
      severity: 'info',
      details: {
        issues: [],
        foundDates: []
      }
    };

    if (!text || text.trim().length === 0) {
      return result;
    }

    // 日付パターンを抽出
    const dates = this.extractDates(text);
    result.details.foundDates = dates;

    // 今日の日付（時間をリセット）
    const today = new Date(sendDate.getFullYear(), sendDate.getMonth(), sendDate.getDate());

    // 各日付をチェック
    for (const dateInfo of dates) {
      const date = dateInfo.date;

      // 過去日付のチェック
      if (date < today) {
        const daysDiff = Math.ceil((today - date) / (1000 * 60 * 60 * 24));

        // 「明日」「来週」などの未来表現との矛盾チェック
        if (this.hasFutureReference(text, dateInfo)) {
          result.details.issues.push({
            type: 'past_date',
            text: dateInfo.text,
            message: `「${dateInfo.text}」は${daysDiff}日前の日付です`,
            severity: 'warning'
          });
        }
      }

      // 1年以上先の日付チェック
      const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
      if (date > oneYearLater) {
        result.details.issues.push({
          type: 'far_future',
          text: dateInfo.text,
          message: `「${dateInfo.text}」は1年以上先の日付です`,
          severity: 'warning'
        });
      }
    }

    // 相対日付表現のチェック
    const relativeIssues = this.checkRelativeDates(text, today);
    result.details.issues.push(...relativeIssues);

    // 結果の生成
    if (result.details.issues.length > 0) {
      result.passed = false;
      result.severity = 'warning';
      const messages = result.details.issues.map(issue => issue.message);
      result.message = `日付の確認が必要:\n${messages.join('\n')}`;
    } else if (dates.length > 0) {
      result.message = `${dates.length}個の日付を検出（問題なし）`;
    } else {
      result.message = '日付表現は検出されませんでした';
    }

    return result;
  },

  /**
   * 本文から日付を抽出する
   * @param {string} text 本文
   * @returns {Array} 日付情報の配列
   */
  extractDates(text) {
    const dates = [];
    const currentYear = new Date().getFullYear();

    // YYYY年MM月DD日 パターン
    let match;
    const pattern1 = /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/g;
    while ((match = pattern1.exec(text)) !== null) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      dates.push({
        text: match[0],
        date: new Date(year, month, day),
        index: match.index
      });
    }

    // MM月DD日 パターン
    const pattern2 = /(\d{1,2})月(\d{1,2})日/g;
    while ((match = pattern2.exec(text)) !== null) {
      // 年付きパターンで既に検出済みか確認
      const alreadyFound = dates.some(d =>
        d.index <= match.index && d.index + d.text.length > match.index
      );
      if (!alreadyFound) {
        const month = parseInt(match[1]) - 1;
        const day = parseInt(match[2]);
        dates.push({
          text: match[0],
          date: new Date(currentYear, month, day),
          index: match.index
        });
      }
    }

    return dates;
  },

  /**
   * 未来を示す表現があるかチェック
   * @param {string} text 本文
   * @param {Object} dateInfo 日付情報
   * @returns {boolean} 未来表現があるか
   */
  hasFutureReference(text, dateInfo) {
    const futurePatterns = ['明日', '来週', '来月', '予定', '予約', '開催'];
    const beforeDate = text.substring(Math.max(0, dateInfo.index - 20), dateInfo.index);

    for (const pattern of futurePatterns) {
      if (beforeDate.includes(pattern)) {
        return true;
      }
    }
    return false;
  },

  /**
   * 相対日付表現をチェック
   * @param {string} text 本文
   * @param {Date} today 今日の日付
   * @returns {Array} 問題の配列
   */
  checkRelativeDates(text, today) {
    const issues = [];

    // 「明日」と過去日付が同時に存在するパターン
    if (text.includes('明日') && text.includes('昨日')) {
      // 両方が存在する場合は警告しない（文脈による）
    }

    return issues;
  }
};
