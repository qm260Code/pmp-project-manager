import { store } from '../store.js';
import { PmpDocumentEditor } from './documentEditor.js';

export class MatrixComponent {
  constructor(container) {
    this.container = document.getElementById('pmp-matrix-container');
    
    // Core definition of PMBOK 6th Edition 49 Processes
    this.knowledgeAreas = [
      { key: 'integration', name: '1. 整合管理 (Integration)' },
      { key: 'scope', name: '2. 范围管理 (Scope)' },
      { key: 'schedule', name: '3. 进度管理 (Schedule)' },
      { key: 'cost', name: '4. 成本管理 (Cost)' },
      { key: 'quality', name: '5. 质量管理 (Quality)' },
      { key: 'resource', name: '6. 资源管理 (Resource)' },
      { key: 'communications', name: '7. 沟通管理 (Communications)' },
      { key: 'risk', name: '8. 风险管理 (Risk)' },
      { key: 'procurement', name: '9. 采购管理 (Procurement)' },
      { key: 'stakeholder', name: '10. 相关方管理 (Stakeholder)' }
    ];

    this.processGroups = [
      { key: 'initiating', name: '启动过程组 (Initiating)', class: 'initiating' },
      { key: 'planning', name: '规划过程组 (Planning)', class: 'planning' },
      { key: 'executing', name: '执行过程组 (Executing)', class: 'executing' },
      { key: 'monitoring', name: '监控与控制组 (M&C)', class: 'monitoring' },
      { key: 'closing', name: '收尾过程组 (Closing)', class: 'closing' }
    ];

    this.processes = {
      integration: {
        initiating: [{ id: 'integration_initiating_1', name: '制定项目章程' }],
        planning: [{ id: 'integration_planning_2', name: '制定项目管理计划' }],
        executing: [
          { id: 'integration_executing_1', name: '指导与管理项目工作' },
          { id: 'integration_executing_2', name: '管理项目知识' }
        ],
        monitoring: [
          { id: 'integration_monitoring_1', name: '监控项目工作' },
          { id: 'integration_monitoring_2', name: '实施整体变更控制' }
        ],
        closing: [{ id: 'integration_closing_1', name: '结束项目或阶段' }]
      },
      scope: {
        initiating: [],
        planning: [
          { id: 'scope_planning_1', name: '规划范围管理' },
          { id: 'scope_planning_2', name: '收集需求' },
          { id: 'scope_planning_3', name: '定义范围' },
          { id: 'scope_planning_4', name: '创建 WBS' }
        ],
        executing: [],
        monitoring: [
          { id: 'scope_monitoring_1', name: '确认范围' },
          { id: 'scope_monitoring_2', name: '控制范围' }
        ],
        closing: []
      },
      schedule: {
        initiating: [],
        planning: [
          { id: 'schedule_planning_1', name: '规划进度管理' },
          { id: 'schedule_planning_2', name: '定义活动' },
          { id: 'schedule_planning_3', name: '排列活动顺序' },
          { id: 'schedule_planning_4', name: '估算活动持续时间' },
          { id: 'schedule_planning_5', name: '制定进度计划' }
        ],
        executing: [],
        monitoring: [{ id: 'schedule_monitoring_1', name: '控制进度' }],
        closing: []
      },
      cost: {
        initiating: [],
        planning: [
          { id: 'cost_planning_1', name: '规划成本管理' },
          { id: 'cost_planning_2', name: '估算成本' },
          { id: 'cost_planning_3', name: '制定预算' }
        ],
        executing: [],
        monitoring: [{ id: 'cost_monitoring_1', name: '控制成本' }],
        closing: []
      },
      quality: {
        initiating: [],
        planning: [{ id: 'quality_planning_1', name: '规划质量管理' }],
        executing: [{ id: 'quality_executing_1', name: '管理质量' }],
        monitoring: [{ id: 'quality_monitoring_1', name: '控制质量' }],
        closing: []
      },
      resource: {
        initiating: [],
        planning: [
          { id: 'resource_planning_1', name: '规划资源管理' },
          { id: 'resource_planning_2', name: '估算活动资源' }
        ],
        executing: [
          { id: 'resource_executing_1', name: '获取资源' },
          { id: 'resource_executing_2', name: '建设团队' },
          { id: 'resource_executing_3', name: '管理团队' }
        ],
        monitoring: [{ id: 'resource_monitoring_1', name: '控制资源' }],
        closing: []
      },
      communications: {
        initiating: [],
        planning: [{ id: 'communications_planning_1', name: '规划沟通管理' }],
        executing: [{ id: 'communications_executing_1', name: '管理沟通' }],
        monitoring: [{ id: 'communications_monitoring_1', name: '监督沟通' }],
        closing: []
      },
      risk: {
        initiating: [],
        planning: [
          { id: 'risk_planning_1', name: '规划风险管理' },
          { id: 'risk_planning_2', name: '识别风险' },
          { id: 'risk_planning_3', name: '实施定性风险分析' },
          { id: 'risk_planning_4', name: '实施定量风险分析' },
          { id: 'risk_planning_5', name: '规划风险应对' }
        ],
        executing: [{ id: 'risk_executing_1', name: '实施风险应对' }],
        monitoring: [{ id: 'risk_monitoring_1', name: '监督风险' }],
        closing: []
      },
      procurement: {
        initiating: [],
        planning: [{ id: 'procurement_planning_1', name: '规划采购管理' }],
        executing: [{ id: 'procurement_executing_1', name: '实施采购' }],
        monitoring: [{ id: 'procurement_monitoring_1', name: '控制采购' }],
        closing: []
      },
      stakeholder: {
        initiating: [{ id: 'stakeholder_initiating_1', name: '识别相关方' }],
        planning: [{ id: 'stakeholder_planning_1', name: '规划相关方参与' }],
        executing: [{ id: 'stakeholder_executing_1', name: '管理相关方参与' }],
        monitoring: [{ id: 'stakeholder_monitoring_1', name: '监督相关方参与' }],
        closing: []
      }
    };

    this.render();

    // Redraw on store updates
    store.subscribe('state-updated', () => {
      this.render();
    });
  }

  render() {
    let html = `<div class="pmp-matrix">`;

    // Row 0: Headers
    html += `<div class="matrix-header header-ka">知识领域 (Knowledge Areas)</div>`;
    this.processGroups.forEach(pg => {
      html += `<div class="matrix-header ${pg.class}">${pg.name}</div>`;
    });

    // Row 1 to 10: Knowledge Area rows
    this.knowledgeAreas.forEach(ka => {
      // Row header (Knowledge Area Name)
      html += `<div class="matrix-row-title">${ka.name}</div>`;

      // Cells for each process group
      this.processGroups.forEach(pg => {
        const cellProcesses = (this.processes[ka.key] && this.processes[ka.key][pg.key]) || [];
        
        html += `<div class="matrix-cell" data-ka="${ka.key}" data-pg="${pg.key}">`;
        
        cellProcesses.forEach(proc => {
          const docKey = PmpDocumentEditor.getDocKey(ka.key, pg.key, proc.id);
          const docText = store.state.documents[docKey] || '';
          
          let status = 'not-started';
          if (docText.trim()) {
            status = docText.includes('状态: 定稿发布') || docText.includes('状态: 最终') ? 'final' : 'draft';
          }
          
          html += `
            <div class="process-item status-${status}" 
                 data-doc-key="${docKey}" 
                 data-proc-id="${proc.id}"
                 data-proc-name="${proc.name}"
                 data-ka-name="${ka.name}"
                 data-pg-name="${pg.name}">
              <span>${proc.name}</span>
              <span class="process-indicator"></span>
            </div>
          `;
        });
        
        html += `</div>`;
      });
    });

    html += `</div>`;
    this.container.innerHTML = html;

    this.bindEvents();
  }

  bindEvents() {
    // Click a process item to open document editor
    const items = this.container.querySelectorAll('.process-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const kaName = item.getAttribute('data-ka-name');
        const pgName = item.getAttribute('data-pg-name');
        const procId = item.getAttribute('data-proc-id');
        const procName = item.getAttribute('data-proc-name');
        const docKey = item.getAttribute('data-doc-key');
        
        PmpDocumentEditor.openEditor(kaName, pgName, procId, procName, docKey);
      });
    });
  }
}
