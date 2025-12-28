// 確認ダイアログUI
// 送信前チェック結果を表示するモーダルダイアログ

const ConfirmationDialog = {
  dialogId: 'gmail-send-checker-dialog',
  overlayId: 'gmail-send-checker-overlay',

  /**
   * ダイアログを表示する
   * @param {Object} emailData メールデータ
   * @param {Array} checkResults チェック結果の配列
   * @returns {Promise<boolean>} 送信を続行するかどうか
   */
  show(emailData, checkResults) {
    return new Promise((resolve) => {
      // 既存のダイアログを削除
      this.remove();

      // オーバーレイの作成
      const overlay = document.createElement('div');
      overlay.id = this.overlayId;
      overlay.className = 'gsc-overlay';

      // ダイアログの作成
      const dialog = document.createElement('div');
      dialog.id = this.dialogId;
      dialog.className = 'gsc-dialog';

      // ダイアログ内容を生成
      dialog.innerHTML = this.generateContent(emailData, checkResults);

      // ボタンイベントの設定
      dialog.querySelector('.gsc-btn-send').addEventListener('click', () => {
        this.remove();
        resolve(true);
      });

      dialog.querySelector('.gsc-btn-cancel').addEventListener('click', () => {
        this.remove();
        resolve(false);
      });

      // ESCキーでキャンセル
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.remove();
          document.removeEventListener('keydown', escHandler);
          resolve(false);
        }
      };
      document.addEventListener('keydown', escHandler);

      // DOMに追加
      document.body.appendChild(overlay);
      document.body.appendChild(dialog);

      // フォーカスをダイアログに
      dialog.querySelector('.gsc-btn-cancel').focus();
    });
  },

  /**
   * ダイアログを削除する
   */
  remove() {
    const overlay = document.getElementById(this.overlayId);
    const dialog = document.getElementById(this.dialogId);
    if (overlay) overlay.remove();
    if (dialog) dialog.remove();
  },

  /**
   * ダイアログ内容を生成する
   * @param {Object} emailData メールデータ
   * @param {Array} checkResults チェック結果
   * @returns {string} HTML文字列
   */
  generateContent(emailData, checkResults) {
    const hasErrors = checkResults.some(r => r.severity === 'error');
    const hasWarnings = checkResults.some(r => r.severity === 'warning');

    let statusClass = 'gsc-status-ok';
    let statusIcon = '✓';
    let statusText = '問題は検出されませんでした';

    if (hasErrors) {
      statusClass = 'gsc-status-error';
      statusIcon = '!';
      statusText = 'エラーが検出されました';
    } else if (hasWarnings) {
      statusClass = 'gsc-status-warning';
      statusIcon = '!';
      statusText = '確認が必要な項目があります';
    }

    return `
      <div class="gsc-header">
        <h2>送信前確認</h2>
        <span class="gsc-status ${statusClass}">
          <span class="gsc-status-icon">${statusIcon}</span>
          ${statusText}
        </span>
      </div>

      <div class="gsc-content">
        ${this.generateEmailSummary(emailData)}
        ${this.generateCheckResults(checkResults)}
      </div>

      <div class="gsc-footer">
        <button class="gsc-btn gsc-btn-cancel">キャンセル</button>
        <button class="gsc-btn gsc-btn-send ${hasErrors ? 'gsc-btn-danger' : ''}">
          ${hasErrors ? 'それでも送信' : '送信'}
        </button>
      </div>
    `;
  },

  /**
   * メール概要を生成する
   * @param {Object} emailData メールデータ
   * @returns {string} HTML文字列
   */
  generateEmailSummary(emailData) {
    const recipients = emailData.recipients || {};
    const allRecipients = [
      ...(recipients.to || []),
      ...(recipients.cc || []),
      ...(recipients.bcc || [])
    ];

    return `
      <div class="gsc-section gsc-summary">
        <h3>メール内容</h3>
        <table class="gsc-table">
          <tr>
            <th>送信元</th>
            <td>${this.escapeHtml(emailData.sender || '不明')}</td>
          </tr>
          <tr>
            <th>宛先</th>
            <td>
              ${recipients.to?.length ? '<strong>To:</strong> ' + this.escapeHtml(recipients.to.join(', ')) + '<br>' : ''}
              ${recipients.cc?.length ? '<strong>Cc:</strong> ' + this.escapeHtml(recipients.cc.join(', ')) + '<br>' : ''}
              ${recipients.bcc?.length ? '<strong>Bcc:</strong> ' + this.escapeHtml(recipients.bcc.join(', ')) : ''}
              ${allRecipients.length === 0 ? '<span class="gsc-error">宛先なし</span>' : ''}
            </td>
          </tr>
          <tr>
            <th>件名</th>
            <td>${this.escapeHtml(emailData.subject || '（件名なし）')}</td>
          </tr>
          <tr>
            <th>添付</th>
            <td>${emailData.attachments?.length ? this.escapeHtml(emailData.attachments.join(', ')) : 'なし'}</td>
          </tr>
        </table>
      </div>
    `;
  },

  /**
   * チェック結果を生成する
   * @param {Array} checkResults チェック結果
   * @returns {string} HTML文字列
   */
  generateCheckResults(checkResults) {
    const errorResults = checkResults.filter(r => r.severity === 'error');
    const warningResults = checkResults.filter(r => r.severity === 'warning');
    const infoResults = checkResults.filter(r => r.severity === 'info' && r.message);

    let html = '<div class="gsc-section gsc-results">';
    html += '<h3>チェック結果</h3>';

    if (errorResults.length > 0) {
      html += '<div class="gsc-result-group gsc-errors">';
      html += '<h4>エラー</h4>';
      html += '<ul>';
      for (const result of errorResults) {
        html += `<li>${this.escapeHtml(result.message).replace(/\n/g, '<br>')}</li>`;
      }
      html += '</ul></div>';
    }

    if (warningResults.length > 0) {
      html += '<div class="gsc-result-group gsc-warnings">';
      html += '<h4>警告</h4>';
      html += '<ul>';
      for (const result of warningResults) {
        html += `<li>${this.escapeHtml(result.message).replace(/\n/g, '<br>')}</li>`;
      }
      html += '</ul></div>';
    }

    if (infoResults.length > 0 && errorResults.length === 0 && warningResults.length === 0) {
      html += '<div class="gsc-result-group gsc-info">';
      html += '<p>すべてのチェックをパスしました</p>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  /**
   * HTMLエスケープ
   * @param {string} text テキスト
   * @returns {string} エスケープされたテキスト
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
