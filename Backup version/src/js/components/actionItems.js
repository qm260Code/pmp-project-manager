import { store } from '../store.js';
import { ModalHelper } from '../app.js';

export class ActionItemsComponent {
  constructor(container) {
    this.container = container;
    this.tableBody = document.getElementById('action-items-table-body');
    this.btnAdd = document.getElementById('btn-add-action-item');
    
    this.initEvents();
    this.render();
    
    store.subscribe('state-updated', () => {
      this.render();
    });
  }

  initEvents() {
    if (this.btnAdd) {
      this.btnAdd.addEventListener('click', () => this.openAddModal());
    }
  }

  render() {
    const actionItems = store.state.actionItems || [];
    this.renderTable(actionItems);
  }

  renderTable(actionItems) {
    if (!this.tableBody) return;

    if (actionItems.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px 0;">
            暂无待完成事项，请点击右上角新增。
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    actionItems.forEach(item => {
      // Map priority to styled badge
      let priorityClass = 'badge-executing'; // default Low
      let priorityLabel = '低 (Low)';
      if (item.priority === 'High') {
        priorityClass = 'badge-closing'; // Red
        priorityLabel = '高 (High)';
      } else if (item.priority === 'Medium') {
        priorityClass = 'badge-monitoring'; // Orange/Yellow
        priorityLabel = '中 (Medium)';
      } else if (item.priority === 'Low') {
        priorityClass = 'badge-executing'; // Green
        priorityLabel = '低 (Low)';
      }

      // Map status to styled badge / quick checkbox toggle
      const isCompleted = item.status === 'Completed';
      const statusClass = isCompleted ? 'badge-executing' : 'badge-planning';
      const statusLabel = isCompleted ? '已完成' : '待处理';

      // Red text if pending and target date has passed
      const today = new Date().toISOString().split('T')[0];
      const isOverdue = !isCompleted && item.targetDate < today;
      const dateStyle = isOverdue ? 'color: var(--status-danger); font-weight: 600;' : '';

      html += `
        <tr>
          <td>
            <div style="font-weight: 500; color: var(--text-primary); max-width: 280px; white-space: normal; line-height: 1.4;">
              ${this.escapeHTML(item.content)}
            </div>
          </td>
          <td>
            <div style="font-size: 12px; color: var(--text-secondary);">${item.triggerDate}</div>
          </td>
          <td>
            <div style="font-weight: 500; font-size: 13px;">${this.escapeHTML(item.owner)}</div>
          </td>
          <td>
            <div style="font-size: 12px; ${dateStyle}" title="${isOverdue ? '已延期逾期！' : ''}">
              ${item.targetDate} ${isOverdue ? ' ⚠️' : ''}
            </div>
          </td>
          <td>
            <div style="font-size: 13px; font-weight: 600; color: ${item.delayDays > 0 ? 'var(--status-warning)' : 'var(--text-muted)'};">
              ${item.delayDays} 天
            </div>
          </td>
          <td>
            <span class="badge ${priorityClass}">${priorityLabel}</span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="action-item-toggle" data-id="${item.id}" ${isCompleted ? 'checked' : ''} style="cursor: pointer; width: 14px; height: 14px;" title="点击切换状态" />
              <span class="badge ${statusClass}">${statusLabel}</span>
            </div>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-edit-action" data-id="${item.id}" style="padding: 3px 8px; font-size:12px;">编辑</button>
              <button class="btn btn-danger btn-delete-action" data-id="${item.id}" style="padding: 3px 8px; font-size:12px;">删除</button>
            </div>
          </td>
        </tr>
      `;
    });
    this.tableBody.innerHTML = html;

    // Bind quick status toggle checkbox
    this.tableBody.querySelectorAll('.action-item-toggle').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const id = checkbox.getAttribute('data-id');
        const newStatus = checkbox.checked ? 'Completed' : 'Pending';
        const item = actionItems.find(x => x.id === id);
        if (item) {
          store.updateActionItem(id, { status: newStatus });
          store.publish('notify', { 
            type: 'success', 
            message: `事项状态已切换为: ${newStatus === 'Completed' ? '已完成' : '待处理'}` 
          });
        }
      });
    });

    // Bind edit/delete handlers
    this.tableBody.querySelectorAll('.btn-edit-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = actionItems.find(x => x.id === id);
        if (item) this.openEditModal(item);
      });
    });

    this.tableBody.querySelectorAll('.btn-delete-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('确定要删除此项待完成事项吗？')) {
          store.deleteActionItem(id);
          store.publish('notify', { type: 'success', message: '已删除待完成事项。' });
        }
      });
    });
  }

  getFormHtml(item = null) {
    const team = store.state.team || [];
    
    // Generate owner select dropdown populated from team members
    let ownerFieldHtml = '';
    if (team.length > 0) {
      ownerFieldHtml = `
        <select id="item-owner" name="owner" class="form-control" required>
          ${team.map(m => `
            <option value="${m.name}" ${item && item.owner === m.name ? 'selected' : ''}>
              ${this.escapeHTML(m.name)} (${this.escapeHTML(m.role)})
            </option>
          `).join('')}
        </select>
      `;
    } else {
      ownerFieldHtml = `
        <input type="text" id="item-owner" name="owner" class="form-control" 
               value="${item ? this.escapeHTML(item.owner) : ''}" 
               placeholder="如：李国强" required>
        <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">💡 提示：在“团队组织架构”中添加成员后，此处可直接下拉选择。</p>
      `;
    }

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="item-content">待完成事项内容:</label>
          <textarea id="item-content" name="content" class="form-control" style="height:60px;" placeholder="输入待办任务或工作包的说明..." required>${item ? item.content : ''}</textarea>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="item-trigger-date">触发日期 (Trigger Date):</label>
            <input type="date" id="item-trigger-date" name="triggerDate" class="form-control" value="${item ? item.triggerDate : new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group">
            <label for="item-target-date">期望完成日期 (Target Date):</label>
            <input type="date" id="item-target-date" name="targetDate" class="form-control" value="${item ? item.targetDate : ''}" required>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="item-owner">负责人 (Owner):</label>
            ${ownerFieldHtml}
          </div>
          <div class="form-group">
            <label for="item-delay-days">延迟天数 (Delay Days):</label>
            <input type="number" id="item-delay-days" name="delayDays" min="0" class="form-control" value="${item ? item.delayDays : 0}" required>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="item-priority">优先级 (Priority):</label>
            <select id="item-priority" name="priority" class="form-control">
              <option value="High" ${item && item.priority === 'High' ? 'selected' : ''}>高 (High)</option>
              <option value="Medium" ${item && item.priority === 'Medium' ? 'selected' : ''}>中 (Medium)</option>
              <option value="Low" ${item && item.priority === 'Low' || !item ? 'selected' : ''}>低 (Low)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="item-status">当前状态 (Status):</label>
            <select id="item-status" name="status" class="form-control">
              <option value="Pending" ${item && item.status === 'Pending' || !item ? 'selected' : ''}>待处理 (Pending)</option>
              <option value="Completed" ${item && item.status === 'Completed' ? 'selected' : ''}>已完成 (Completed)</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  openAddModal() {
    ModalHelper.open(
      '新增待完成事项',
      this.getFormHtml(null),
      (data) => {
        store.addActionItem({
          content: data.content,
          triggerDate: data.triggerDate,
          owner: data.owner,
          targetDate: data.targetDate,
          delayDays: Number(data.delayDays || 0),
          priority: data.priority,
          status: data.status
        });
        store.publish('notify', { type: 'success', message: '已成功添加待完成事项。' });
        return true;
      }
    );
  }

  openEditModal(item) {
    ModalHelper.open(
      `编辑待完成事项`,
      this.getFormHtml(item),
      (data) => {
        store.updateActionItem(item.id, {
          content: data.content,
          triggerDate: data.triggerDate,
          owner: data.owner,
          targetDate: data.targetDate,
          delayDays: Number(data.delayDays || 0),
          priority: data.priority,
          status: data.status
        });
        store.publish('notify', { type: 'success', message: '待完成事项已更新。' });
        return true;
      }
    );
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}
