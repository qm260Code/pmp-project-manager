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
import { ChangeRequestsComponent } from './components/changeRequests.js';
import { RequirementsComponent } from './components/requirements.js';
import { ExportComponent } from './components/export.js';

// Import i18n helper
import { t, translations } from './utils/i18n.js';

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
    
    // Force initial render of i18n DOM and headers
    this.translateDOM(store.state);
    this.updateHeaderUI(store.state);
    
    // Show welcome notification
    this.notify({ type: 'success', message: t('msg_welcome') });
  }

  initElements() {
    this.projectSelector = document.getElementById('project-selector');
    this.projectStatusDisplay = document.getElementById('header-project-status');
    this.evmLight = document.getElementById('header-evm-light');
    this.evmText = document.getElementById('header-evm-text');
    this.toastBanner = document.getElementById('toast-banner');
    this.toastIcon = document.getElementById('toast-icon');
    this.toastText = document.getElementById('toast-text');
    this.btnRollback = document.getElementById('btn-quick-rollback');
    this.btnReset = document.getElementById('btn-quick-reset');
    this.btnEditProjectInfo = document.getElementById('btn-edit-project-info');
    this.btnAddProject = document.getElementById('btn-add-new-project');
    this.btnDeleteProject = document.getElementById('btn-delete-current-project');
    this.languageSelector = document.getElementById('language-selector');
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
      { view: 'changeRequests', emoji: '🔄' },
      { view: 'requirements', emoji: '🎯' },
      { view: 'export', emoji: '📥' }
    ];

    // Translation fallbacks for sidebar titles
    const defaultTitlesEn = ["Dashboard", "Process Area Matrix", "Stakeholder Register", "Risk Register", "Schedule & Gantt", "Cost & EVM", "RACI Matrix", "Team Structure", "Action Items Tracker", "Change Requests Log", "Requirements Matrix (RTM)", "Export & Report"];
    const defaultTitlesZh = ["项目总览", "过程矩阵", "相关方登记册 (10.1)", "风险登记册 (11.2)", "进度里程碑与甘特图", "成本挣值分析 (EVM)", "责任分配矩阵 (RACI)", "团队组织架构", "项目待完成事项", "项目变更管理", "客户需求管理", "数据导出与分析报告"];

    let html = '';
    itemsConfig.forEach(item => {
      let title = sidebarTitles[item.view];
      if (!title || defaultTitlesEn.includes(title) || defaultTitlesZh.includes(title)) {
        title = t('nav_' + item.view);
      }
      const isActive = item.view === activeTab;
      
      html += `
        <li class="sidebar-item">
          <a class="sidebar-link ${isActive ? 'active' : ''}" 
             data-view="${item.view}" 
             title="Single click to switch, double click to rename">
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
    // Language switching
    if (this.languageSelector) {
      this.languageSelector.addEventListener('change', (e) => {
        const newLang = e.target.value;
        store.changeLanguage(newLang);
      });
    }

    // Project switching dropdown
    this.projectSelector.addEventListener('change', (e) => {
      const newId = e.target.value;
      store.switchProject(newId);
    });

    // Click to edit active project details
    this.btnEditProjectInfo.addEventListener('click', () => {
      const projectInfo = store.state.projectInfo;
      const lang = store.state.language || 'en';
      const isEn = lang !== 'zh';

      const optInitiating = isEn ? 'Initiating Phase' : '启动阶段 (Initiating)';
      const optPlanning = isEn ? 'Planning Phase' : '规划阶段 (Planning)';
      const optExecuting = isEn ? 'In Progress' : '执行进行中 (In Progress)';
      const optClosed = isEn ? 'Closed / Finished' : '收尾结束 (Closed)';

      const bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div class="form-group">
            <label for="project-info-name">${t('label_project_name')}</label>
            <input type="text" id="project-info-name" name="name" class="form-control" value="${projectInfo.name || ''}" placeholder="${t('placeholder_project_name')}" required>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group">
              <label for="project-info-manager">${t('label_project_manager')}</label>
              <input type="text" id="project-info-manager" name="manager" class="form-control" value="${projectInfo.manager || ''}" required>
            </div>
            <div class="form-group">
              <label for="project-info-sponsor">${t('label_project_sponsor')}</label>
              <input type="text" id="project-info-sponsor" name="sponsor" class="form-control" value="${projectInfo.sponsor || ''}" required>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group">
              <label for="project-info-status">${t('label_project_status')}</label>
              <select id="project-info-status" name="status" class="form-control">
                <option value="Initiating" ${projectInfo.status === 'Initiating' ? 'selected' : ''}>${optInitiating}</option>
                <option value="Planning" ${projectInfo.status === 'Planning' ? 'selected' : ''}>${optPlanning}</option>
                <option value="In Progress" ${projectInfo.status === 'In Progress' || projectInfo.status === 'Executing' ? 'selected' : ''}>${optExecuting}</option>
                <option value="Closed" ${projectInfo.status === 'Closed' ? 'selected' : ''}>${optClosed}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="project-info-budget">${t('label_project_budget')}</label>
              <input type="number" id="project-info-budget" name="budget" min="0" class="form-control" value="${projectInfo.budget || 0}" required>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group">
              <label for="project-info-start">${t('label_project_start_date')}</label>
              <input type="date" id="project-info-start" name="startDate" class="form-control" value="${projectInfo.startDate || ''}" required>
            </div>
            <div class="form-group">
              <label for="project-info-end">${t('label_project_end_date')}</label>
              <input type="date" id="project-info-end" name="endDate" class="form-control" value="${projectInfo.endDate || ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label for="project-info-desc">${t('label_project_description')}</label>
            <textarea id="project-info-desc" name="description" class="form-control" style="height:80px;" placeholder="${t('placeholder_project_desc')}" required>${projectInfo.description || ''}</textarea>
          </div>
        </div>
      `;

      ModalHelper.open(
        t('modal_project_properties_title'),
        bodyHtml,
        (data) => {
          if (new Date(data.startDate) > new Date(data.endDate)) {
            this.notify({ type: 'error', message: t('msg_date_error') });
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
          this.notify({ type: 'success', message: t('msg_project_info_updated') });
          return true;
        }
      );
    });

    // Create new blank project
    this.btnAddProject.addEventListener('click', () => {
      const bodyHtml = `
        <div class="form-group">
          <label for="new-project-name">${t('label_new_project_name')}</label>
          <input type="text" id="new-project-name" name="name" class="form-control" placeholder="${t('placeholder_new_project_name')}" required>
        </div>
      `;
      ModalHelper.open(
        t('modal_new_project_title'),
        bodyHtml,
        (data) => {
          const name = data.name ? data.name.trim() : '';
          if (!name) {
            this.notify({ type: 'error', message: t('msg_input_empty') });
            return false;
          }
          store.createNewProject(name);
          this.notify({ type: 'success', message: t('msg_new_project_created') + name });
          return true;
        }
      );
    });

    // Delete current active project
    this.btnDeleteProject.addEventListener('click', () => {
      const activeProjectName = store.state.projectInfo.name;
      if (confirm(t('msg_confirm_delete_project') || `Warning: Are you sure you want to permanently delete this project?`)) {
        store.deleteProject(store.state.currentProjectId);
        this.notify({ type: 'success', message: t('msg_project_deleted') });
      }
    });

    // Reset back to template
    this.btnReset.addEventListener('click', () => {
      if (confirm(t('msg_confirm_reset_template') || 'Are you sure you want to restore baseline template?')) {
        store.resetToDefault();
        this.notify({ type: 'success', message: 'Restored baseline project templates.' });
      }
    });

    // Rollback last transaction
    this.btnRollback.addEventListener('click', () => {
      if (store.history.length === 0) {
        this.notify({ type: 'warning', message: t('msg_no_older_history') });
        return;
      }
      store.rollback();
      this.notify({ type: 'success', message: t('msg_rollback_success') });
    });
  }

  initStoreSubscriptions() {
    // Watch store notifications
    store.subscribe('notify', (data) => this.notify(data));
    
    // Watch global state updates for header and sidebar titles
    store.subscribe('state-updated', (state) => {
      this.translateDOM(state);
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
    this.components.changeRequests = new ChangeRequestsComponent(document.getElementById('view-changeRequests'));
    this.components.requirements = new RequirementsComponent(document.getElementById('view-requirements'));
    this.components.export = new ExportComponent(document.getElementById('view-export'));
  }

  updateHeaderUI(state) {
    if (!state) return;
    const { status } = state.projectInfo;
    
    // Update project selector option items
    if (this.projectSelector && state.projectsList) {
      let optionsHtml = '';
      state.projectsList.forEach(proj => {
        const isSelected = proj.id === state.currentProjectId ? 'selected' : '';
        const name = proj.projectInfo ? proj.projectInfo.name : '未命名项目';
        optionsHtml += `<option value="${proj.id}" ${isSelected}>${name}</option>`;
      });
      this.projectSelector.innerHTML = optionsHtml;
    }
    
    // Update Status Badge
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

  translateDOM(state) {
    const lang = state.language || 'en';
    
    if (this.languageSelector) {
      this.languageSelector.value = lang;
    }
    
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = translations[lang] && translations[lang][key];
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          el.innerHTML = text;
        }
      }
    });
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
