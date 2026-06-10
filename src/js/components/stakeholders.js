import { store } from '../store.js';
import { ModalHelper } from '../app.js';

export class StakeholdersComponent {
  constructor(container) {
    this.container = container;
    this.quadrant = document.getElementById('stakeholder-quadrant-container');
    this.tableBody = document.getElementById('stakeholder-table-body');
    this.btnAdd = document.getElementById('btn-add-stakeholder');
    
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
    const stakeholders = store.state.stakeholders || [];
    this.renderQuadrant(stakeholders);
    this.renderTable(stakeholders);
  }

  renderQuadrant(stakeholders) {
    // Renders the Power/Interest 2x2 matrix
    // Y-Axis: Power (5 at top, 1 at bottom)
    // X-Axis: Interest (1 at left, 5 at right)
    
    // Clear quadrant container and redraw standard layout
    this.quadrant.innerHTML = `
      <div class="ylabel">← 低  权力 (Power)  高 →</div>
      
      <!-- Quadrant Q1: High Power, Low Interest (Keep Satisfied) -->
      <div class="quadrant-cell q-keep-satisfied" data-label="令其满意 (Keep Satisfied)" id="quad-keep-satisfied"></div>
      
      <!-- Quadrant Q2: High Power, High Interest (Manage Closely) -->
      <div class="quadrant-cell q-manage-closely" data-label="重点管理 (Manage Closely)" id="quad-manage-closely"></div>
      
      <!-- Quadrant Q3: Low Power, Low Interest (Monitor) -->
      <div class="quadrant-cell q-monitor" data-label="仅需监督 (Monitor)" id="quad-monitor"></div>
      
      <!-- Quadrant Q4: Low Power, High Interest (Keep Informed) -->
      <div class="quadrant-cell q-keep-informed" data-label="随时告知 (Keep Informed)" id="quad-keep-informed"></div>
      
      <div class="xlabel">← 低  利益 (Interest)  高 →</div>
    `;

    const qKeepSatisfied = document.getElementById('quad-keep-satisfied');
    const qManageClosely = document.getElementById('quad-manage-closely');
    const qMonitor = document.getElementById('quad-monitor');
    const qKeepInformed = document.getElementById('quad-keep-informed');

    stakeholders.forEach(sh => {
      const p = Number(sh.power || 3);
      const i = Number(sh.interest || 3);
      
      // Determine which quadrant cell to place stakeholder
      let targetCell;
      if (p >= 3 && i < 3) targetCell = qKeepSatisfied;
      else if (p >= 3 && i >= 3) targetCell = qManageClosely;
      else if (p < 3 && i < 3) targetCell = qMonitor;
      else targetCell = qKeepInformed;

      const tag = document.createElement('span');
      tag.className = 'stakeholder-tag';
      if (sh.engagement === 'Leading') tag.classList.add('engaged-leading');
      if (sh.engagement === 'Resistant') tag.classList.add('engaged-resistant');
      
      tag.textContent = sh.name;
      tag.title = `${sh.role}\n期望影响力: P:${sh.power}/I:${sh.interest}\n状态: ${sh.engagement}`;
      tag.addEventListener('click', () => this.openEditModal(sh));
      
      targetCell.appendChild(tag);
    });
  }

  renderTable(stakeholders) {
    if (stakeholders.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted);">
            暂无登记的相关方，请点击右上角新增。
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    stakeholders.forEach(sh => {
      let engagementBadge = 'badge-planning';
      let engagementText = sh.engagement;
      
      const engagementMap = {
        'Unaware': { text: '不知晓 (Unaware)', class: 'badge-initiating' },
        'Resistant': { text: '抵触 (Resistant)', class: 'badge-closing' },
        'Neutral': { text: '中立 (Neutral)', class: 'badge-planning' },
        'Supportive': { text: '支持 (Supportive)', class: 'badge-executing' },
        'Leading': { text: '领导 (Leading)', class: 'badge-monitoring' }
      };
      
      const mapItem = engagementMap[sh.engagement] || { text: sh.engagement, class: 'badge-planning' };
      
      html += `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${sh.name}</div>
          </td>
          <td>
            <div style="font-size: 13px;">${sh.role}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top:2px;">
              策略: ${sh.strategy || '未制定'}
            </div>
          </td>
          <td>
            <span class="badge badge-initiating">P: ${sh.power}</span>
            <span class="badge badge-planning">I: ${sh.interest}</span>
          </td>
          <td>
            <span class="badge ${mapItem.class}">${mapItem.text}</span>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-edit-sh" data-id="${sh.id}" style="padding: 3px 8px; font-size:12px;">编辑</button>
              <button class="btn btn-danger btn-delete-sh" data-id="${sh.id}" style="padding: 3px 8px; font-size:12px;">删除</button>
            </div>
          </td>
        </tr>
      `;
    });
    this.tableBody.innerHTML = html;

    // Bind Edit/Delete buttons
    this.tableBody.querySelectorAll('.btn-edit-sh').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const sh = stakeholders.find(item => item.id === id);
        if (sh) this.openEditModal(sh);
      });
    });

    this.tableBody.querySelectorAll('.btn-delete-sh').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('确定要删除这位相关方登记项吗？')) {
          store.deleteStakeholder(id);
          store.publish('notify', { type: 'success', message: '已从登记册中移除相关方。' });
        }
      });
    });
  }

  getFormHtml(sh = {}) {
    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="sh-name">相关方姓名:</label>
          <input type="text" id="sh-name" name="name" class="form-control" value="${sh.name || ''}" placeholder="如：张经理" required>
        </div>
        <div class="form-group">
          <label for="sh-role">项目职责 / 角色:</label>
          <input type="text" id="sh-role" name="role" class="form-control" value="${sh.role || ''}" placeholder="如：发起人、业务专家" required>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="sh-power">权力等级 (Power, 1-5):</label>
            <select id="sh-power" name="power" class="form-control">
              ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${Number(sh.power || 3) === n ? 'selected' : ''}>${n} ${n >= 4 ? '(高)' : n <= 2 ? '(低)' : '(中)'}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="sh-interest">利益关注度 (Interest, 1-5):</label>
            <select id="sh-interest" name="interest" class="form-control">
              ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${Number(sh.interest || 3) === n ? 'selected' : ''}>${n} ${n >= 4 ? '(高)' : n <= 2 ? '(低)' : '(中)'}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="sh-engagement">当前参与水平 (Engagement Level):</label>
          <select id="sh-engagement" name="engagement" class="form-control">
            <option value="Unaware" ${sh.engagement === 'Unaware' ? 'selected' : ''}>不知晓 (Unaware) - 对项目无认知</option>
            <option value="Resistant" ${sh.engagement === 'Resistant' ? 'selected' : ''}>抵触 (Resistant) - 意识到了但反对变更</option>
            <option value="Neutral" ${sh.engagement === 'Neutral' || !sh.engagement ? 'selected' : ''}>中立 (Neutral) - 不反对也不积极</option>
            <option value="Supportive" ${sh.engagement === 'Supportive' ? 'selected' : ''}>支持 (Supportive) - 支持变更并希望成功</option>
            <option value="Leading" ${sh.engagement === 'Leading' ? 'selected' : ''}>领导 (Leading) - 主动确保团队行动实现成功</option>
          </select>
        </div>
        <div class="form-group">
          <label for="sh-strategy">相关方干预应对策略:</label>
          <textarea id="sh-strategy" name="strategy" class="form-control" placeholder="输入沟通或满意度维系策略...">${sh.strategy || ''}</textarea>
        </div>
      </div>
    `;
  }

  openAddModal() {
    ModalHelper.open(
      '新增相关方成员登记',
      this.getFormHtml(),
      (data) => {
        store.addStakeholder(data);
        store.publish('notify', { type: 'success', message: '已成功添加新相关方。' });
        return true;
      }
    );
  }

  openEditModal(sh) {
    ModalHelper.open(
      `编辑相关方信息: ${sh.name}`,
      this.getFormHtml(sh),
      (data) => {
        store.updateStakeholder(sh.id, data);
        store.publish('notify', { type: 'success', message: '相关方信息已更新。' });
        return true;
      }
    );
  }
}
