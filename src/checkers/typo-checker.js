// 誤字脱字チェッカー
// ローカル辞書ベースの誤字検出（オフライン対応）

const TypoChecker = {
  // よくある誤変換・誤入力パターン
  typoPatterns: [
    // 敬語の重複・誤り
    { wrong: 'ございいます', correct: 'ございます' },
    { wrong: 'おりいます', correct: 'おります' },
    { wrong: 'いいたします', correct: 'いたします' },
    { wrong: '頂きいます', correct: '頂きます' },
    { wrong: 'いただきいます', correct: 'いただきます' },
    { wrong: 'ますます', correct: 'ます。', note: '重複の可能性' },
    { wrong: 'お疲れ様さまです', correct: 'お疲れ様です' },
    { wrong: 'お疲れさまさまです', correct: 'お疲れ様です' },
    { wrong: 'ご確認認', correct: 'ご確認' },
    { wrong: '宜しく尾願いします', correct: 'よろしくお願いします' },
    { wrong: '宜しくお願いしいます', correct: 'よろしくお願いいたします' },
    { wrong: '下さいませ。。', correct: '下さいませ。' },

    // 漢字の誤変換
    { wrong: '確人', correct: '確認' },
    { wrong: '連楽', correct: '連絡' },
    { wrong: '以情', correct: '以上' },
    { wrong: '依頼依頼', correct: '依頼' },
    { wrong: '報告報告', correct: '報告' },
    { wrong: '対応対応', correct: '対応' },

    // 同音異義語
    { wrong: '移行の件', correct: '以降の件', note: '文脈確認推奨' },
    { wrong: '維持の件', correct: '意地の件', note: '文脈確認推奨' },

    // 句読点の誤り
    { wrong: '。。', correct: '。' },
    { wrong: '、、', correct: '、' },
    { wrong: '？？', correct: '？' },
    { wrong: '!!', correct: '！' },

    // 英語スペルミス（よくあるもの）
    { wrong: 'recieve', correct: 'receive' },
    { wrong: 'occured', correct: 'occurred' },
    { wrong: 'seperate', correct: 'separate' },
    { wrong: 'accomodate', correct: 'accommodate' },
    { wrong: 'definately', correct: 'definitely' },
    { wrong: 'occassion', correct: 'occasion' },
    { wrong: 'untill', correct: 'until' },
    { wrong: 'tommorow', correct: 'tomorrow' },
    { wrong: 'calender', correct: 'calendar' },
    { wrong: 'acommodate', correct: 'accommodate' }
  ],

  /**
   * 誤字脱字をチェックする
   * @param {string} text 本文テキスト
   * @param {Object} settings 設定
   * @returns {Object} チェック結果
   */
  check(text, settings = {}) {
    const result = {
      type: 'typo',
      passed: true,
      message: '',
      severity: 'info',
      details: {
        issues: []
      }
    };

    if (!text || text.trim().length === 0) {
      result.message = '本文が空です';
      return result;
    }

    // 誤字パターンのチェック
    for (const pattern of this.typoPatterns) {
      if (text.includes(pattern.wrong)) {
        result.details.issues.push({
          found: pattern.wrong,
          suggestion: pattern.correct,
          note: pattern.note || ''
        });
      }
    }

    // カスタム辞書があれば追加チェック
    if (settings.customPatterns && Array.isArray(settings.customPatterns)) {
      for (const pattern of settings.customPatterns) {
        if (text.includes(pattern.wrong)) {
          result.details.issues.push({
            found: pattern.wrong,
            suggestion: pattern.correct,
            note: pattern.note || 'カスタム辞書'
          });
        }
      }
    }

    // 結果の生成
    if (result.details.issues.length > 0) {
      result.passed = false;
      result.severity = 'warning';
      const issueMessages = result.details.issues.map(issue =>
        `「${issue.found}」→「${issue.suggestion}」${issue.note ? ` (${issue.note})` : ''}`
      );
      result.message = `誤字・誤変換の可能性:\n${issueMessages.join('\n')}`;
    } else {
      result.message = '明らかな誤字は検出されませんでした';
    }

    return result;
  }
};
