import { store } from '../store.js';
import { ModalHelper } from '../app.js';

export class ChangeRequestsComponent {
  constructor(container) {
    this.container = container;
    this.kpiContainer = document.getElementById('change-requests-kpi-container');
    this.tableBody = document.getElementById('change-requests-table-body');
    this.btnAdd = document.getElementById('btn-add-change-request');

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
    const crs = store.state.changeRequests || [];
    this.renderKPIs(crs);
    this.renderTable(crs);
  }

  renderKPIs(crs) {
    const total = crs.length;
    const approved = crs.filter(c => c.status === 'Approved').length;
    const pending = crs.filter(c => c.status === 'Pending').length;
    const closed = crs.filter(c => c.status === 'Closed' || c.status === 'Rejected').length;

    this.kpiContainer.innerHTML = `
      <div class="kpi-card" style="border-left: 4px solid var(--accent-secondary);">
        <div class="kpi-label">变更申请总数 (Total CRs)</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-subtext">已提交的所有变更单</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid var(--status-success);">
        <div class="kpi-label">已批准变更 (Approved)</div>
        <div class="kpi-value" style="color: var(--status-success);">${approved}</div>
        <div class="kpi-subtext">已通过CCB评审并执行</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid var(--status-warning);">
        <div class="kpi-label">待决策审批 (Pending)</div>
        <div class="kpi-value" style="color: var(--status-warning);">${pending}</div>
        <div class="kpi-subtext">等待CCB会议评审决定</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid var(--text-muted);">
        <div class="kpi-label">已关闭/已拒绝</div>
        <div class="kpi-value">${closed}</div>
        <div class="kpi-subtext">已归档或被驳回的变更</div>
      </div>
    `;
  }

  renderTable(crs) {
    if (crs.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">
            暂无项目变更管理记录，请点击右上角新增。
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    crs.forEach((cr, index) => {
      const crNo = `CR-${String(index + 1).padStart(3, '0')}`;
      
      let statusClass = 'badge-planning'; // default draft
      if (cr.status === 'Approved') statusClass = 'badge-executing';
      else if (cr.status === 'Pending') statusClass = 'badge-monitoring';
      else if (cr.status === 'Rejected') statusClass = 'badge-closing';
      else if (cr.status === 'Closed') statusClass = 'badge-initiating';

      // Map category labels
      const catMap = {
        Scope: '范围变更 (Scope)',
        Schedule: '进度变更 (Schedule)',
        Cost: '成本变更 (Cost)',
        Quality: '质量变更 (Quality)',
        Other: '其他变更 (Other)'
      };
      const categoryLabel = catMap[cr.category] || cr.category || '其他';

      html += `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-primary);">${crNo}</div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top:2px;">${cr.description}</div>
          </td>
          <td>
            <span style="font-size: 12px; font-weight: 500;">${categoryLabel}</span>
          </td>
          <td>
            <div style="font-size: 12px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${cr.impactAnalysis}">${cr.impactAnalysis || '暂无影响评估'}</div>
          </td>
          <td>
            <div style="font-size: 12px; font-weight:600;">${cr.requester || '未分配'}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top:1px;">${cr.dateRaised}</div>
          </td>
          <td>
            <div style="font-size: 12px; font-weight:600;">审批: ${cr.approver || '未指定'}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top:1px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${cr.ccbNotes || ''}">${cr.ccbNotes || '暂无会议纪要'}</div>
          </td>
          <td>
            <span class="badge ${statusClass}">${cr.status}</span>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-edit-cr" data-id="${cr.id}" style="padding: 3px 8px; font-size:12px;">编辑</button>
              <button class="btn btn-danger btn-delete-cr" data-id="${cr.id}" style="padding: 3px 8px; font-size:12px;">删除</button>
            </div>
          </td>
        </tr>
      `;
    });
    
    this.tableBody.innerHTML = html;

    // Bind edit/delete click handlers
    this.tableBody.querySelectorAll('.btn-edit-cr').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cr = crs.find(item => item.id === id);
        if (cr) this.openEditModal(cr);
      });
    });

    this.tableBody.querySelectorAll('.btn-delete-cr').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('确定要彻底删除这条项目变更单吗？删除后不可恢复。')) {
          store.deleteChangeRequest(id);
          store.publish('notify', { type: 'success', message: '已成功删除变更单记录。' });
        }
      });
    });
  }

  getFormHtml(cr = {}) {
    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="cr-desc">变更描述 / 变更名称:</label>
          <input type="text" id="cr-desc" name="description" class="form-control" value="${cr.description || ''}" placeholder="如：物联网模块接口新增数据校验规则" required>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="cr-cat">变更分类 (Category):</label>
            <select id="cr-cat" name="category" class="form-control">
              <option value="Scope" ${cr.category === 'Scope' ? 'selected' : ''}>范围变更 (Scope)</option>
              <option value="Schedule" ${cr.category === 'Schedule' ? 'selected' : ''}>进度变更 (Schedule)</option>
              <option value="Cost" ${cr.category === 'Cost' ? 'selected' : ''}>成本变更 (Cost)</option>
              <option value="Quality" ${cr.category === 'Quality' ? 'selected' : ''}>质量变更 (Quality)</option>
              <option value="Other" ${cr.category === 'Other' || !cr.category ? 'selected' : ''}>其他变更 (Other)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="cr-requester">申请人 (Requester):</label>
            <input type="text" id="cr-requester" name="requester" class="form-control" value="${cr.requester || ''}" placeholder="如：李国强" required>
          </div>
        </div>

        <div class="form-group">
          <label for="cr-impact">变更原因及影响分析 (Impact Analysis):</label>
          <textarea id="cr-impact" name="impactAnalysis" class="form-control" style="height:70px;" placeholder="评估对范围、进度和成本的影响。如：为解决丢包问题新增LoRa中继，导致硬件成本增加1500元，进度无影响。" required>${cr.impactAnalysis || ''}</textarea>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; border-top:1px dashed var(--border-color); padding-top:12px; margin-top:4px;">
          <div class="form-group">
            <label for="cr-status">变更审批状态 (CCB Status):</label>
            <select id="cr-status" name="status" class="form-control">
              <option value="Draft" ${cr.status === 'Draft' ? 'selected' : ''}>草稿 (Draft)</option>
              <option value="Pending" ${cr.status === 'Pending' || !cr.status ? 'selected' : ''}>审批决策中 (Pending)</option>
              <option value="Approved" ${cr.status === 'Approved' ? 'selected' : ''}>已批准执行 (Approved)</option>
              <option value="Rejected" ${cr.status === 'Rejected' ? 'selected' : ''}>已拒绝驳回 (Rejected)</option>
              <option value="Closed" ${cr.status === 'Closed' ? 'selected' : ''}>已关闭归档 (Closed)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="cr-approver">CCB 审批决策人 (Approver):</label>
            <input type="text" id="cr-approver" name="approver" class="form-control" value="${cr.approver || ''}" placeholder="如：张建华 (CCB 主席)">
          </div>
        </div>

        <div class="form-group">
          <label for="cr-notes">CCB 会议纪要与决策备注 (Notes):</label>
          <textarea id="cr-notes" name="ccbNotes" class="form-control" style="height:70px;" placeholder="录入CCB评审会的决策意见或执行人安排。">${cr.ccbNotes || ''}</textarea>
        </div>
      </div>
    `;
  }

  openAddModal() {
    ModalHelper.open(
      '新建项目变更申请 (New CR)',
      this.getFormHtml(),
      (data) => {
        store.addChangeRequest({
          description: data.description,
          category: data.category,
          impactAnalysis: data.impactAnalysis,
          requester: data.requester,
          status: data.status,
          approver: data.approver,
          ccbNotes: data.ccbNotes
        });
        store.publish('notify', { type: 'success', message: '变更申请单创建成功，已载入登记册。' });
        return true;
      }
    );
  }

  openEditModal(cr) {
    ModalHelper.open(
      `编辑项目变更单: ${cr.description}`,
      this.getFormHtml(cr),
      (data) => {
        store.updateChangeRequest(cr.id, {
          description: data.description,
          category: data.category,
          impactAnalysis: data.impactAnalysis,
          requester: data.requester,
          status: data.status,
          approver: data.approver,
          ccbNotes: data.ccbNotes
        });
        store.publish('notify', { type: 'success', message: '变更单更新成功，已保存。' });
        return true;
      }
    );
  }
}
