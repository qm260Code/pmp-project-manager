import { store } from '../store.js';
import { PmpCalculators } from '../utils/pmpCalculators.js';
import { ModalHelper } from '../app.js';

export class ScheduleComponent {
  constructor(container) {
    this.container = container;
    this.ganttContainer = document.getElementById('gantt-chart-container');
    this.tableBody = document.getElementById('schedule-table-body');
    this.btnAdd = document.getElementById('btn-add-task');
    
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
    const schedule = state.schedule || [];
    
    this.renderGantt(state);
    this.renderTable(schedule);
  }

  renderGantt(state) {
    const schedule = state.schedule || [];
    const projectInfo = state.projectInfo;
    
    if (schedule.length === 0) {
      this.ganttContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">暂无进度计划，请在下方添加任务活动。</p>`;
      return;
    }

    // Sort tasks by start date
    const sortedTasks = [...schedule].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // SVG Dimensions
    const leftPanelWidth = 180;
    const timelineWidth = 620;
    const totalWidth = leftPanelWidth + timelineWidth;
    const rowHeight = 36;
    const headerHeight = 40;
    const totalHeight = headerHeight + (sortedTasks.length * rowHeight);

    // Timeline Boundaries: Compute dynamically based on actual tasks to prevent overflow/clamping
    let pStart = PmpCalculators.parseDate(projectInfo.startDate);
    let pEnd = PmpCalculators.parseDate(projectInfo.endDate);

    if (schedule.length > 0) {
      schedule.forEach(task => {
        const tStart = PmpCalculators.parseDate(task.startDate);
        const tEnd = PmpCalculators.parseDate(task.endDate);
        if (tStart < pStart) pStart = tStart;
        if (tEnd > pEnd) pEnd = tEnd;
      });
    }

    // Pad by 7 days on both ends for a clean visual margin
    pStart = new Date(pStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    pEnd = new Date(pEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

    const pStartStr = PmpCalculators.formatDate(pStart);
    const pEndStr = PmpCalculators.formatDate(pEnd);
    const projectDays = Math.max(1, PmpCalculators.getDaysDifference(pStart, pEnd));

    // Generate Adaptive Columns based on project duration to prevent overlapping
    const columns = [];
    let current = new Date(pStart);

    if (projectDays <= 45) {
      // Short project: weekly columns (omit month if it doesn't change)
      let lastMonth = null;
      while (current <= pEnd) {
        const m = current.getMonth() + 1;
        const d = current.getDate();
        let label = `${m}/${d}`;
        if (lastMonth === m) {
          label = `${d}`;
        } else {
          lastMonth = m;
        }
        columns.push({
          label,
          date: new Date(current)
        });
        current.setDate(current.getDate() + 7);
      }
    } else if (projectDays <= 180) {
      // Medium project (1.5 - 6 months): monthly columns (only show year when it changes)
      current.setDate(1);
      if (current < pStart) {
        current.setMonth(current.getMonth() + 1);
      }
      let lastYear = null;
      while (current <= pEnd) {
        const y = current.getFullYear();
        const m = current.getMonth() + 1;
        let label = `${m}月`;
        if (lastYear !== y) {
          label = `${y}年 ${m}月`;
          lastYear = y;
        }
        columns.push({
          label,
          date: new Date(current)
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else if (projectDays <= 365) {
      // Long project (6 months - 1 year): bi-monthly columns (every 2 months)
      current.setDate(1);
      if (current < pStart) {
        current.setMonth(current.getMonth() + 1);
      }
      let lastYear = null;
      while (current <= pEnd) {
        const y = current.getFullYear();
        const m = current.getMonth() + 1;
        let label = `${m}月`;
        if (lastYear !== y) {
          label = `${y}年 ${m}月`;
          lastYear = y;
        }
        columns.push({
          label,
          date: new Date(current)
        });
        current.setMonth(current.getMonth() + 2);
      }
    } else {
      // Very long project (> 1 year): quarterly columns (only show year on transition)
      current.setDate(1);
      const currentMonth = current.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      current.setMonth(quarterStartMonth);
      if (current < pStart) {
        current.setMonth(current.getMonth() + 3);
      }
      let lastYear = null;
      while (current <= pEnd) {
        const y = current.getFullYear();
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        let label = `Q${quarter}`;
        if (lastYear !== y) {
          label = `${y}年 Q${quarter}`;
          lastYear = y;
        }
        columns.push({
          label,
          date: new Date(current)
        });
        current.setMonth(current.getMonth() + 3);
      }
    }

    // Safety fallback
    if (columns.length === 0) {
      columns.push({ label: pStartStr, date: new Date(pStart) });
    }

    let svgHtml = `<svg width="100%" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" class="gantt-svg">`;

    // 1. Draw Grid Timeline Background headers
    svgHtml += `<rect width="${leftPanelWidth}" height="${totalHeight}" fill="var(--bg-secondary)"/>`;
    svgHtml += `<rect x="${leftPanelWidth}" width="${timelineWidth}" height="${headerHeight}" fill="var(--bg-secondary)" />`;
    svgHtml += `<line x1="0" y1="${headerHeight}" x2="${totalWidth}" y2="${headerHeight}" stroke="var(--border-color)" stroke-width="1.5" />`;
    svgHtml += `<line x1="${leftPanelWidth}" y1="0" x2="${leftPanelWidth}" y2="${totalHeight}" stroke="var(--border-color)" stroke-width="1.5" />`;

    // Draw column partitions
    columns.forEach((col, index) => {
      // Find left offset
      const diffDays = PmpCalculators.getDaysDifference(pStart, col.date);
      const colLeft = leftPanelWidth + Math.max(0, (diffDays / projectDays) * timelineWidth);
      
      if (index > 0) {
        svgHtml += `<line x1="${colLeft}" y1="0" x2="${colLeft}" y2="${totalHeight}" class="gantt-grid-line" />`;
      }
      
      // Calculate label placement (centered between this column and next column / end of project)
      const nextDate = index < columns.length - 1 ? columns[index+1].date : pEnd;
      const widthDays = PmpCalculators.getDaysDifference(col.date, nextDate);
      const labelWidth = (widthDays / projectDays) * timelineWidth;
      const textX = colLeft + (labelWidth / 2);
      
      svgHtml += `<text x="${textX}" y="${headerHeight - 15}" class="gantt-header-text">${col.label}</text>`;
    });

    // 2. Draw Rows & Grid horizontal separators
    sortedTasks.forEach((task, index) => {
      const y = headerHeight + (index * rowHeight);
      
      // Horizontal row splitter
      svgHtml += `<line x1="0" y1="${y + rowHeight}" x2="${totalWidth}" y2="${y + rowHeight}" class="gantt-grid-line" />`;
      
      // Left Panel Task label
      svgHtml += `<text x="15" y="${y + (rowHeight/2) + 5}" class="gantt-label-text" title="${task.name}">`;
      svgHtml += task.name.length > 11 ? `${task.name.substring(0, 10)}...` : task.name;
      svgHtml += `</text>`;
    });

    // Map tasks to their row indices for drawing dependencies
    const taskRowMap = {};
    sortedTasks.forEach((t, idx) => {
      taskRowMap[t.id] = idx;
    });

    // 3. Draw Dependency Connections (Dashed polylines)
    sortedTasks.forEach((task, index) => {
      const depIds = (task.dependencies || '').split(',').map(s => s.trim()).filter(Boolean);
      if (depIds.length === 0) return;

      const y = headerHeight + (index * rowHeight) + (rowHeight / 2);
      const layout = PmpCalculators.getGanttBarLayout(task.startDate, task.endDate, pStartStr, pEndStr, timelineWidth);
      const taskLeftX = leftPanelWidth + layout.left;

      depIds.forEach(depId => {
        const depRowIdx = taskRowMap[depId];
        if (depRowIdx === undefined) return;

        const depTask = schedule.find(t => t.id === depId);
        if (!depTask) return;

        const depLayout = PmpCalculators.getGanttBarLayout(depTask.startDate, depTask.endDate, pStartStr, pEndStr, timelineWidth);
          
        const depRightX = leftPanelWidth + depLayout.left + depLayout.width;
        const depY = headerHeight + (depRowIdx * rowHeight) + (rowHeight / 2);

        // Draw orthogonal path
        const midX = depRightX + 10;
        const points = `${depRightX},${depY} ${midX},${depY} ${midX},${y} ${taskLeftX},${y}`;
        
        svgHtml += `<polyline points="${points}" class="gantt-connection" />`;
      });
    });

    // 4. Draw Gantt Activity Bars & Milestones
    sortedTasks.forEach((task, index) => {
      const y = headerHeight + (index * rowHeight) + 8; // Offset from row top
      const barHeight = 20;
      
      const layout = PmpCalculators.getGanttBarLayout(task.startDate, task.endDate, pStartStr, pEndStr, timelineWidth);
      const x = leftPanelWidth + layout.left;
      
      const isMilestone = task.name.includes('里程碑') || task.name.includes('Milestone');
      const progress = Math.max(0, Math.min(100, Number(task.progress || 0)));

      if (isMilestone) {
        // Draw rotated diamond shape for milestone
        const diamondSize = 12;
        const centerX = x + layout.width; // Milestone marker is drawn at target completion date
        const centerY = y + (barHeight / 2);
        
        svgHtml += `
          <g class="gantt-row" style="cursor:pointer;" onclick="window.pmpScheduleComponent.openEditModalById('${task.id}')">
            <polygon points="${centerX},${centerY - diamondSize} ${centerX + diamondSize},${centerY} ${centerX},${centerY + diamondSize} ${centerX - diamondSize},${centerY}" 
                     class="gantt-milestone" 
                     style="fill: ${progress === 100 ? 'var(--status-success)' : 'var(--status-warning)'};" />
            <title>${task.name}\n交付期: ${task.endDate}\n进度: ${progress}%</title>
          </g>
        `;
      } else {
        // Draw normal activity horizontal bar
        const progressWidth = (progress / 100) * layout.width;
        
        // Assign highly distinct colors for WBS activities based on task keywords
        let barColor = 'var(--accent-primary)'; // Default Red
        if (progress === 100) {
          barColor = 'var(--status-success)'; // Completed is Green
        } else {
          const name = task.name.toLowerCase();
          if (name.includes('开发') || name.includes('代码') || name.includes('系统') || name.includes('监测') || name.includes('告警')) {
            barColor = '#005691'; // Bosch Corporate Blue
          } else if (name.includes('采购') || name.includes('硬件') || name.includes('传感器') || name.includes('网格') || name.includes('施工') || name.includes('搭建')) {
            barColor = '#ea580c'; // Vivid Orange
          } else if (name.includes('测试') || name.includes('验收') || name.includes('uat') || name.includes('联调')) {
            barColor = '#7c3aed'; // Purple
          } else if (name.includes('设计') || name.includes('方案') || name.includes('规划') || name.includes('调研') || name.includes('需求')) {
            barColor = '#00a3e0'; // Light Cyan/Blue
          }
        }
        
        svgHtml += `
          <g class="gantt-row" style="cursor:pointer;" onclick="window.pmpScheduleComponent.openEditModalById('${task.id}')">
            <!-- Full duration bar -->
            <rect x="${x}" y="${y}" width="${layout.width}" height="${barHeight}" 
                  class="gantt-bar" style="fill: #e9ecef; stroke: var(--border-color); stroke-width:1;" />
            <!-- Active progress bar -->
            <rect x="${x}" y="${y}" width="${progressWidth}" height="${barHeight}" 
                  class="gantt-bar-progress" style="fill: ${barColor};" />
            
            <title>${task.name}\n起止: ${task.startDate} 至 ${task.endDate}\n负责人: ${task.owner}\n进度: ${progress}%</title>
          </g>
        `;
      }
    });

    svgHtml += `</svg>`;
    this.ganttContainer.innerHTML = svgHtml;
    
    // Register component globally so SVG click triggers can execute edit
    window.pmpScheduleComponent = this;
  }

  renderTable(schedule) {
    if (schedule.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted);">
            暂无活动明细，请点击右上角新增。
          </td>
        </tr>
      `;
      return;
    }

    const sorted = [...schedule].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    let html = '';
    sorted.forEach(task => {
      const isMilestone = task.name.includes('里程碑') || task.name.includes('Milestone');
      
      html += `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary); display:flex; align-items:center; gap:6px;">
              ${task.name}
              ${isMilestone ? '<span class="badge" style="background:rgba(251,192,45,0.15); color:var(--status-warning); border:1px solid var(--status-warning)30; font-size:9px;">里程碑</span>' : ''}
            </div>
          </td>
          <td>
            <span style="font-size:13px;">${task.startDate}</span>
            <span style="color:var(--text-muted); padding:0 4px;">→</span>
            <span style="font-size:13px;">${task.endDate}</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:700; width:35px;">${task.progress}%</span>
              <div style="width:60px; background:var(--bg-secondary); border:1px solid var(--border-color); height:6px; border-radius:3px; overflow:hidden;">
                <div style="width:${task.progress}%; background:${task.progress === 100 ? 'var(--status-success)' : 'var(--accent-secondary)'}; height:100%;"></div>
              </div>
            </div>
          </td>
          <td>
            <span style="font-size:13px;">${task.owner || '未分配'}</span>
          </td>
          <td>
            <span style="font-size:12px; color:var(--text-muted);">${task.dependencies || '-'}</span>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-edit-task" data-id="${task.id}" style="padding: 3px 8px; font-size:12px;">编辑</button>
              <button class="btn btn-danger btn-delete-task" data-id="${task.id}" style="padding: 3px 8px; font-size:12px;">删除</button>
            </div>
          </td>
        </tr>
      `;
    });
    
    this.tableBody.innerHTML = html;

    // Bind Edit/Delete buttons
    this.tableBody.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openEditModalById(id);
      });
    });

    this.tableBody.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('确定要删除这项活动计划吗？这将破坏依赖它的甘特图连线。')) {
          store.deleteScheduleItem(id);
          store.publish('notify', { type: 'success', message: '活动任务已成功移除。' });
        }
      });
    });
  }

  openEditModalById(id) {
    const task = store.state.schedule.find(t => t.id === id);
    if (task) this.openEditModal(task);
  }

  getFormHtml(task = {}) {
    const allOtherTasks = store.state.schedule.filter(t => t.id !== task.id);
    const depHelpStr = allOtherTasks.map(t => `${t.id} (${t.name.substring(0,8)})`).join(', ');

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="task-name">活动 / 里程碑名称:</label>
          <input type="text" id="task-name" name="name" class="form-control" value="${task.name || ''}" placeholder="如：编写测试用例报告" required>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="task-start">计划开始日期:</label>
            <input type="date" id="task-start" name="startDate" class="form-control" value="${task.startDate || ''}" required>
          </div>
          <div class="form-group">
            <label for="task-end">计划结束日期:</label>
            <input type="date" id="task-end" name="endDate" class="form-control" value="${task.endDate || ''}" required>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="task-progress">进度百分比 (Progress, 0-100%):</label>
            <input type="number" id="task-progress" name="progress" min="0" max="100" class="form-control" value="${task.progress !== undefined ? task.progress : 0}" required>
          </div>
          <div class="form-group">
            <label for="task-owner">活动主要负责人:</label>
            <input type="text" id="task-owner" name="owner" class="form-control" value="${task.owner || ''}" placeholder="如：李技术骨干" required>
          </div>
        </div>
        <div class="form-group">
          <label for="task-deps">紧前活动依赖 ID (以英文逗号分隔，如：t-1, t-2):</label>
          <input type="text" id="task-deps" name="dependencies" class="form-control" value="${task.dependencies || ''}" placeholder="选填，无依赖则留空">
          ${depHelpStr ? `<p style="font-size:10px; color:var(--text-muted); margin-top:4px;">可选依赖 ID 库: ${depHelpStr}</p>` : ''}
        </div>
      </div>
    `;
  }

  openAddModal() {
    ModalHelper.open(
      '新增活动或里程碑计划',
      this.getFormHtml(),
      (data) => {
        // Validate dates
        if (new Date(data.startDate) > new Date(data.endDate)) {
          store.publish('notify', { type: 'error', message: '日期错误：开始日期不能晚于结束日期。' });
          return false;
        }
        store.addScheduleItem(data);
        store.publish('notify', { type: 'success', message: '已成功添加新任务活动。' });
        return true;
      }
    );
  }

  openEditModal(task) {
    ModalHelper.open(
      `编辑活动节点: ${task.name}`,
      this.getFormHtml(task),
      (data) => {
        if (new Date(data.startDate) > new Date(data.endDate)) {
          store.publish('notify', { type: 'error', message: '日期错误：开始日期不能晚于结束日期。' });
          return false;
        }
        store.updateScheduleItem(task.id, data);
        store.publish('notify', { type: 'success', message: '任务信息已更新。' });
        return true;
      }
    );
  }
}
