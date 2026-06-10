import { store } from './store.js';
import { PmpCalculators } from './utils/pmpCalculators.js';

// Import UI Views Components
import { DashboardComponent } from './components/dashboard.js';
import { MatrixComponent } from './components/matrix.js';
import { StakeholdersComponent } from './components/stakeholders.js';
import { RisksComponent } from './components/risks.js';
import { ScheduleComponent } from './components/schedule.js';
import { CostComponent } from './components/cost.js';
import { RaciComponent } from './components/raci.js';
import { TeamComponent } from './components/team.js';
import { ActionItemsComponent } from './components/actionItems.js';
import { ExportComponent } from './components/export.js';

class PmpApp {
  constructor() {
    this.toastTimer = null;
    this.components = {};
    this.currentView = 'dashboard';
    
    this.initElements();
    this.initRouter();
    this.initGlobalActions();
    this.initStoreSubscriptions();
    
    // Boot views components
    this.bootComponents();
    
    // Force initial render of headers
    this.updateHeaderUI(store.state);
    
    // Show welcome notification
    this.notify({ type: 'success', message: 'PMP 项目管理系统已成功加载，可实时在本地更新。' });
  }

  initElements() {
    this.projectNameDisplay = document.getElementById('header-project-name');
    this.projectStatusDisplay = document.getElementById('header-project-status');
    this.evmLight = document.getElementById('header-evm-light');
    this.evmText = document.getElementById('header-evm-text');
    this.toastBanner = document.getElementById('toast-banner');
    this.toastIcon = document.getElementById('toast-icon');
    this.toastText = document.getElementById('toast-text');
    this.btnRollback = document.getElementById('btn-quick-rollback');
    this.btnReset = document.getElementById('btn-quick-reset');
    this.headerProjectTrigger = document.getElementById('header-project-info-trigger');
  }

  initRouter() {
    this.renderSidebarMenu();
  }

  renderSidebarMenu() {
    const sidebarList = document.getElementById('sidebar-menu-list');
    if (!sidebarList) return;
    const sidebarTitles = store.state.sidebarTitles || {};
    const activeTab = this.currentView || 'dashboard';

    const itemsConfig = [
      { view: 'dashboard', emoji: '🏠' },
      { view: 'matrix', emoji: '🔲' },
      { view: 'stakeholders', emoji: '👥' },
      { view: 'risks', emoji: '⚠️' },
      { view: 'schedule', emoji: '📅' },
      { view: 'cost', emoji: '💰' },
      { view: 'raci', emoji: '🔗' },
      { view: 'team', emoji: '👔' },
      { view: 'actionItems', emoji: '📋' },
      { view: 'export', emoji: '📥' }
    ];

    let html = '';
    itemsConfig.forEach(item => {
      const title = sidebarTitles[item.view] || item.view;
      const isActive = item.view === activeTab;
      
      html += `
        <li class="sidebar-item">
          <a class="sidebar-link ${isActive ? 'active' : ''}" 
             data-view="${item.view}" 
             title="单点切换，双击重命名">
            <span>${item.emoji}</span>
            <span class="sidebar-link-text">${title}</span>
          </a>
        </li>
      `;
    });
    
    sidebarList.innerHTML = html;
    this.bindSidebarEvents();
  }

  bindSidebarEvents() {
    const navLinks = document.querySelectorAll('.sidebar-link');
    const pageViews = document.querySelectorAll('.page-view');

    navLinks.forEach(link => {
      // Single Click: Tab Router
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        this.currentView = targetView;

        // Re-render sidebar to move active class
        this.renderSidebarMenu();

        // Toggle page views
        pageViews.forEach(view => {
          view.classList.remove('active');
          if (view.id === `view-${targetView}`) {
            view.classList.add('active');
          }
        });

        // Trigger component activate/refresh callback if exists
        if (this.components[targetView] && typeof this.components[targetView].onActivate === 'function') {
          this.components[targetView].onActivate();
        }
      });

      // Double Click: Rename Sidebar Link
      link.addEventListener('dblclick', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        const currentTitle = store.state.sidebarTitles[targetView] || '';
        
        const bodyHtml = `
          <div class="form-group">
            <label for="rename-tab-input">重新命名该导航标题:</label>
            <input type="text" id="rename-tab-input" name="newTitle" class="form-control" value="${currentTitle}" required>
            <p style="font-size:11px; color:var(--text-muted); margin-top:6px;">
              💡 提示：新的导航名称会自动持久化保存。
            </p>
          </div>
        `;

        ModalHelper.open(
          `重命名导航: ${currentTitle}`,
          bodyHtml,
          (data) => {
            const title = data.newTitle ? data.newTitle.trim() : '';
            if (!title) {
              this.notify({ type: 'error', message: '导航标题不能为空！' });
              return false;
            }
            // Update Store
            store.updateSidebarTitle(targetView, title);
            this.notify({ type: 'success', message: `导航标题已更新为: ${title}` });
            return true;
          }
        );
      });
    });
  }

  initGlobalActions() {
    // Click header project info to edit project details
    this.headerProjectTrigger.addEventListener('click', () => {
      const projectInfo = store.state.projectInfo;
      const bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div class="form-group">
            <label for="project-info-name">项目名称 (Project Name):</label>
            <input type="text" id="project-info-name" name="name" class="form-control" value="${projectInfo.name || ''}" placeholder="输入项目名称" required>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group">
              <label for="project-info-manager">项目经理 (Project Manager):</label>
              <input type="text" id="project-info-manager" name="manager" class="form-control" value="${projectInfo.manager || ''}" required>
            </div>
            <div class="form-group">
              <label for="project-info-sponsor">项目发起人 (Sponsor):</label>
              <input type="text" id="project-info-sponsor" name="sponsor" class="form-control" value="${projectInfo.sponsor || ''}" required>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group">
              <label for="project-info-status">项目生命周期状态:</label>
              <select id="project-info-status" name="status" class="form-control">
                <option value="Initiating" ${projectInfo.status === 'Initiating' ? 'selected' : ''}>启动阶段 (Initiating)</option>
                <option value="Planning" ${projectInfo.status === 'Planning' ? 'selected' : ''}>规划阶段 (Planning)</option>
                <option value="In Progress" ${projectInfo.status === 'In Progress' || projectInfo.status === 'Executing' ? 'selected' : ''}>执行进行中 (In Progress)</option>
                <option value="Closed" ${projectInfo.status === 'Closed' ? 'selected' : ''}>收尾结束 (Closed)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="project-info-budget">批准总预算 (BAC, 元):</label>
              <input type="number" id="project-info-budget" name="budget" min="0" class="form-control" value="${projectInfo.budget || 0}" required>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group">
              <label for="project-info-start">计划开始日期:</label>
              <input type="date" id="project-info-start" name="startDate" class="form-control" value="${projectInfo.startDate || ''}" required>
            </div>
            <div class="form-group">
              <label for="project-info-end">计划完工日期:</label>
              <input type="date" id="project-info-end" name="endDate" class="form-control" value="${projectInfo.endDate || ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label for="project-info-desc">商业目的及项目背景描述:</label>
            <textarea id="project-info-desc" name="description" class="form-control" style="height:80px;" placeholder="录入项目的商业论证与简要描述..." required>${projectInfo.description || ''}</textarea>
          </div>
        </div>
      `;

      ModalHelper.open(
        '编辑项目基本概要信息',
        bodyHtml,
        (data) => {
          if (new Date(data.startDate) > new Date(data.endDate)) {
            this.notify({ type: 'error', message: '日期配置错误：开始日期不能晚于完工日期。' });
            return false;
          }
          store.updateProjectInfo({
            name: data.name,
            manager: data.manager,
            sponsor: data.sponsor,
            status: data.status,
            budget: Number(data.budget || 0),
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.description
          });
          this.notify({ type: 'success', message: '项目主信息更新完成，已广播重绘所有视图。' });
          return true;
        }
      );
    });

    // Reset back to template
    this.btnReset.addEventListener('click', () => {
      if (confirm('确定要清除所有修改，重置为系统默认项目模板数据吗？此操作无法撤销。')) {
        store.resetToDefault();
      }
    });

    // Rollback last transaction
    this.btnRollback.addEventListener('click', () => {
      if (store.history.length === 0) {
        this.notify({ type: 'warning', message: '没有更早的历史修改记录。' });
        return;
      }
      store.rollback();
    });
  }

  initStoreSubscriptions() {
    // Watch store notifications
    store.subscribe('notify', (data) => this.notify(data));
    
    // Watch global state updates for header and sidebar titles
    store.subscribe('state-updated', (state) => {
      this.updateHeaderUI(state);
      this.renderSidebarMenu();
    });
  }

  bootComponents() {
    // Instantiate all components
    this.components.dashboard = new DashboardComponent(document.getElementById('view-dashboard'));
    this.components.matrix = new MatrixComponent(document.getElementById('view-matrix'));
    this.components.stakeholders = new StakeholdersComponent(document.getElementById('view-stakeholders'));
    this.components.risks = new RisksComponent(document.getElementById('view-risks'));
    this.components.schedule = new ScheduleComponent(document.getElementById('view-schedule'));
    this.components.cost = new CostComponent(document.getElementById('view-cost'));
    this.components.raci = new RaciComponent(document.getElementById('view-raci'));
    this.components.team = new TeamComponent(document.getElementById('view-team'));
    this.components.actionItems = new ActionItemsComponent(document.getElementById('view-actionItems'));
    this.components.export = new ExportComponent(document.getElementById('view-export'));
  }

  updateHeaderUI(state) {
    if (!state) return;
    const { name, status } = state.projectInfo;
    
    // Update Title & Badge
    this.projectNameDisplay.textContent = name || '未命名项目';
    this.projectStatusDisplay.textContent = (status || 'PLANNING').toUpperCase();
    
    // Status color mapping
    this.projectStatusDisplay.className = 'badge';
    if (status === 'Initiating') this.projectStatusDisplay.classList.add('badge-initiating');
    else if (status === 'In Progress' || status === 'Executing') this.projectStatusDisplay.classList.add('badge-executing');
    else if (status === 'Closed') this.projectStatusDisplay.classList.add('badge-closing');
    else this.projectStatusDisplay.classList.add('badge-planning');

    // EVM performance index indicators
    const evm = PmpCalculators.calculateEVM(state.costs, state.projectInfo.budget);
    
    // Update EVM indicators
    const cpi = evm.CPI;
    const spi = evm.SPI;
    
    this.evmText.textContent = `CPI: ${cpi.toFixed(2)} | SPI: ${spi.toFixed(2)}`;
    
    // Reset classes
    this.evmLight.className = 'evm-indicator-light';
    
    if (cpi >= 1.0 && spi >= 1.0) {
      this.evmLight.classList.add('green'); // Excellent
    } else if (cpi < 0.9 || spi < 0.9) {
      this.evmLight.classList.add('red'); // Alert / Behind Budget/Schedule
    } else {
      this.evmLight.classList.add('yellow'); // Warning
    }
  }

  notify({ type, message }) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    
    // Toast decoration mapping
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'error') icon = '❌';

    this.toastIcon.textContent = icon;
    this.toastText.textContent = message;
    
    this.toastBanner.className = 'toast-notification show';
    this.toastBanner.classList.add(type);

    this.toastTimer = setTimeout(() => {
      this.toastBanner.classList.remove('show');
    }, 4500);
  }
}

// Global modal helper utility for components to render editing dialogs
export const ModalHelper = {
  open(title, bodyHtml, onSubmit, submitText = '保存') {
    const overlay = document.getElementById('global-modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const contentEl = document.getElementById('modal-body-content');
    const submitEl = document.getElementById('btn-submit-modal');
    
    titleEl.textContent = title;
    contentEl.innerHTML = bodyHtml;
    submitEl.textContent = submitText;
    
    // Event cleanup wrapper
    const form = document.getElementById('modal-form');
    const handleFormSubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      
      const success = onSubmit(data, form);
      if (success !== false) {
        this.close();
      }
    };
    
    form.onsubmit = handleFormSubmit;
    overlay.classList.add('show');
  },
  
  close() {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.classList.remove('show');
    // Clear handlers to avoid memory leak
    document.getElementById('modal-form').onsubmit = null;
  }
};

// Modal cancel/close handlers
document.addEventListener('DOMContentLoaded', () => {
  const btnClose = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel-modal');
  const overlay = document.getElementById('global-modal-overlay');

  const closeAction = () => ModalHelper.close();
  
  if (btnClose) btnClose.addEventListener('click', closeAction);
  if (btnCancel) btnCancel.addEventListener('click', closeAction);
  
  // Close on clicking backdrop
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAction();
    });
  }

  // Boot App
  new PmpApp();
});
