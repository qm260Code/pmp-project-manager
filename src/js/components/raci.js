import { store } from '../store.js';
import { ModalHelper } from '../app.js';

export class RaciComponent {
  constructor(container) {
    this.container = document.getElementById('raci-matrix-table');
    this.btnConfigRoles = document.getElementById('btn-edit-raci-roles');
    this.btnAddActivity = document.getElementById('btn-add-raci-activity');
    
    this.initEvents();
    this.render();
    
    store.subscribe('state-updated', () => {
      this.render();
    });
  }

  initEvents() {
    this.btnConfigRoles.addEventListener('click', () => this.openRolesModal());
    this.btnAddActivity.addEventListener('click', () => this.openActivityModal());
  }

  render() {
    const raci = store.state.raci;
    const roles = raci.roles || [];
    const matrix = raci.matrix || [];
    
    if (roles.length === 0) {
      this.container.innerHTML = `
        <thead>
          <tr><th>无角色配置</th></tr>
        </thead>
        <tbody>
          <tr><td style="color:var(--text-muted); text-align:center;">请先点击右上角“配置角色”按钮。</td></tr>
        </tbody>
      `;
      return;
    }

    // Build Table Header
    let html = `
      <thead>
        <tr>
          <th style="min-width: 200px;">活动 / 交付物名称</th>
          ${roles.map(r => `<th style="text-align:center;">${r}</th>`).join('')}
          <th style="width:80px; text-align:center;">操作</th>
        </tr>
      </thead>
      <tbody>
    `;

    if (matrix.length === 0) {
      html += `
        <tr>
          <td colspan="${roles.length + 2}" style="text-align:center; color:var(--text-muted); padding:20px;">
            暂无活动职责分配，请点击右上角新增活动。
          </td>
        </tr>
      `;
    } else {
      matrix.forEach((row, rowIndex) => {
        html += `
          <tr>
            <td style="font-weight: 600; color: var(--text-primary);">${row.activity}</td>
            ${roles.map(role => {
              const val = row.roles[role] || '';
              
              // Custom coloring classes based on R, A, C, I
              let valClass = '';
              if (val === 'R') valClass = 'raci-r';
              else if (val === 'A') valClass = 'raci-a';
              else if (val === 'C') valClass = 'raci-c';
              else if (val === 'I') valClass = 'raci-i';

              return `
                <td style="text-align:center;">
                  <select class="raci-cell-select ${valClass}" 
                          data-row="${rowIndex}" 
                          data-role="${role}" 
                          style="text-align-last: center;">
                    <option value="" ${val === '' ? 'selected' : ''}>-</option>
                    <option value="R" class="raci-r" ${val === 'R' ? 'selected' : ''}>R (负责)</option>
                    <option value="A" class="raci-a" ${val === 'A' ? 'selected' : ''}>A (批准)</option>
                    <option value="C" class="raci-c" ${val === 'C' ? 'selected' : ''}>C (咨询)</option>
                    <option value="I" class="raci-i" ${val === 'I' ? 'selected' : ''}>I (知会)</option>
                  </select>
                </td>
              `;
            }).join('')}
            <td style="text-align:center;">
              <button class="btn btn-danger btn-delete-raci" data-index="${rowIndex}" style="padding: 2px 6px; font-size:11px;">
                &times; 删
              </button>
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody>`;
    this.container.innerHTML = html;
    
    this.bindCellEvents();
  }

  bindCellEvents() {
    // Listen to select drops changes
    const selects = this.container.querySelectorAll('.raci-cell-select');
    selects.forEach(select => {
      select.addEventListener('change', (e) => {
        const rowIndex = Number(select.getAttribute('data-row'));
        const roleName = select.getAttribute('data-role');
        const val = select.value;
        
        // Update central store
        store.updateRaci(rowIndex, roleName, val);
      });
    });

    // Listen to delete activity buttons
    const deleteBtns = this.container.querySelectorAll('.btn-delete-raci');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.getAttribute('data-index'));
        if (confirm('确定要删除这项活动的 RACI 分配记录吗？')) {
          store.deleteRaciActivity(index);
          store.publish('notify', { type: 'success', message: '已成功移除活动职责行。' });
        }
      });
    });
  }

  openRolesModal() {
    const roles = store.state.raci.roles || [];
    const rolesStr = roles.join(', ');
    
    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="raci-roles-input">项目角色配置 (以英文逗号分隔):</label>
          <input type="text" id="raci-roles-input" name="rolesStr" class="form-control" value="${rolesStr}" placeholder="如：PM, Architect, Sponsor, QA" required>
          <p style="font-size:11px; color:var(--text-muted); margin-top:6px;">
            ⚠️ 警告：修改、增加或删除角色名称后，表格列会自动变更。若重命名角色，其对应的 R/A/C/I 指标会丢失。
          </p>
        </div>
      </div>
    `;

    ModalHelper.open(
      '配置 RACI 团队角色',
      bodyHtml,
      (data) => {
        const newRoles = data.rolesStr
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        
        if (newRoles.length === 0) {
          store.publish('notify', { type: 'error', message: '角色配置列表不能为空！' });
          return false;
        }

        store.updateRaciRoles(newRoles);
        store.publish('notify', { type: 'success', message: 'RACI 团队角色配置已更新。' });
        return true;
      }
    );
  }

  openActivityModal() {
    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="raci-activity-input">新增 RACI 活动 / 交付物名称:</label>
          <input type="text" id="raci-activity-input" name="activityName" class="form-control" placeholder="如：评审项目测试报告" required>
        </div>
      </div>
    `;

    ModalHelper.open(
      '新增 RACI 评估项',
      bodyHtml,
      (data) => {
        const name = data.activityName ? data.activityName.trim() : '';
        if (!name) {
          store.publish('notify', { type: 'error', message: '活动名称不能为空。' });
          return false;
        }

        store.addRaciActivity(name);
        store.publish('notify', { type: 'success', message: 'RACI 活动行已追加。' });
        return true;
      }
    );
  }
}
