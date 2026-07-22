import { store } from '../store.js';
import { PmpCalculators } from '../utils/pmpCalculators.js';
import { ModalHelper } from '../app.js';
import { t } from '../utils/i18n.js';

export class RisksComponent {
  constructor(container) {
    this.container = container;
    this.heatmap = document.getElementById('risk-heatmap-container');
    this.tableBody = document.getElementById('risk-table-body');
    this.btnAdd = document.getElementById('btn-add-risk');
    this.filterTag = document.getElementById('risk-filter-tag');
    if (!this.filterTag && this.container) {
      this.filterTag = document.createElement('span');
      this.filterTag.id = 'risk-filter-tag';
      this.filterTag.className = 'filter-tag';
      this.container.querySelector('.page-header')?.appendChild(this.filterTag);
    }

    this.activeFilter = null; // Holds { p, i } when filtered

    this.initEvents();
    this.render();

    this._unsubscribe = store.subscribe('state-updated', () => {
      this.render();
    });
  }

  initEvents() {
    this.btnAdd.addEventListener('click', () => this.openAddModal());
    
    // Clear filter tag when clicked
    this.filterTag?.addEventListener('click', () => {
      this.activeFilter = null;
      this.render();
    });
  }

  render() {
    const risks = store.state.risks || [];
    this.renderHeatmap(risks);
    this.renderTable(risks);
  }

  renderHeatmap(risks) {
    const lang = store.state.language || 'en';
    const isEn = lang !== 'zh';

    const pLabel = isEn ? 'P (Prob)' : 'P (概)';
    const highLabel = isEn ? 'High' : '高';
    const lowLabel = isEn ? 'Low' : '低';
    const impactLabel = isEn ? 'Impact Level →' : '影响等级 (Impact) →';

    // Aggregate counts for each cell
    const counts = {};
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        counts[`${p}_${i}`] = 0;
      }
    }

    risks.forEach(r => {
      const p = Math.max(1, Math.min(5, Number(r.probability || 1)));
      const i = Math.max(1, Math.min(5, Number(r.impact || 1)));
      counts[`${p}_${i}`]++;
    });

    let html = `
      <!-- Labels -->
      <div class="heatmap-label-y" style="font-weight:700;">${pLabel}</div>
      <div class="heatmap-label-y">5 (${highLabel})</div>
      <div class="heatmap-label-y">4</div>
      <div class="heatmap-label-y">3</div>
      <div class="heatmap-label-y">2</div>
      <div class="heatmap-label-y">1 (${lowLabel})</div>
      <div class="heatmap-label-x"></div>
    `;

    // Row loop (5 down to 1)
    for (let p = 5; p >= 1; p--) {
      // Column loop (1 up to 5)
      for (let i = 1; i <= 5; i++) {
        const score = p * i;
        const count = counts[`${p}_${i}`] || 0;
        
        let level = 'low';
        // Use the same rating logic as PmpCalculators.calculateRisk (score >= 12 → high, >= 5 → med)
        if (score >= 12) {
          level = score >= 20 ? 'critical' : score >= 16 ? 'veryhigh' : 'high';
        } else if (score >= 5) {
          level = 'med';
        } else {
          level = 'low';
        }
        
        // Heatmap cell color class
        const cellClass = `h-cell-${score} h-cell-${level}`;
        const isActive = this.activeFilter && this.activeFilter.p === p && this.activeFilter.i === i;
        const borderStyle = isActive ? 'border: 2px solid var(--text-primary); box-shadow: 0 0 10px rgba(255,255,255,0.8);' : '';
        
        html += `
          <div class="heatmap-cell ${cellClass}" 
               data-p="${p}" 
               data-i="${i}" 
               style="${borderStyle}"
               title="P: ${p} | I: ${i}\nScore: ${score} pts\nActive risks: ${count}">
             ${score}
             ${count > 0 ? `<span class="count">${count}</span>` : ''}
          </div>
        `;
      }
    }

    // X-axis label rows
    html += `
      <div class="heatmap-label-x"></div>
      <div class="heatmap-label-x">1 (${lowLabel})</div>
      <div class="heatmap-label-x">2</div>
      <div class="heatmap-label-x">3</div>
      <div class="heatmap-label-x">4</div>
      <div class="heatmap-label-x">5 (${highLabel})</div>
      <div class="heatmap-label-x" style="grid-column: span 6; font-size:12px; font-weight:700; color:var(--text-secondary); margin-top:4px;">
        ${impactLabel}
      </div>
    `;

    this.heatmap.innerHTML = html;

    // Bind cell click filters
    this.heatmap.querySelectorAll('.heatmap-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const p = Number(cell.getAttribute('data-p'));
        const i = Number(cell.getAttribute('data-i'));
        
        if (this.activeFilter && this.activeFilter.p === p && this.activeFilter.i === i) {
          this.activeFilter = null;
        } else {
          this.activeFilter = { p, i };
        }
        this.render();
      });
    });
  }

  renderTable(risks) {
    const lang = store.state.language || 'en';
    let filteredRisks = risks;

    // Apply heatmap cell filters
    if (this.activeFilter) {
      const { p, i } = this.activeFilter;
      filteredRisks = risks.filter(r =>
        Math.max(1, Math.min(5, Number(r.probability || 1))) === p &&
        Math.max(1, Math.min(5, Number(r.impact || 1))) === i
      );
      this.filterTag.innerHTML = `🔍 Filter: P:${p} / I:${i} &times;`;
      this.filterTag.style.display = 'inline-flex';
      this.filterTag.style.cursor = 'pointer';
    } else {
      this.filterTag.style.display = 'none';
    }

    if (filteredRisks.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted);">
            ${this.activeFilter ? 'No matching risk entries found in this grid cell.' : 'No risks registered. Click upper right to add.'}
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filteredRisks.forEach(risk => {
      // Use PmpCalculators for consistent rating (same logic as everywhere else)
      const calc = PmpCalculators.calculateRisk(risk.probability, risk.impact);

      let ratingClass = 'badge-planning';
      let ratingColor = 'var(--text-muted)';

      if (calc.rating === 'High') {
        ratingClass = 'badge-closing';
        ratingColor = 'var(--status-danger)';
      } else if (calc.rating === 'Medium') {
        ratingClass = 'badge-monitoring';
        ratingColor = 'var(--status-warning)';
      } else {
        ratingClass = 'badge-executing';
        ratingColor = 'var(--status-success)';
      }

      const categoryText = t('risk_cat_' + risk.category.toLowerCase().replace(' ', '')) || risk.category;
      const strategyText = t('risk_strat_' + risk.strategy.toLowerCase()) || risk.strategy;
      const statusText = risk.status === 'Active' ? t('risk_status_active') : t('risk_status_closed');

      html += `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${risk.description}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top:2px;">
              ${t('label_risk_status')}: <strong>${statusText}</strong>
            </div>
          </td>
          <td>
            <span style="font-size: 13px;">${categoryText}</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:700; color:${ratingColor}; font-size:15px;">${calc.score}</span>
              <span style="font-size:11px; color:var(--text-muted);">(P:${calc.probability} &times; I:${calc.impact})</span>
            </div>
          </td>
          <td>
            <span class="badge ${ratingClass}">${calc.rating === 'High' ? t('risk_level_high') : calc.rating === 'Medium' ? t('risk_level_med') : t('risk_level_low')}</span>
          </td>
          <td>
            <div style="font-size:13px; color:var(--text-primary);">${t('label_risk_strat')}: <strong>${strategyText}</strong></div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${t('label_risk_owner')}: ${risk.owner || '-'}</div>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary" data-action="edit" data-id="${risk.id}" style="padding: 3px 8px; font-size:12px;">${t('btn_edit')}</button>
              <button class="btn btn-danger" data-action="delete" data-id="${risk.id}" style="padding: 3px 8px; font-size:12px;">${t('btn_delete')}</button>
            </div>
          </td>
        </tr>
      `;
    });
    this.tableBody.innerHTML = html;

    // Single delegated listener
    this.tableBody.onclick = (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'edit') {
        const risk = risks.find(item => item.id === id);
        if (risk) this.openEditModal(risk);
      } else if (btn.dataset.action === 'delete') {
        if (confirm(t('msg_confirm_delete_risk') || 'Are you sure you want to delete this risk log entry?')) {
          store.deleteRisk(id);
          store.publish('notify', { type: 'success', message: 'Risk entry deleted successfully.' });
        }
      }
    };
  }

  getFormHtml(risk = {}) {
    const lang = store.state.language || 'en';
    const isEn = lang !== 'zh';
    
    const probLabels = isEn ? { high: 'High', med: 'Med', low: 'Low' } : { high: '高', med: '中', low: '低' };
    const impactLabels = isEn ? { severe: 'Severe', med: 'Moderate', minor: 'Minor' } : { severe: '极重', med: '中度', minor: '轻微' };

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="risk-desc">${t('label_risk_desc')}</label>
          <input type="text" id="risk-desc" name="description" class="form-control" value="${risk.description || ''}" placeholder="e.g. Delay in sensor vendor shipment" required>
        </div>
        <div class="form-group">
          <label for="risk-cat">${t('label_risk_cat')}</label>
          <select id="risk-cat" name="category" class="form-control">
            <option value="Technical" ${risk.category === 'Technical' ? 'selected' : ''}>${t('risk_cat_technical')}</option>
            <option value="External" ${risk.category === 'External' ? 'selected' : ''}>${t('risk_cat_external')}</option>
            <option value="Organizational" ${risk.category === 'Organizational' ? 'selected' : ''}>${t('risk_cat_organizational')}</option>
            <option value="PM" ${risk.category === 'PM' || !risk.category ? 'selected' : ''}>${t('risk_cat_pm')}</option>
          </select>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="risk-prob">${t('label_risk_prob')}</label>
            <select id="risk-prob" name="probability" class="form-control">
              ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${Number(risk.probability || 3) === n ? 'selected' : ''}>${n} ${n >= 4 ? `(${probLabels.high})` : n <= 2 ? `(${probLabels.low})` : `(${probLabels.med})`}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="risk-imp">${t('label_risk_impact')}</label>
            <select id="risk-imp" name="impact" class="form-control">
              ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${Number(risk.impact || 3) === n ? 'selected' : ''}>${n} ${n >= 4 ? `(${impactLabels.severe})` : n <= 2 ? `(${impactLabels.minor})` : `(${impactLabels.med})`}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="risk-strat">${t('label_risk_strat')}</label>
            <select id="risk-strat" name="strategy" class="form-control">
              <option value="Avoid" ${risk.strategy === 'Avoid' ? 'selected' : ''}>${t('risk_strat_avoid')}</option>
              <option value="Mitigate" ${risk.strategy === 'Mitigate' || !risk.strategy ? 'selected' : ''}>${t('risk_strat_mitigate')}</option>
              <option value="Transfer" ${risk.strategy === 'Transfer' ? 'selected' : ''}>${t('risk_strat_transfer')}</option>
              <option value="Accept" ${risk.strategy === 'Accept' ? 'selected' : ''}>${t('risk_strat_accept')}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="risk-owner">${t('label_risk_owner')}</label>
            <input type="text" id="risk-owner" name="owner" class="form-control" value="${risk.owner || ''}" placeholder="e.g. John Doe" required>
          </div>
        </div>
        <div class="form-group">
          <label for="risk-status">${t('label_risk_status')}</label>
          <select id="risk-status" name="status" class="form-control">
            <option value="Active" ${risk.status === 'Active' || !risk.status ? 'selected' : ''}>${t('risk_status_active')}</option>
            <option value="Closed" ${risk.status === 'Closed' ? 'selected' : ''}>${t('risk_status_closed')}</option>
          </select>
        </div>
      </div>
    `;
  }

  openAddModal() {
    ModalHelper.open(
      t('modal_risk_add'),
      this.getFormHtml(),
      (data) => {
        store.addRisk(data);
        store.publish('notify', { type: 'success', message: 'Risk added successfully.' });
        return true;
      }
    );
  }

  openEditModal(risk) {
    ModalHelper.open(
      `${t('modal_risk_edit')}: ${risk.description}`,
      this.getFormHtml(risk),
      (data) => {
        store.updateRisk(risk.id, data);
        store.publish('notify', { type: 'success', message: 'Risk analysis updated.' });
        return true;
      }
    );
  }
}
