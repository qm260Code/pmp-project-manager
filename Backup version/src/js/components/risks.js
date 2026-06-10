import { store } from '../store.js';
import { PmpCalculators } from '../utils/pmpCalculators.js';
import { ModalHelper } from '../app.js';

export class RisksComponent {
  constructor(container) {
    this.container = container;
    this.heatmap = document.getElementById('risk-heatmap-container');
    this.tableBody = document.getElementById('risk-table-body');
    this.btnAdd = document.getElementById('btn-add-risk');
    this.filterTag = document.getElementById('risk-filter-tag');
    
    this.activeFilter = null; // Holds { p, i } when filtered
    
    this.initEvents();
    this.render();
    
    store.subscribe('state-updated', () => {
      this.render();
    });
  }

  initEvents() {
    this.btnAdd.addEventListener('click', () => this.openAddModal());
    
    // Clear filter tag when clicked
    this.filterTag.addEventListener('click', () => {
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
    // Computes PxI matrix
    // Y-Axis: Probability (5 descending to 1)
    // X-Axis: Impact (1 ascending to 5)
    
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
      <div class="heatmap-label-y">P (概)</div>
      <div class="heatmap-label-y">5 (高)</div>
      <div class="heatmap-label-y">4</div>
      <div class="heatmap-label-y">3</div>
      <div class="heatmap-label-y">2</div>
      <div class="heatmap-label-y">1 (低)</div>
      <div class="heatmap-label-x"></div>
    `;

    // Row loop (5 down to 1)
    for (let p = 5; p >= 1; p--) {
      // Column loop (1 up to 5)
      for (let i = 1; i <= 5; i++) {
        const score = p * i;
        const count = counts[`${p}_${i}`] || 0;
        
        // Determine risk level based on (p, i) coordinates to match reference image layout
        let level = 'low';
        if (p === 5) {
          if (i === 1) level = 'low';
          else if (i === 2) level = 'med';
          else if (i === 3) level = 'high';
          else if (i === 4) level = 'veryhigh';
          else if (i === 5) level = 'critical';
        } else if (p === 4) {
          if (i === 1) level = 'low';
          else if (i === 2) level = 'med';
          else if (i === 3) level = 'high';
          else if (i === 4) level = 'veryhigh';
          else if (i === 5) level = 'critical';
        } else if (p === 3) {
          if (i === 1) level = 'low';
          else if (i === 2 || i === 3) level = 'med';
          else if (i === 4 || i === 5) level = 'high';
        } else if (p === 2) {
          if (i <= 3) level = 'low';
          else level = 'med';
        } else if (p === 1) {
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
               title="概率: ${p} | 影响: ${i}\n风险值得分: ${score}分\n当前有 ${count} 个风险">
            ${score}
            ${count > 0 ? `<span class="count">${count}</span>` : ''}
          </div>
        `;
      }
    }

    // X-axis label rows
    html += `
      <div class="heatmap-label-x"></div>
      <div class="heatmap-label-x">1 (低)</div>
      <div class="heatmap-label-x">2</div>
      <div class="heatmap-label-x">3</div>
      <div class="heatmap-label-x">4</div>
      <div class="heatmap-label-x">5 (高)</div>
      <div class="heatmap-label-x" style="grid-column: span 6; font-size:12px; font-weight:700; color:var(--text-secondary); margin-top:4px;">
        影响等级 (Impact) →
      </div>
    `;

    this.heatmap.innerHTML = html;

    // Bind cell click filters
    this.heatmap.querySelectorAll('.heatmap-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const p = Number(cell.getAttribute('data-p'));
        const i = Number(cell.getAttribute('data-i'));
        
        if (this.activeFilter && this.activeFilter.p === p && this.activeFilter.i === i) {
          // Toggle off
          this.activeFilter = null;
        } else {
          this.activeFilter = { p, i };
        }
        this.render();
      });
    });
  }

  renderTable(risks) {
    let filteredRisks = risks;
    
    // Apply heatmap cell filters
    if (this.activeFilter) {
      const { p, i } = this.activeFilter;
      filteredRisks = risks.filter(r => 
        Math.max(1, Math.min(5, Number(r.probability || 1))) === p &&
        Math.max(1, Math.min(5, Number(r.impact || 1))) === i
      );
      this.filterTag.innerHTML = `🔍 筛选: P:${p} / I:${i} &times;`;
      this.filterTag.style.display = 'inline-flex';
      this.filterTag.style.cursor = 'pointer';
    } else {
      this.filterTag.style.display = 'none';
    }

    if (filteredRisks.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted);">
            ${this.activeFilter ? '该级别网格内无匹配的风险条目。' : '暂无风险记录，请点击右上角新增。'}
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filteredRisks.forEach(risk => {
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
      
      html += `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${risk.description}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top:2px;">
              状态: <strong>${risk.status === 'Active' ? '监控中 (Active)' : '已关闭 (Closed)'}</strong>
            </div>
          </td>
          <td>
            <span style="font-size: 13px;">${risk.category}</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:700; color:${ratingColor}; font-size:15px;">${calc.score}</span>
              <span style="font-size:11px; color:var(--text-muted);">(P:${calc.probability} &times; I:${calc.impact})</span>
            </div>
          </td>
          <td>
            <span class="badge ${ratingClass}">${calc.rating}</span>
          </td>
          <td>
            <div style="font-size:13px; color:var(--text-primary);">策略: <strong>${risk.strategy}</strong></div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">责任人: ${risk.owner || '未分配'}</div>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-edit-risk" data-id="${risk.id}" style="padding: 3px 8px; font-size:12px;">编辑</button>
              <button class="btn btn-danger btn-delete-risk" data-id="${risk.id}" style="padding: 3px 8px; font-size:12px;">删除</button>
            </div>
          </td>
        </tr>
      `;
    });
    this.tableBody.innerHTML = html;

    // Bind Edit/Delete buttons
    this.tableBody.querySelectorAll('.btn-edit-risk').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const risk = risks.find(item => item.id === id);
        if (risk) this.openEditModal(risk);
      });
    });

    this.tableBody.querySelectorAll('.btn-delete-risk').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('确定要删除这条风险登记吗？')) {
          store.deleteRisk(id);
          store.publish('notify', { type: 'success', message: '已从登记册中移除风险。' });
        }
      });
    });
  }

  getFormHtml(risk = {}) {
    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="risk-desc">风险描述 / 危害:</label>
          <input type="text" id="risk-desc" name="description" class="form-control" value="${risk.description || ''}" placeholder="如：XX设备供应商交货期延误" required>
        </div>
        <div class="form-group">
          <label for="risk-cat">风险分类 (Category):</label>
          <select id="risk-cat" name="category" class="form-control">
            <option value="Technical" ${risk.category === 'Technical' ? 'selected' : ''}>技术风险 (Technical) - 如软硬件故障、网络带宽</option>
            <option value="External" ${risk.category === 'External' ? 'selected' : ''}>外部风险 (External) - 如供应商、法规政策</option>
            <option value="Organizational" ${risk.category === 'Organizational' ? 'selected' : ''}>组织风险 (Organizational) - 如资金链、人员调动</option>
            <option value="PM" ${risk.category === 'PM' || !risk.category ? 'selected' : ''}>项目管理风险 (PM) - 如进度编排不当、范围蔓延</option>
          </select>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="risk-prob">发生概率 (Probability, 1-5):</label>
            <select id="risk-prob" name="probability" class="form-control">
              ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${Number(risk.probability || 3) === n ? 'selected' : ''}>${n} ${n >= 4 ? '(高)' : n <= 2 ? '(低)' : '(中)'}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="risk-imp">影响程度 (Impact, 1-5):</label>
            <select id="risk-imp" name="impact" class="form-control">
              ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${Number(risk.impact || 3) === n ? 'selected' : ''}>${n} ${n >= 4 ? '(极重)' : n <= 2 ? '(轻微)' : '(中度)'}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="risk-strat">应对策略 (Strategy):</label>
            <select id="risk-strat" name="strategy" class="form-control">
              <option value="Avoid" ${risk.strategy === 'Avoid' ? 'selected' : ''}>规避 (Avoid) - 改变计划消除威胁</option>
              <option value="Mitigate" ${risk.strategy === 'Mitigate' || !risk.strategy ? 'selected' : ''}>减轻 (Mitigate) - 降低概率或影响</option>
              <option value="Transfer" ${risk.strategy === 'Transfer' ? 'selected' : ''}>转移 (Transfer) - 买保险/外包出包</option>
              <option value="Accept" ${risk.strategy === 'Accept' ? 'selected' : ''}>接受 (Accept) - 不做改变，建立应急储备</option>
            </select>
          </div>
          <div class="form-group">
            <label for="risk-owner">责任承担人 (Owner):</label>
            <input type="text" id="risk-owner" name="owner" class="form-control" value="${risk.owner || ''}" placeholder="如：李项目经理" required>
          </div>
        </div>
        <div class="form-group">
          <label for="risk-status">状态:</label>
          <select id="risk-status" name="status" class="form-control">
            <option value="Active" ${risk.status === 'Active' || !risk.status ? 'selected' : ''}>监控激活中 (Active)</option>
            <option value="Closed" ${risk.status === 'Closed' ? 'selected' : ''}>已关闭解决 (Closed)</option>
          </select>
        </div>
      </div>
    `;
  }

  openAddModal() {
    ModalHelper.open(
      '新增项目风险登记',
      this.getFormHtml(),
      (data) => {
        store.addRisk(data);
        store.publish('notify', { type: 'success', message: '已成功登记新风险项。' });
        return true;
      }
    );
  }

  openEditModal(risk) {
    ModalHelper.open(
      `编辑风险评估: ${risk.description}`,
      this.getFormHtml(risk),
      (data) => {
        store.updateRisk(risk.id, data);
        store.publish('notify', { type: 'success', message: '风险评估已更新。' });
        return true;
      }
    );
  }
}
