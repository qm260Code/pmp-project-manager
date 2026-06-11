import { store } from '../store.js';
import { ModalHelper } from '../app.js';

export class RequirementsComponent {
  constructor(container) {
    this.container = container;
    this.kpiContainer = document.getElementById('requirements-kpi-container');
    this.tableBody = document.getElementById('requirements-table-body');
    this.btnAdd = document.getElementById('btn-add-requirement');

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
    const reqs = store.state.requirements || [];
    this.renderKPIs(reqs);
    this.renderTable(reqs);
  }

  renderKPIs(reqs) {
    const total = reqs.length;
    const accepted = reqs.filter(r => r.status === 'Accepted' || r.status === 'Verified').length;
    const inProgress = reqs.filter(r => r.status === 'In Progress').length;
    const draft = reqs.filter(r => r.status === 'Draft').length;

    this.kpiContainer.innerHTML = `
      <div class="kpi-card" style="border-left: 4px solid var(--accent-secondary);">
        <div class="kpi-label">客户需求总数 (Total Reqs)</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-subtext">需求库中录入的所有条目</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid var(--status-success);">
        <div class="kpi-label">已验证/已接受 (Accepted)</div>
        <div class="kpi-value" style="color: var(--status-success);">${accepted}</div>
        <div class="kpi-subtext">通过验收或测试验证的需求</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid var(--status-warning);">
        <div class="kpi-label">实现开发中 (In Progress)</div>
        <div class="kpi-value" style="color: var(--status-warning);">${inProgress}</div>
        <div class="kpi-subtext">当前正处于研发或配置阶段</div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid var(--pmp-planning);">
        <div class="kpi-label">草稿/待启动 (Draft)</div>
        <div class="kpi-value" style="color: var(--pmp-planning);">${draft}</div>
        <div class="kpi-subtext">新录入待分析评估的需求</div>
      </div>
    `;
  }

  renderTable(reqs) {
    if (reqs.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 20px;">
            暂无客户需求管理记录，请点击右上角新增。
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    reqs.forEach((req, index) => {
      const reqNo = `REQ-${String(index + 1).padStart(3, '0')}`;
      
      // Status badges
      let statusClass = 'badge-planning'; // default draft
      if (req.status === 'Accepted') statusClass = 'badge-executing';
      else if (req.status === 'Verified') statusClass = 'badge-initiating';
      else if (req.status === 'In Progress') statusClass = 'badge-monitoring';
      else if (req.status === 'Deferred') statusClass = 'badge-closing';

      // Priority badges
      let priorityStyle = 'background: #f1f3f5; color: #495057;'; // default low
      if (req.priority === 'High') priorityStyle = 'background: #fff5f5; color: var(--status-danger); border: 1px solid rgba(220,38,38,0.2);';
      else if (req.priority === 'Medium') priorityStyle = 'background: #fff9db; color: #d97706; border: 1px solid rgba(217,119,6,0.2);';

      // Map category labels
      const catMap = {
        Functional: '功能需求 (Functional)',
        NonFunctional: '非功能需求 (Non-Func)',
        Technical: '技术需求 (Technical)',
        Business: '业务需求 (Business)'
      };
      const categoryLabel = catMap[req.category] || req.category || '功能需求';

      html += `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-primary);">${reqNo}</div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top:2px; font-weight:600;">${req.name}</div>
          </td>
          <td>
            <div style="font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${req.description}">${req.description || '无说明'}</div>
          </td>
          <td>
            <span style="font-size: 12px;">${categoryLabel}</span>
          </td>
          <td>
            <span class="badge" style="${priorityStyle}">${req.priority}</span>
          </td>
          <td>
            <span style="font-size: 12px; font-weight: 600;">${req.owner || '未分配'}</span>
          </td>
          <td>
            <span style="font-size: 12px; color: var(--text-secondary);">${req.targetRelease || '未排期'}</span>
          </td>
          <td>
            <div style="font-size: 12px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${req.verificationMethod || ''}">${req.verificationMethod || '未指定'}</div>
          </td>
          <td>
            <span class="badge ${statusClass}">${req.status}</span>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-edit-req" data-id="${req.id}" style="padding: 3px 8px; font-size:12px;">编辑</button>
              <button class="btn btn-danger btn-delete-req" data-id="${req.id}" style="padding: 3px 8px; font-size:12px;">删除</button>
            </div>
          </td>
        </tr>
      `;
    });
    
    this.tableBody.innerHTML = html;

    // Bind edit/delete click handlers
    this.tableBody.querySelectorAll('.btn-edit-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const req = reqs.find(item => item.id === id);
        if (req) this.openEditModal(req);
      });
    });

    this.tableBody.querySelectorAll('.btn-delete-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('确定要彻底删除该需求条目吗？')) {
          store.deleteRequirement(id);
          store.publish('notify', { type: 'success', message: '已成功删除需求条目。' });
        }
      });
    });
  }

  getFormHtml(req = {}) {
    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="req-name">需求名称 (Requirement Name):</label>
          <input type="text" id="req-name" name="name" class="form-control" value="${req.name || ''}" placeholder="如：温湿度越限告警的短信推送模块" required>
        </div>
        
        <div class="form-group">
          <label for="req-desc">需求详细描述 (Description):</label>
          <textarea id="req-desc" name="description" class="form-control" style="height:60px;" placeholder="描述需求的具体规则、业务流及交付条件..." required>${req.description || ''}</textarea>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="req-cat">需求分类 (Category):</label>
            <select id="req-cat" name="category" class="form-control">
              <option value="Functional" ${req.category === 'Functional' || !req.category ? 'selected' : ''}>功能需求 (Functional)</option>
              <option value="NonFunctional" ${req.category === 'NonFunctional' ? 'selected' : ''}>非功能需求 (Non-Functional)</option>
              <option value="Technical" ${req.category === 'Technical' ? 'selected' : ''}>技术需求 (Technical)</option>
              <option value="Business" ${req.category === 'Business' ? 'selected' : ''}>业务需求 (Business)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="req-priority">优先级 (Priority):</label>
            <select id="req-priority" name="priority" class="form-control">
              <option value="High" ${req.priority === 'High' ? 'selected' : ''}>高 (High)</option>
              <option value="Medium" ${req.priority === 'Medium' || !req.priority ? 'selected' : ''}>中 (Medium)</option>
              <option value="Low" ${req.priority === 'Low' ? 'selected' : ''}>低 (Low)</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="req-owner">责任接口人 (Owner):</label>
            <input type="text" id="req-owner" name="owner" class="form-control" value="${req.owner || ''}" placeholder="如：刘明" required>
          </div>
          <div class="form-group">
            <label for="req-release">目标里程碑/排期 (Target Release):</label>
            <input type="text" id="req-release" name="targetRelease" class="form-control" value="${req.targetRelease || ''}" placeholder="如：t-4 (告警模块开发期)" required>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; border-top:1px dashed var(--border-color); padding-top:12px; margin-top:4px;">
          <div class="form-group">
            <label for="req-status">当前需求状态 (Status):</label>
            <select id="req-status" name="status" class="form-control">
              <option value="Draft" ${req.status === 'Draft' ? 'selected' : ''}>草稿 (Draft)</option>
              <option value="In Progress" ${req.status === 'In Progress' || !req.status ? 'selected' : ''}>开发/配置中 (In Progress)</option>
              <option value="Verified" ${req.status === 'Verified' ? 'selected' : ''}>测试已验证 (Verified)</option>
              <option value="Accepted" ${req.status === 'Accepted' ? 'selected' : ''}>客户已验收 (Accepted)</option>
              <option value="Deferred" ${req.status === 'Deferred' ? 'selected' : ''}>延期/挂起 (Deferred)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="req-verify">验证与验收手段 (Verification Method):</label>
            <input type="text" id="req-verify" name="verificationMethod" class="form-control" value="${req.verificationMethod || ''}" placeholder="如：联调短信测试用例、UAT演示验收" required>
          </div>
        </div>
      </div>
    `;
  }

  openAddModal() {
    ModalHelper.open(
      '新增客户需求 (New Requirement)',
      this.getFormHtml(),
      (data) => {
        store.addRequirement({
          name: data.name,
          description: data.description,
          category: data.category,
          priority: data.priority,
          owner: data.owner,
          targetRelease: data.targetRelease,
          status: data.status,
          verificationMethod: data.verificationMethod
        });
        store.publish('notify', { type: 'success', message: '需求录入成功，已添加至矩阵。' });
        return true;
      }
    );
  }

  openEditModal(req) {
    ModalHelper.open(
      `编辑需求条目: ${req.name}`,
      this.getFormHtml(req),
      (data) => {
        store.updateRequirement(req.id, {
          name: data.name,
          description: data.description,
          category: data.category,
          priority: data.priority,
          owner: data.owner,
          targetRelease: data.targetRelease,
          status: data.status,
          verificationMethod: data.verificationMethod
        });
        store.publish('notify', { type: 'success', message: '需求更新成功，已保存。' });
        return true;
      }
    );
  }
}
