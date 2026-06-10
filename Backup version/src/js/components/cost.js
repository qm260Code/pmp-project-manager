import { store } from '../store.js';
import { PmpCalculators } from '../utils/pmpCalculators.js';
import { ModalHelper } from '../app.js';

export class CostComponent {
  constructor(container) {
    this.container = container;
    this.kpiContainer = document.getElementById('cost-evm-kpi-container');
    this.tableBody = document.getElementById('cost-table-body');
    this.btnAdd = document.getElementById('btn-add-cost');
    
    this.initEvents();
    this.render();
    
    store.subscribe('state-updated', () => {
      this.render();
    });
  }

  initEvents() {
    this.btnAdd.addEventListener('click', () => this.openAddModal());
  }

  render() {
    const state = store.state;
    const costs = state.costs || [];
    const budget = state.projectInfo.budget || 0;
    
    // Call calculation engine
    const evm = PmpCalculators.calculateEVM(costs, budget);
    
    this.renderKPIs(evm);
    this.renderTable(costs);
  }

  renderKPIs(evm) {
    const cvColor = evm.CV >= 0 ? 'var(--status-success)' : 'var(--status-danger)';
    const svColor = evm.SV >= 0 ? 'var(--status-success)' : 'var(--status-danger)';
    
    const cpiAlert = evm.CPI < 0.9 ? 'color: var(--status-danger);' : evm.CPI >= 1.0 ? 'color: var(--status-success);' : 'color: var(--status-warning);';
    const spiAlert = evm.SPI < 0.9 ? 'color: var(--status-danger);' : evm.SPI >= 1.0 ? 'color: var(--status-success);' : 'color: var(--status-warning);';

    this.kpiContainer.innerHTML = `
      <div class="glass-panel kpi-card" style="border-left: 3px solid var(--accent-primary);">
        <span class="kpi-title">计划价值 (PV) / 实际成本 (AC)</span>
        <span class="kpi-value" style="font-size:22px;">¥${evm.PV.toLocaleString()} / ¥${evm.AC.toLocaleString()}</span>
        <div class="kpi-desc">挣值 (EV): <strong>¥${evm.EV.toLocaleString()}</strong></div>
      </div>
      
      <div class="glass-panel kpi-card" style="border-left: 3px solid ${cvColor};">
        <span class="kpi-title">成本偏差 (CV) / 进度偏差 (SV)</span>
        <span class="kpi-value" style="font-size:22px; color:${cvColor};">¥${evm.CV.toLocaleString()}</span>
        <div class="kpi-desc">进度偏差: <strong style="color:${svColor};">¥${evm.SV.toLocaleString()}</strong></div>
      </div>

      <div class="glass-panel kpi-card" style="border-left: 3px solid var(--accent-secondary);">
        <span class="kpi-title">绩效指数 (CPI & SPI)</span>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <span class="kpi-value" style="font-size:24px; ${cpiAlert}">CPI: ${evm.CPI.toFixed(2)}</span>
          <span class="kpi-value" style="font-size:24px; ${spiAlert}">SPI: ${evm.SPI.toFixed(2)}</span>
        </div>
        <div class="kpi-desc">健康度指标 (目标 >= 1.0)</div>
      </div>

      <div class="glass-panel kpi-card" style="border-left: 3px solid ${evm.VAC >= 0 ? 'var(--status-success)' : 'var(--status-danger)'};">
        <span class="kpi-title">完工估算 (EAC) / 完工偏差 (VAC)</span>
        <span class="kpi-value" style="font-size:22px;">¥${Math.round(evm.EAC).toLocaleString()}</span>
        <div class="kpi-desc">
          完工偏差 (VAC): <strong style="color:${evm.VAC >= 0 ? 'var(--status-success)' : 'var(--status-danger)'};">¥${Math.round(evm.VAC).toLocaleString()}</strong>
        </div>
      </div>
    `;
  }

  renderTable(costs) {
    if (costs.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted);">
            暂无费用分配明细，请在右上角新增。
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    costs.forEach(item => {
      // Calculate progress percentage
      const progressPercent = item.plannedValue > 0 ? Math.round((item.earnedValue / item.plannedValue) * 100) : 0;
      
      html += `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${item.description}</div>
          </td>
          <td>
            <span style="font-size: 14px;">¥${Number(item.plannedValue).toLocaleString()}</span>
          </td>
          <td>
            <span style="font-size: 14px; color: ${Number(item.actualCost) > Number(item.earnedValue) ? 'var(--status-danger)' : 'var(--text-primary)'};">
              ¥${Number(item.actualCost).toLocaleString()}
            </span>
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; justify-content:space-between; font-size:12px;">
                <span>已挣值: <strong>¥${Number(item.earnedValue).toLocaleString()}</strong></span>
                <span style="color:var(--accent-secondary); font-weight:700;">${progressPercent}%</span>
              </div>
              <div style="width:100%; background:var(--bg-secondary); border:1px solid var(--border-color); height:5px; border-radius:2.5px; overflow:hidden;">
                <div style="width:${progressPercent}%; background:var(--accent-secondary); height:100%;"></div>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-edit-cost" data-id="${item.id}" style="padding: 3px 8px; font-size:12px;">编辑</button>
              <button class="btn btn-danger btn-delete-cost" data-id="${item.id}" style="padding: 3px 8px; font-size:12px;">删除</button>
            </div>
          </td>
        </tr>
      `;
    });
    this.tableBody.innerHTML = html;

    // Bind Edit/Delete buttons
    this.tableBody.querySelectorAll('.btn-edit-cost').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cost = costs.find(item => item.id === id);
        if (cost) this.openEditModal(cost);
      });
    });

    this.tableBody.querySelectorAll('.btn-delete-cost').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('确定要删除这项费用项吗？这将重新计算总项目EVM指标。')) {
          store.deleteCostItem(id);
          store.publish('notify', { type: 'success', message: '已成功移除该项费用条目。' });
        }
      });
    });
  }

  getFormHtml(item = {}) {
    // Compute progress % of existing item to prefill
    const progressPercent = item.plannedValue > 0 ? Math.round((item.earnedValue / item.plannedValue) * 100) : 0;

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="cost-desc">费用项 / 工作包描述:</label>
          <input type="text" id="cost-desc" name="description" class="form-control" value="${item.description || ''}" placeholder="如：WMS服务器云环境采购费用" required>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="cost-pv">计划价值 (PV, 预算金额):</label>
            <input type="number" id="cost-pv" name="plannedValue" min="0" class="form-control" value="${item.plannedValue !== undefined ? item.plannedValue : 0}" required>
          </div>
          <div class="form-group">
            <label for="cost-ac">实际支出 (AC, 财务已开销):</label>
            <input type="number" id="cost-ac" name="actualCost" min="0" class="form-control" value="${item.actualCost !== undefined ? item.actualCost : 0}" required>
          </div>
        </div>
        <div class="form-group">
          <label for="cost-progress">工作包已物理完成度比例 (Progress, 0-100%):</label>
          <input type="range" id="cost-progress" name="progressPercent" min="0" max="100" class="form-control" value="${progressPercent}" style="padding:0;" oninput="this.nextElementSibling.value = this.value + '%'">
          <output style="font-weight:700; font-size:14px; margin-top:4px; display:block; text-align:center;">${progressPercent}%</output>
          <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">
            EVM说明：系统会自动计算 <strong>挣值 (EV) = 计划价值 (PV) &times; 完成度比例</strong>。
          </p>
        </div>
      </div>
    `;
  }

  openAddModal() {
    ModalHelper.open(
      '新增项目成本预算项',
      this.getFormHtml(),
      (data) => {
        const pv = Number(data.plannedValue || 0);
        const progress = Number(data.progressPercent || 0);
        const ev = pv * (progress / 100);
        
        store.addCostItem({
          description: data.description,
          plannedValue: pv,
          actualCost: Number(data.actualCost || 0),
          earnedValue: ev
        });
        
        store.publish('notify', { type: 'success', message: '已新增费用分配项，已重计算EVM。' });
        return true;
      }
    );
  }

  openEditModal(item) {
    ModalHelper.open(
      `编辑费用项: ${item.description}`,
      this.getFormHtml(item),
      (data) => {
        const pv = Number(data.plannedValue || 0);
        const progress = Number(data.progressPercent || 0);
        const ev = pv * (progress / 100);

        store.updateCostItem(item.id, {
          description: data.description,
          plannedValue: pv,
          actualCost: Number(data.actualCost || 0),
          earnedValue: ev
        });

        store.publish('notify', { type: 'success', message: '费用项及挣值比例已更新。' });
        return true;
      }
    );
  }
}
