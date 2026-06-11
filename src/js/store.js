import { InitialData } from './utils/initialData.js';

class PmpStore {
  constructor() {
    this.subscribers = {};
    this.history = [];
    this.maxHistory = 3;
    
    // Load initial state
    this.state = this.loadState();
  }

  /**
   * Safe loader from LocalStorage
   */
  loadState() {
    try {
      const stored = localStorage.getItem('pmp_project_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (this.validateStateSchema(parsed)) {
          let updated = false;
          
          // Dynamic patch for sidebar custom titles if upgrading from older caches
          if (!parsed.sidebarTitles) {
            parsed.sidebarTitles = {};
          }
          const defaultTitles = {
            dashboard: "项目基本情况总览",
            matrix: "PMP 5x10 过程矩阵",
            stakeholders: "相关方登记册 (10.1)",
            risks: "风险登记册 (11.2)",
            schedule: "进度里程碑与甘特图",
            cost: "成本挣值分析 (EVM)",
            raci: "责任分配矩阵 (RACI)",
            team: "团队组织架构",
            actionItems: "项目待完成事项",
            changeRequests: "项目变更管理",
            requirements: "客户需求管理",
            export: "数据导出与分析报告"
          };
          Object.keys(defaultTitles).forEach(k => {
            if (!parsed.sidebarTitles[k]) {
              parsed.sidebarTitles[k] = defaultTitles[k];
              updated = true;
            }
          });

          // Dynamic patch for team, actionItems, changeRequests, and requirements
          if (!parsed.team) {
            parsed.team = JSON.parse(JSON.stringify(InitialData.team || []));
            updated = true;
          }
          if (!parsed.actionItems) {
            parsed.actionItems = JSON.parse(JSON.stringify(InitialData.actionItems || []));
            updated = true;
          }
          if (!parsed.changeRequests) {
            parsed.changeRequests = [];
            updated = true;
          }
          if (!parsed.requirements) {
            parsed.requirements = [];
            updated = true;
          }

          // Migration to Multi-project Schema
          if (!parsed.projectsList || !parsed.currentProjectId) {
            parsed.projectsList = [];
            parsed.currentProjectId = 'p-1';
            
            const projectKeys = ['projectInfo', 'documents', 'stakeholders', 'risks', 'schedule', 'costs', 'raci', 'team', 'actionItems', 'sidebarTitles', 'changeRequests', 'requirements'];
            const firstProject = { id: 'p-1' };
            projectKeys.forEach(key => {
              firstProject[key] = JSON.parse(JSON.stringify(parsed[key] || (key === 'changeRequests' || key === 'requirements' ? [] : {})));
            });
            parsed.projectsList.push(firstProject);
            updated = true;
          } else {
            // Force-sync active root fields from projectsList to avoid inconsistency
            const activeProject = parsed.projectsList.find(p => p.id === parsed.currentProjectId);
            if (activeProject) {
              const projectKeys = ['projectInfo', 'documents', 'stakeholders', 'risks', 'schedule', 'costs', 'raci', 'team', 'actionItems', 'sidebarTitles', 'changeRequests', 'requirements'];
              projectKeys.forEach(key => {
                parsed[key] = JSON.parse(JSON.stringify(activeProject[key] || (key === 'changeRequests' || key === 'requirements' ? [] : {})));
              });
            }
          }

          if (updated) {
            this.saveToStorage(parsed);
          }
          
          return parsed;
        } else {
          console.warn('[PmpStore] LocalStorage data failed schema validation. Resetting to template.');
        }
      }
    } catch (e) {
      console.error('[PmpStore] Failed parsing LocalStorage JSON:', e);
    }
    
    // Fallback to initial default data
    const defaultData = JSON.parse(JSON.stringify(InitialData));
    defaultData.projectsList = [];
    defaultData.currentProjectId = 'p-1';
    
    const projectKeys = ['projectInfo', 'documents', 'stakeholders', 'risks', 'schedule', 'costs', 'raci', 'team', 'actionItems', 'sidebarTitles', 'changeRequests', 'requirements'];
    const firstProject = { id: 'p-1' };
    projectKeys.forEach(key => {
      firstProject[key] = JSON.parse(JSON.stringify(defaultData[key] || (key === 'changeRequests' || key === 'requirements' ? [] : {})));
    });
    // Add custom modules default titles if missing
    firstProject.sidebarTitles.changeRequests = "项目变更管理";
    firstProject.sidebarTitles.requirements = "客户需求管理";
    
    defaultData.projectsList.push(firstProject);
    
    this.saveToStorage(defaultData);
    return defaultData;
  }

  /**
   * Validate structural presence of core properties to avoid UI crashes
   */
  validateStateSchema(data) {
    if (!data) return false;
    const requiredKeys = ['projectInfo', 'documents', 'stakeholders', 'risks', 'schedule', 'costs', 'raci'];
    return requiredKeys.every(key => key in data);
  }

  /**
   * Direct write to LocalStorage
   */
  saveToStorage(data) {
    try {
      localStorage.setItem('pmp_project_data', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[PmpStore] LocalStorage write failed:', e);
      return false;
    }
  }

  /**
   * Push current state clone into rollback history
   */
  pushHistory() {
    if (this.history.length >= this.maxHistory) {
      this.history.shift();
    }
    this.history.push(JSON.stringify(this.state));
  }

  /**
   * Rollback to last saved state
   */
  rollback() {
    if (this.history.length > 0) {
      const previous = this.history.pop();
      try {
        const parsed = JSON.parse(previous);
        this.state = parsed;
        this.saveToStorage(this.state);
        this.publish('state-updated', this.state);
        this.publish('notify', { type: 'warning', message: '已成功回滚到上一次的历史备份。' });
        return true;
      } catch (e) {
        console.error('[PmpStore] Failed during history parse rollback:', e);
      }
    }
    return false;
  }

  /**
   * Commit state, update localStorage and notify listeners
   */
  commit() {
    this.pushHistory();

    // Sync active root fields to projectsList before saving
    if (this.state.projectsList && this.state.currentProjectId) {
      const projectKeys = ['projectInfo', 'documents', 'stakeholders', 'risks', 'schedule', 'costs', 'raci', 'team', 'actionItems', 'sidebarTitles', 'changeRequests', 'requirements'];
      const activeIdx = this.state.projectsList.findIndex(p => p.id === this.state.currentProjectId);
      if (activeIdx !== -1) {
        const projectData = { id: this.state.currentProjectId };
        projectKeys.forEach(key => {
          projectData[key] = JSON.parse(JSON.stringify(this.state[key] || (key === 'changeRequests' || key === 'requirements' ? [] : {})));
        });
        this.state.projectsList[activeIdx] = projectData;
      }
    }

    const success = this.saveToStorage(this.state);
    if (success) {
      this.publish('state-updated', this.state);
    } else {
      this.publish('notify', { type: 'error', message: '数据保存失败，本地存储可能已满！' });
    }
  }

  /**
   * Import project from external JSON payload
   */
  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (this.validateStateSchema(parsed)) {
        this.pushHistory();
        this.state = parsed;
        this.commit();
        this.publish('notify', { type: 'success', message: '项目数据成功导入并已同步。' });
        return true;
      } else {
        throw new Error('JSON 数据缺失 PMP 核心架构键值（例如 risks, schedule, costs）。');
      }
    } catch (e) {
      console.error('[PmpStore] Import failed:', e);
      this.publish('notify', { type: 'error', message: `导入失败: ${e.message}` });
      return false;
    }
  }

  /**
   * Reset database back to default initial template
   */
  resetToDefault() {
    this.pushHistory();
    this.state = JSON.parse(JSON.stringify(InitialData));
    this.commit();
    this.publish('notify', { type: 'success', message: '已恢复系统初始默认项目模版。' });
  }

  /**
   * Pub/Sub Event System
   */
  subscribe(topic, callback) {
    if (!this.subscribers[topic]) {
      this.subscribers[topic] = [];
    }
    this.subscribers[topic].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers[topic] = this.subscribers[topic].filter(cb => cb !== callback);
    };
  }

  publish(topic, data) {
    if (this.subscribers[topic]) {
      this.subscribers[topic].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[PmpStore] Error executing callback for ${topic}:`, e);
        }
      });
    }
  }

  /**
   * State Mutators
   */
  updateProjectInfo(info) {
    this.state.projectInfo = { ...this.state.projectInfo, ...info };
    this.commit();
  }

  updateDocument(docId, text) {
    this.state.documents[docId] = text;
    this.commit();
  }

  // Stakeholders
  addStakeholder(sh) {
    const newSh = { id: 'sh-' + Date.now(), ...sh };
    this.state.stakeholders.push(newSh);
    this.commit();
  }

  updateStakeholder(id, updated) {
    this.state.stakeholders = this.state.stakeholders.map(item => 
      item.id === id ? { ...item, ...updated } : item
    );
    this.commit();
  }

  deleteStakeholder(id) {
    this.state.stakeholders = this.state.stakeholders.filter(item => item.id !== id);
    this.commit();
  }

  // Risks
  addRisk(risk) {
    const newRisk = { id: 'r-' + Date.now(), ...risk };
    this.state.risks.push(newRisk);
    this.commit();
  }

  updateRisk(id, updated) {
    this.state.risks = this.state.risks.map(item => 
      item.id === id ? { ...item, ...updated } : item
    );
    this.commit();
  }

  deleteRisk(id) {
    this.state.risks = this.state.risks.filter(item => item.id !== id);
    this.commit();
  }

  // Schedule / Gantt
  addScheduleItem(task) {
    const newTask = { id: 't-' + Date.now(), ...task };
    this.state.schedule.push(newTask);
    this.commit();
  }

  updateScheduleItem(id, updated) {
    this.state.schedule = this.state.schedule.map(item => 
      item.id === id ? { ...item, ...updated } : item
    );
    this.commit();
  }

  deleteScheduleItem(id) {
    this.state.schedule = this.state.schedule.filter(item => item.id !== id);
    this.commit();
  }

  // Costs / Budget
  addCostItem(cost) {
    const newCost = { id: 'c-' + Date.now(), ...cost };
    this.state.costs.push(newCost);
    this.commit();
  }

  updateCostItem(id, updated) {
    this.state.costs = this.state.costs.map(item => 
      item.id === id ? { ...item, ...updated } : item
    );
    this.commit();
  }

  deleteCostItem(id) {
    this.state.costs = this.state.costs.filter(item => item.id !== id);
    this.commit();
  }

  // RACI Matrix
  updateRaci(activityIndex, roleName, value) {
    if (this.state.raci.matrix[activityIndex]) {
      this.state.raci.matrix[activityIndex].roles[roleName] = value;
      this.commit();
    }
  }

  addRaciActivity(activity) {
    const rolesObj = {};
    this.state.raci.roles.forEach(role => {
      rolesObj[role] = '';
    });
    this.state.raci.matrix.push({ activity, roles: rolesObj });
    this.commit();
  }

  deleteRaciActivity(index) {
    this.state.raci.matrix.splice(index, 1);
    this.commit();
  }

  updateRaciRoles(roles) {
    // Save previous matrix row activity names and create new roles objects
    const oldMatrix = this.state.raci.matrix;
    const newMatrix = oldMatrix.map(row => {
      const newRoles = {};
      roles.forEach(role => {
        newRoles[role] = row.roles[role] || ''; // preserve previous values if matches
      });
      return { activity: row.activity, roles: newRoles };
    });
    
    this.state.raci.roles = roles;
    this.state.raci.matrix = newMatrix;
    this.commit();
  }

  updateSidebarTitle(tabId, title) {
    if (this.state.sidebarTitles) {
      this.state.sidebarTitles[tabId] = title;
      this.commit();
    }
  }

  // Team Organisation Chart mutators
  addTeamMember(member) {
    const newMember = { id: 'm-' + Date.now(), ...member };
    this.state.team.push(newMember);
    this.commit();
  }

  updateTeamMember(id, updated) {
    this.state.team = this.state.team.map(item => 
      item.id === id ? { ...item, ...updated } : item
    );
    this.commit();
  }

  deleteTeamMember(id) {
    // Break relationships pointing to this deleted node to avoid rendering cycles
    this.state.team = this.state.team.map(item => 
      item.reportsTo === id ? { ...item, reportsTo: '' } : item
    );
    this.state.team = this.state.team.filter(item => item.id !== id);
    this.commit();
  }

  // Action Items mutators
  addActionItem(item) {
    const newItem = { id: 'a-' + Date.now(), ...item };
    this.state.actionItems.push(newItem);
    this.commit();
  }

  updateActionItem(id, updated) {
    this.state.actionItems = this.state.actionItems.map(item => 
      item.id === id ? { ...item, ...updated } : item
    );
    this.commit();
  }

  deleteActionItem(id) {
    this.state.actionItems = this.state.actionItems.filter(item => item.id !== id);
    this.commit();
  }

  // Multi-Project APIs
  switchProject(newProjectId) {
    if (newProjectId === this.state.currentProjectId) return;
    
    const projectKeys = ['projectInfo', 'documents', 'stakeholders', 'risks', 'schedule', 'costs', 'raci', 'team', 'actionItems', 'sidebarTitles', 'changeRequests', 'requirements'];
    
    // 1. Save current active state to projectsList
    const currentProjectIndex = this.state.projectsList.findIndex(p => p.id === this.state.currentProjectId);
    if (currentProjectIndex !== -1) {
      const projectData = { id: this.state.currentProjectId };
      projectKeys.forEach(key => {
        projectData[key] = JSON.parse(JSON.stringify(this.state[key] || (key === 'changeRequests' || key === 'requirements' ? [] : {})));
      });
      this.state.projectsList[currentProjectIndex] = projectData;
    }
    
    // 2. Load target project data to root
    const targetProject = this.state.projectsList.find(p => p.id === newProjectId);
    if (targetProject) {
      projectKeys.forEach(key => {
        this.state[key] = JSON.parse(JSON.stringify(targetProject[key] || (key === 'changeRequests' || key === 'requirements' ? [] : {})));
      });
      this.state.currentProjectId = newProjectId;
      
      // Clear history when switching projects to avoid cross-project rollbacks
      this.history = [];
      this.commit();
      this.publish('notify', { type: 'success', message: `已成功切换到项目：${this.state.projectInfo.name}` });
    }
  }

  createNewProject(name) {
    const projectKeys = ['projectInfo', 'documents', 'stakeholders', 'risks', 'schedule', 'costs', 'raci', 'team', 'actionItems', 'sidebarTitles', 'changeRequests', 'requirements'];
    
    // Save current active project first
    const currentProjectIndex = this.state.projectsList.findIndex(p => p.id === this.state.currentProjectId);
    if (currentProjectIndex !== -1) {
      const projectData = { id: this.state.currentProjectId };
      projectKeys.forEach(key => {
        projectData[key] = JSON.parse(JSON.stringify(this.state[key] || (key === 'changeRequests' || key === 'requirements' ? [] : {})));
      });
      this.state.projectsList[currentProjectIndex] = projectData;
    }

    // Create a new blank project template
    const newId = 'p-' + Date.now();
    const newProject = {
      id: newId,
      projectInfo: {
        name: name,
        manager: '未指定',
        sponsor: '未指定',
        status: 'Planning',
        budget: 100000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        description: '暂无项目商业论证与背景描述。'
      },
      documents: {
        developProjectCharter: `# 1. 项目章程 (Project Charter)\n\n## 1.1 项目背景与目的\n（在此录入新建项目的背景和商业目的）\n\n## 1.2 项目目标\n（如时间、预算、交付标准）`,
        developProjectManagementPlan: `# 2. 项目管理计划\n\n（在此规划项目各个知识领域的管理基准）`,
        defineScope: `# 3. 项目范围说明书\n\n## 3.1 范围描述\n\n## 3.2 验收标准`
      },
      stakeholders: [],
      risks: [],
      schedule: [],
      costs: [],
      raci: {
        roles: ['项目经理', '技术负责人', '客户代表', '测试经理'],
        matrix: []
      },
      team: [],
      actionItems: [],
      sidebarTitles: {
        dashboard: "项目基本情况总览",
        matrix: "PMP 5x10 过程矩阵",
        stakeholders: "相关方登记册 (10.1)",
        risks: "风险登记册 (11.2)",
        schedule: "进度里程碑与甘特图",
        cost: "成本挣值分析 (EVM)",
        raci: "责任分配矩阵 (RACI)",
        team: "团队组织架构",
        actionItems: "项目待完成事项",
        changeRequests: "项目变更管理",
        requirements: "客户需求管理",
        export: "数据导出与分析报告"
      },
      changeRequests: [],
      requirements: []
    };

    this.state.projectsList.push(newProject);
    
    // Switch to this new project
    projectKeys.forEach(key => {
      this.state[key] = JSON.parse(JSON.stringify(newProject[key]));
    });
    this.state.currentProjectId = newId;
    
    this.history = [];
    this.commit();
    this.publish('notify', { type: 'success', message: `新建并切换至项目：${name}` });
  }

  deleteProject(projectId) {
    if (this.state.projectsList.length <= 1) {
      this.publish('notify', { type: 'error', message: '无法删除：系统中必须保留至少一个项目！' });
      return false;
    }

    const indexToDelete = this.state.projectsList.findIndex(p => p.id === projectId);
    if (indexToDelete === -1) return false;

    // Delete the project from the list
    this.state.projectsList = this.state.projectsList.filter(p => p.id !== projectId);

    // If we are deleting the currently active project, switch to another project first
    if (this.state.currentProjectId === projectId) {
      const nextActiveProject = this.state.projectsList[0];
      const projectKeys = ['projectInfo', 'documents', 'stakeholders', 'risks', 'schedule', 'costs', 'raci', 'team', 'actionItems', 'sidebarTitles', 'changeRequests', 'requirements'];
      
      projectKeys.forEach(key => {
        this.state[key] = JSON.parse(JSON.stringify(nextActiveProject[key] || (key === 'changeRequests' || key === 'requirements' ? [] : {})));
      });
      this.state.currentProjectId = nextActiveProject.id;
    }

    this.history = [];
    this.commit();
    this.publish('notify', { type: 'success', message: '项目已从系统中删除。' });
    return true;
  }

  // Change Requests Mutators
  addChangeRequest(cr) {
    if (!this.state.changeRequests) this.state.changeRequests = [];
    const newCr = { id: 'cr-' + Date.now(), dateRaised: new Date().toISOString().split('T')[0], ...cr };
    this.state.changeRequests.push(newCr);
    this.commit();
  }

  updateChangeRequest(id, updated) {
    if (!this.state.changeRequests) this.state.changeRequests = [];
    this.state.changeRequests = this.state.changeRequests.map(item => 
      item.id === id ? { ...item, ...updated } : item
    );
    this.commit();
  }

  deleteChangeRequest(id) {
    if (!this.state.changeRequests) this.state.changeRequests = [];
    this.state.changeRequests = this.state.changeRequests.filter(item => item.id !== id);
    this.commit();
  }

  // Requirements Mutators
  addRequirement(req) {
    if (!this.state.requirements) this.state.requirements = [];
    const newReq = { id: 'req-' + Date.now(), ...req };
    this.state.requirements.push(newReq);
    this.commit();
  }

  updateRequirement(id, updated) {
    if (!this.state.requirements) this.state.requirements = [];
    this.state.requirements = this.state.requirements.map(item => 
      item.id === id ? { ...item, ...updated } : item
    );
    this.commit();
  }

  deleteRequirement(id) {
    if (!this.state.requirements) this.state.requirements = [];
    this.state.requirements = this.state.requirements.filter(item => item.id !== id);
    this.commit();
  }
}

export const store = new PmpStore();
window.pmpStore = store; // attach globally for debug
export default store;
