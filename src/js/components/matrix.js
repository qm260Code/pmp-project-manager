import { store } from '../store.js';
import { PmpDocumentEditor } from './documentEditor.js';
import { t } from '../utils/i18n.js';

export class MatrixComponent {
  constructor(container) {
    this.container = document.getElementById('pmp-matrix-container');
    
    this.render();

    // Redraw on store updates
    store.subscribe('state-updated', () => {
      this.render();
    });
  }

  getLocalizedData(lang) {
    const isEn = lang !== 'zh';
    return {
      knowledgeAreas: [
        { key: 'integration', name: isEn ? '1. Integration Management' : '1. 整合管理 (Integration)' },
        { key: 'scope', name: isEn ? '2. Scope Management' : '2. 范围管理 (Scope)' },
        { key: 'schedule', name: isEn ? '3. Schedule Management' : '3. 进度管理 (Schedule)' },
        { key: 'cost', name: isEn ? '4. Cost Management' : '4. 成本管理 (Cost)' },
        { key: 'quality', name: isEn ? '5. Quality Management' : '5. 质量管理 (Quality)' },
        { key: 'resource', name: isEn ? '6. Resource Management' : '6. 资源管理 (Resource)' },
        { key: 'communications', name: isEn ? '7. Communications Management' : '7. 沟通管理 (Communications)' },
        { key: 'risk', name: isEn ? '8. Risk Management' : '8. 风险管理 (Risk)' },
        { key: 'procurement', name: isEn ? '9. Procurement Management' : '9. 采购管理 (Procurement)' },
        { key: 'stakeholder', name: isEn ? '10. Stakeholder Management' : '10. 相关方管理 (Stakeholder)' }
      ],
      processGroups: [
        { key: 'initiating', name: isEn ? 'Initiating Group' : '启动过程组 (Initiating)', class: 'initiating' },
        { key: 'planning', name: isEn ? 'Planning Group' : '规划过程组 (Planning)', class: 'planning' },
        { key: 'executing', name: isEn ? 'Executing Group' : '执行过程组 (Executing)', class: 'executing' },
        { key: 'monitoring', name: isEn ? 'Monitoring & Controlling' : '监控与控制组 (M&C)', class: 'monitoring' },
        { key: 'closing', name: isEn ? 'Closing Group' : '收尾过程组 (Closing)', class: 'closing' }
      ],
      processes: {
        integration: {
          initiating: [{ id: 'integration_initiating_1', name: isEn ? 'Develop Project Charter' : '制定项目章程' }],
          planning: [{ id: 'integration_planning_2', name: isEn ? 'Develop Project Management Plan' : '制定项目管理计划' }],
          executing: [
            { id: 'integration_executing_1', name: isEn ? 'Direct & Manage Project Work' : '指导与管理项目工作' },
            { id: 'integration_executing_2', name: isEn ? 'Manage Project Knowledge' : '管理项目知识' }
          ],
          monitoring: [
            { id: 'integration_monitoring_1', name: isEn ? 'Monitor & Control Project Work' : '监控项目工作' },
            { id: 'integration_monitoring_2', name: isEn ? 'Perform Integrated Change Control' : '实施整体变更控制' }
          ],
          closing: [{ id: 'integration_closing_1', name: isEn ? 'Close Project or Phase' : '结束项目或阶段' }]
        },
        scope: {
          initiating: [],
          planning: [
            { id: 'scope_planning_1', name: isEn ? 'Plan Scope Management' : '规划范围管理' },
            { id: 'scope_planning_2', name: isEn ? 'Collect Requirements' : '收集需求' },
            { id: 'scope_planning_3', name: isEn ? 'Define Scope' : '定义范围' },
            { id: 'scope_planning_4', name: isEn ? 'Create WBS' : '创建 WBS' }
          ],
          executing: [],
          monitoring: [
            { id: 'scope_monitoring_1', name: isEn ? 'Validate Scope' : '确认范围' },
            { id: 'scope_monitoring_2', name: isEn ? 'Control Scope' : '控制范围' }
          ],
          closing: []
        },
        schedule: {
          initiating: [],
          planning: [
            { id: 'schedule_planning_1', name: isEn ? 'Plan Schedule Management' : '规划进度管理' },
            { id: 'schedule_planning_2', name: isEn ? 'Define Activities' : '定义活动' },
            { id: 'schedule_planning_3', name: isEn ? 'Sequence Activities' : '排列活动顺序' },
            { id: 'schedule_planning_4', name: isEn ? 'Estimate Activity Durations' : '估算活动持续时间' },
            { id: 'schedule_planning_5', name: isEn ? 'Develop Schedule' : '制定进度计划' }
          ],
          executing: [],
          monitoring: [{ id: 'schedule_monitoring_1', name: isEn ? 'Control Schedule' : '控制进度' }],
          closing: []
        },
        cost: {
          initiating: [],
          planning: [
            { id: 'cost_planning_1', name: isEn ? 'Plan Cost Management' : '规划成本管理' },
            { id: 'cost_planning_2', name: isEn ? 'Estimate Costs' : '估算成本' },
            { id: 'cost_planning_3', name: isEn ? 'Determine Budget' : '制定预算' }
          ],
          executing: [],
          monitoring: [{ id: 'cost_monitoring_1', name: isEn ? 'Control Costs' : '控制成本' }],
          closing: []
        },
        quality: {
          initiating: [],
          planning: [{ id: 'quality_planning_1', name: isEn ? 'Plan Quality Management' : '规划质量管理' }],
          executing: [{ id: 'quality_executing_1', name: isEn ? 'Manage Quality' : '管理质量' }],
          monitoring: [{ id: 'quality_monitoring_1', name: isEn ? 'Control Quality' : '控制质量' }],
          closing: []
        },
        resource: {
          initiating: [],
          planning: [
            { id: 'resource_planning_1', name: isEn ? 'Plan Resource Management' : '规划资源管理' },
            { id: 'resource_planning_2', name: isEn ? 'Estimate Activity Resources' : '估算活动资源' }
          ],
          executing: [
            { id: 'resource_executing_1', name: isEn ? 'Acquire Resources' : '获取资源' },
            { id: 'resource_executing_2', name: isEn ? 'Develop Team' : '建设团队' },
            { id: 'resource_executing_3', name: isEn ? 'Manage Team' : '管理团队' }
          ],
          monitoring: [{ id: 'resource_monitoring_1', name: isEn ? 'Control Resources' : '控制资源' }],
          closing: []
        },
        communications: {
          initiating: [],
          planning: [{ id: 'communications_planning_1', name: isEn ? 'Plan Communications Management' : '规划沟通管理' }],
          executing: [{ id: 'communications_executing_1', name: isEn ? 'Manage Communications' : '管理沟通' }],
          monitoring: [{ id: 'communications_monitoring_1', name: isEn ? 'Monitor Communications' : '监督沟通' }],
          closing: []
        },
        risk: {
          initiating: [],
          planning: [
            { id: 'risk_planning_1', name: isEn ? 'Plan Risk Management' : '规划风险管理' },
            { id: 'risk_planning_2', name: isEn ? 'Identify Risks' : '识别风险' },
            { id: 'risk_planning_3', name: isEn ? 'Perform Qualitative Risk Analysis' : '实施定性风险分析' },
            { id: 'risk_planning_4', name: isEn ? 'Perform Quantitative Risk Analysis' : '实施定量风险分析' },
            { id: 'risk_planning_5', name: isEn ? 'Plan Risk Responses' : '规划风险应对' }
          ],
          executing: [{ id: 'risk_executing_1', name: isEn ? 'Implement Risk Responses' : '实施风险应对' }],
          monitoring: [{ id: 'risk_monitoring_1', name: isEn ? 'Monitor Risks' : '监督风险' }],
          closing: []
        },
        procurement: {
          initiating: [],
          planning: [{ id: 'procurement_planning_1', name: isEn ? 'Plan Procurement Management' : '规划采购管理' }],
          executing: [{ id: 'procurement_executing_1', name: isEn ? 'Conduct Procurements' : '实施采购' }],
          monitoring: [{ id: 'procurement_monitoring_1', name: isEn ? 'Control Procurements' : '控制采购' }],
          closing: []
        },
        stakeholder: {
          initiating: [{ id: 'stakeholder_initiating_1', name: isEn ? 'Identify Stakeholders' : '识别相关方' }],
          planning: [{ id: 'stakeholder_planning_1', name: isEn ? 'Plan Stakeholder Engagement' : '规划相关方参与' }],
          executing: [{ id: 'stakeholder_executing_1', name: isEn ? 'Manage Stakeholder Engagement' : '管理相关方参与' }],
          monitoring: [{ id: 'stakeholder_monitoring_1', name: isEn ? 'Monitor Stakeholder Engagement' : '监督相关方参与' }],
          closing: []
        }
      }
    };
  }

  render() {
    const lang = store.state.language || 'en';
    const data = this.getLocalizedData(lang);
    const isEn = lang !== 'zh';

    let html = `<div class="pmp-matrix">`;

    // Row 0: Headers
    html += `<div class="matrix-header header-ka">${isEn ? 'Knowledge Areas' : '知识领域 (Knowledge Areas)'}</div>`;
    data.processGroups.forEach(pg => {
      html += `<div class="matrix-header ${pg.class}">${pg.name}</div>`;
    });

    // Row 1 to 10: Knowledge Area rows
    data.knowledgeAreas.forEach(ka => {
      // Row header (Knowledge Area Name)
      html += `<div class="matrix-row-title">${ka.name}</div>`;

      // Cells for each process group
      data.processGroups.forEach(pg => {
        const cellProcesses = (data.processes[ka.key] && data.processes[ka.key][pg.key]) || [];
        
        html += `<div class="matrix-cell" data-ka="${ka.key}" data-pg="${pg.key}">`;
        
        cellProcesses.forEach(proc => {
          const docKey = PmpDocumentEditor.getDocKey(ka.key, pg.key, proc.id);
          const docText = store.state.documents[docKey] || '';
          
          let status = 'not-started';
          if (docText.trim()) {
            status = docText.includes('状态: 定稿') || docText.includes('status: final') || docText.includes('Status: Final') || docText.includes('状态: 定稿发布') || docText.includes('状态: 最终') ? 'final' : 'draft';
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
