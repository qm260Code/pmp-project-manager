import { store } from '../store.js';
import { PmpCalculators } from '../utils/pmpCalculators.js';
import { t } from '../utils/i18n.js';

export class ExportComponent {
  constructor(container) {
    this.container = container;
    this.btnExportJson = document.getElementById('btn-export-json');
    this.fileImportJson = document.getElementById('file-import-json');
    this.btnExportShCsv = document.getElementById('btn-export-sh-csv');
    this.btnExportRisksCsv = document.getElementById('btn-export-risks-csv');
    this.btnPrintReport = document.getElementById('btn-generate-print-report');
    
    this.initEvents();
  }

  initEvents() {
    // 1. Export JSON
    this.btnExportJson.addEventListener('click', () => this.exportProjectJson());

    // 2. Import JSON
    this.fileImportJson.addEventListener('change', (e) => this.importProjectJson(e));

    // 3. Export Stakeholders CSV
    this.btnExportShCsv.addEventListener('click', () => this.exportStakeholdersCsv());

    // 4. Export Risks CSV
    this.btnExportRisksCsv.addEventListener('click', () => this.exportRisksCsv());

    // 5. Generate Print Report
    this.btnPrintReport.addEventListener('click', () => this.generatePrintReport());
  }

  exportProjectJson() {
    const dataStr = JSON.stringify(store.state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmp-project-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    store.publish('notify', { type: 'success', message: 'Project JSON backup downloaded successfully.' });
  }

  importProjectJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const success = store.importData(content);
      this.fileImportJson.value = '';
    };
    reader.onerror = () => {
      store.publish('notify', { type: 'error', message: 'Failed to read JSON backup file.' });
    };
    reader.readAsText(file);
  }

  exportStakeholdersCsv() {
    const stakeholders = store.state.stakeholders || [];
    const lang = store.state.language || 'en';
    const isEn = lang !== 'zh';

    if (stakeholders.length === 0) {
      store.publish('notify', { type: 'warning', message: isEn ? 'No stakeholder data registered, cannot export.' : '相关方登记册无数据，无法导出。' });
      return;
    }

    const headers = isEn ? 
      ['Name', 'Role/Responsibility', 'Power Level', 'Interest Level', 'Engagement Status', 'Participation Strategy'] :
      ['相关方姓名', '项目职责/角色', '权力等级', '利益等级', '当前参与水平', '沟通应对策略'];

    const rows = stakeholders.map(sh => [
      sh.name,
      sh.role,
      sh.power,
      sh.interest,
      sh.engagement,
      sh.strategy
    ]);

    this.downloadCsv('stakeholders.csv', headers, rows);
  }

  exportRisksCsv() {
    const risks = store.state.risks || [];
    const lang = store.state.language || 'en';
    const isEn = lang !== 'zh';

    if (risks.length === 0) {
      store.publish('notify', { type: 'warning', message: isEn ? 'No risk data registered, cannot export.' : '风险登记册无数据，无法导出。' });
      return;
    }

    const headers = isEn ?
      ['Risk Description', 'Category', 'Probability', 'Impact', 'Risk Score', 'Risk Level', 'Response Strategy', 'Owner', 'Status'] :
      ['风险描述', '类型/分类', '发生概率', '影响程度', '风险得分', '风险等级', '应对策略', '责任承担人', '状态'];

    const rows = risks.map(r => {
      const calc = PmpCalculators.calculateRisk(r.probability, r.impact);
      return [
        r.description,
        r.category,
        r.probability,
        r.impact,
        calc.score,
        calc.rating,
        r.strategy,
        r.owner,
        r.status
      ];
    });

    this.downloadCsv('risks.csv', headers, rows);
  }

  downloadCsv(filename, headers, rows) {
    const csvContent = '\uFEFF' + 
      [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    store.publish('notify', { type: 'success', message: `Report ${filename} downloaded successfully.` });
  }

  generatePrintReport() {
    const state = store.state;
    const project = state.projectInfo;
    const evm = PmpCalculators.calculateEVM(state.costs, project.budget);
    const lang = state.language || 'en';
    const isEn = lang !== 'zh';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      store.publish('notify', { type: 'error', message: isEn ? 'Failed to open window. Please allow popups.' : '无法打开新窗口，请允许本站弹出窗口。' });
      return;
    }

    const getDocHtml = (key, title) => {
      const text = state.documents[key] || '';
      if (!text.trim()) return `<div class="doc-empty">(${isEn ? 'Deliverable document empty' : `未录入《${title}》文档`})</div>`;
      
      return text
        .replace(/# (.*)/g, '<h2>$1</h2>')
        .replace(/## (.*)/g, '<h3>$1</h3>')
        .replace(/\* (.*)/g, '<li>$1</li>')
        .replace(/\n\n/g, '<p></p>')
        .replace(/\n/g, '<br>');
    };

    const cpiText = evm.CPI >= 1.0 ? 
      (isEn ? 'On Target (CPI >= 1.0)' : '正常 (CPI >= 1.0)') : 
      (isEn ? 'Over Budget (CPI < 1.0)' : '预算超支 (CPI < 1.0)');
      
    const spiText = evm.SPI >= 1.0 ? 
      (isEn ? 'On Schedule (SPI >= 1.0)' : '正常 (SPI >= 1.0)') : 
      (isEn ? 'Behind Schedule (SPI < 1.0)' : '进度滞后 (SPI < 1.0)');

    // Text translations variables
    const textReportTitle = isEn ? 'PMP Executive Project Performance Report' : 'PMP 项目执行情况与绩效分析报告';
    const textPrintTip = isEn ? '💡 This is a report preview page. Click the button to export as PDF or print.' : '💡 这是项目报告预览页。点击右侧按钮可在您的操作系统中导出为 PDF 或进行纸面打印。';
    const textBtnPrint = isEn ? '🖨️ Print / Save to PDF' : '🖨️ 打印 / 存为 PDF';
    const textMainHeader = isEn ? 'PMP Project Control & Performance Analysis Report' : 'PMP 项目执行情况与绩效分析报告';
    const textProjectDetails = isEn ? 'I. Project Overview' : '一、项目基本概要 (Project Overview)';
    const textStartDate = isEn ? 'Start Date' : '项目开始日期';
    const textEndDate = isEn ? 'End Date' : '计划完工日期';
    const textStatus = isEn ? 'Execution Status' : '整体执行状态';
    const textBudget = isEn ? 'Approved Budget (BAC)' : '批准总预算 (BAC)';
    const textDescLabel = isEn ? 'Business Case & Description' : '商业目标及项目简介';

    const textEvmTitle = isEn ? 'II. Earned Value Management (EVM) Metrics' : '二、挣值绩效评估 (Earned Value Management)';
    const textEvmDesc = isEn ? 
      'Objectively monitors project financial health and schedule timelines against baseline targets.' :
      '通过对比计划的价值、实际成本以及完成任务挣得的价值，客观反映项目的预算健康度与进度健康度。';
      
    const textEvmHeaders = isEn ? 
      ['Metric', 'Value', 'Baseline Assessment', 'EVM Explanation'] :
      ['绩效指标', '数值', '控制基准评估', '预测分析说明'];

    const textSchTitle = isEn ? 'III. WBS Milestones & Activities Checklist' : '三、进度计划与里程碑清单 (Schedule & Milestones)';
    const textSchHeaders = isEn ?
      ['Activity / Milestone Name', 'Start Date', 'End Date', 'Owner', 'Progress'] :
      ['任务/里程碑名称', '计划开始时间', '计划结束时间', '负责人', '完成进度'];

    const textRiskTitle = isEn ? 'IV. Priority Risk Log & Response Register' : '四、高风险及应对战略登记册 (Priority Risks Log)';
    const textRiskHeaders = isEn ?
      ['Risk Description', 'Prob.', 'Impact', 'Score', 'Level', 'Response Strategy', 'Owner'] :
      ['风险描述', '发生概率', '影响程度', '分值', '等级', '应对策略', '责任人'];

    const textTeamTitle = isEn ? 'V. Project Team Structure List' : '五、项目团队组织架构成员清单 (Project Team Structure)';
    const textTeamHeaders = isEn ?
      ['Name', 'Role / Position', 'Department', 'Reports To'] :
      ['姓名', '角色岗位', '所属部门', '汇报上级'];

    const textActionTitle = isEn ? 'VI. Action Items Tracker Log' : '六、项目待完成事项清单 (Action Items Tracker)';
    const textActionHeaders = isEn ?
      ['Content Description', 'Triggered', 'Owner', 'Target Date', 'Delay', 'Priority', 'Status'] :
      ['待完成事项内容', '触发日期', '负责人', '期望完成日期', '延迟天数', '优先级', '当前状态'];

    const textDocTitle = isEn ? 'VII. PMP Project Core Deliverables Documents' : '七、PMP 核心过程输出文档 (Process Documents)';
    const textCharterTitle = isEn ? '1. Project Charter (Integration - Initiating)' : '1. 项目章程 (Integration - Initiating)';
    const textScopeTitle = isEn ? '2. Project Scope Statement (Scope - Planning)' : '2. 项目范围说明书 (Scope - Planning)';
    const textQualityTitle = isEn ? '3. Project Quality Management Plan (Quality - Planning)' : '3. 项目质量管理计划 (Quality - Planning)';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${textReportTitle} - ${project.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 40px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 26px;
            color: #111;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .section h2 {
            border-left: 4px solid #ED0007;
            padding-left: 10px;
            font-size: 18px;
            color: #111;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 4px;
            background: #eee;
          }
          .badge-alert { background: #fce8e6; color: #c5221f; }
          .badge-ok { background: #e6f4ea; color: #137333; }
          
          .doc-panel {
            background: #fafafa;
            border: 1px solid #eee;
            padding: 20px;
            border-radius: 6px;
            font-size: 13px;
          }
          .doc-empty {
            color: #999;
            font-style: italic;
            text-align: center;
            padding: 20px;
          }
          
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #f1f3f4; padding: 12px; border-radius:6px; margin-bottom:30px; display:flex; justify-content:space-between; align-items:center; font-family: sans-serif;">
          <span style="font-size:13px; color:#5f6368;">${textPrintTip}</span>
          <button onclick="window.print()" style="background:#ED0007; color:white; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">
            ${textBtnPrint}
          </button>
        </div>

        <div class="header">
          <h1>${textMainHeader}</h1>
          <p>${isEn ? 'Project' : '项目'}: ${project.name} | PM: ${project.manager} | Sponsor: ${project.sponsor}</p>
          <p>${isEn ? 'Generated' : '生成时间'}: ${new Date().toLocaleString()}</p>
        </div>

        <!-- 1. Basic Info Section -->
        <div class="section">
          <h2>${textProjectDetails}</h2>
          <table style="margin-bottom: 15px;">
            <tr>
              <th style="width: 20%;">${textStartDate}</th>
              <td style="width: 30%;">${project.startDate}</td>
              <th style="width: 20%;">${textEndDate}</th>
              <td style="width: 30%;">${project.endDate}</td>
            </tr>
            <tr>
              <th>${textStatus}</th>
              <td><span class="badge badge-ok">${project.status}</span></td>
              <th>${textBudget}</th>
              <td>¥${Number(project.budget || 0).toLocaleString()}</td>
            </tr>
          </table>
          <p style="font-size:13px;"><strong>${textDescLabel}:</strong><br>${project.description}</p>
        </div>

        <!-- 2. EVM Section -->
        <div class="section">
          <h2>${textEvmTitle}</h2>
          <p style="font-size:13px; margin-bottom: 10px;">${textEvmDesc}</p>
          <table>
            <thead>
              <tr>
                <th>${textEvmHeaders[0]}</th>
                <th>${textEvmHeaders[1]}</th>
                <th>${textEvmHeaders[2]}</th>
                <th>${textEvmHeaders[3]}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${t('cost_kpi_pv')}</strong></td>
                <td>¥${evm.PV.toLocaleString()}</td>
                <td>${isEn ? 'Planned baseline budget allocated to WBS' : '计划内分配至各工作包的财务额度'}</td>
                <td>--</td>
              </tr>
              <tr>
                <td><strong>${t('cost_kpi_ev')}</strong></td>
                <td>¥${evm.EV.toLocaleString()}</td>
                <td>${isEn ? 'Earned credit value of completed tasks' : '已完成工作折算出的预算额度'}</td>
                <td>${isEn ? 'Physical completion check' : '当前活动物理完成进度之和'}</td>
              </tr>
              <tr>
                <td><strong>${t('cost_kpi_ac')}</strong></td>
                <td>¥${evm.AC.toLocaleString()}</td>
                <td>${isEn ? 'Actual total expenditure incurred' : '已发生工作的实际财务流出'}</td>
                <td>--</td>
              </tr>
              <tr>
                <td><strong>${t('cost_kpi_cv')}</strong></td>
                <td style="color: ${evm.CV >= 0 ? 'green' : 'red'}; font-weight:bold;">¥${evm.CV.toLocaleString()}</td>
                <td>
                  <span class="badge ${evm.CV >= 0 ? 'badge-ok' : 'badge-alert'}">
                    ${evm.CV >= 0 ? (isEn ? 'Under Budget' : '成本节约') : (isEn ? 'Over Budget' : '超支警告')}
                  </span>
                </td>
                <td>${isEn ? 'Positive is cost savings; negative is deficit' : '正数代表成本低于预算，负数代表超支'}</td>
              </tr>
              <tr>
                <td><strong>${t('cost_kpi_sv')}</strong></td>
                <td style="color: ${evm.SV >= 0 ? 'green' : 'red'}; font-weight:bold;">¥${evm.SV.toLocaleString()}</td>
                <td>
                  <span class="badge ${evm.SV >= 0 ? 'badge-ok' : 'badge-alert'}">
                    ${evm.SV >= 0 ? (isEn ? 'Ahead' : 'On Schedule') : (isEn ? 'Behind Schedule' : '进度滞后')}
                  </span>
                </td>
                <td>${isEn ? 'Positive is schedule lead; negative is lag' : '正数代表领先于原计划进度，负数代表落后'}</td>
              </tr>
              <tr>
                <td><strong>${t('kpi_cpi')}</strong></td>
                <td style="font-weight:bold;">${evm.CPI.toFixed(2)}</td>
                <td>${cpiText}</td>
                <td>${isEn ? `Creating $${evm.CPI.toFixed(2)} for every $1.00 spent` : `1元实际发销创造了 ${evm.CPI.toFixed(2)} 元等值可交付物`}</td>
              </tr>
              <tr>
                <td><strong>${t('kpi_spi')}</strong></td>
                <td style="font-weight:bold;">${evm.SPI.toFixed(2)}</td>
                <td>${spiText}</td>
                <td>${isEn ? `Working at ${Math.round(evm.SPI * 100)}% efficiency` : `工作推进效率为计划的 ${Math.round(evm.SPI * 100)}%`}</td>
              </tr>
              <tr>
                <td><strong>${t('cost_kpi_eac')}</strong></td>
                <td style="font-weight:bold;">¥${Math.round(evm.EAC).toLocaleString()}</td>
                <td>${isEn ? 'Estimate at completion based on current performance' : '估算剩余工作保持当前绩效'}</td>
                <td>EAC. VAC: ¥${Math.round(evm.VAC).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="page-break"></div>

        <!-- 3. Gantt Milestones -->
        <div class="section">
          <h2>${textSchTitle}</h2>
          <table>
            <thead>
              <tr>
                <th>${textSchHeaders[0]}</th>
                <th>${textSchHeaders[1]}</th>
                <th>${textSchHeaders[2]}</th>
                <th>${textSchHeaders[3]}</th>
                <th>${textSchHeaders[4]}</th>
              </tr>
            </thead>
            <tbody>
              ${state.schedule.map(tTask => `
                <tr>
                  <td><strong>${tTask.name}</strong></td>
                  <td>${tTask.startDate}</td>
                  <td>${tTask.endDate}</td>
                  <td>${tTask.owner || '-'}</td>
                  <td>${tTask.progress}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 4. Risk Register -->
        <div class="section">
          <h2>${textRiskTitle}</h2>
          <table>
            <thead>
              <tr>
                <th>${textRiskHeaders[0]}</th>
                <th>${textRiskHeaders[1]}</th>
                <th>${textRiskHeaders[2]}</th>
                <th>${textRiskHeaders[3]}</th>
                <th>${textRiskHeaders[4]}</th>
                <th>${textRiskHeaders[5]}</th>
                <th>${textRiskHeaders[6]}</th>
              </tr>
            </thead>
            <tbody>
              ${state.risks.map(r => {
                const calc = PmpCalculators.calculateRisk(r.probability, r.impact);
                const categoryText = t('risk_cat_' + r.category.toLowerCase().replace(' ', '')) || r.category;
                const strategyText = t('risk_strat_' + r.strategy.toLowerCase()) || r.strategy;
                return `
                  <tr>
                    <td>${r.description}</td>
                    <td>${r.probability}/5</td>
                    <td>${r.impact}/5</td>
                    <td style="font-weight:bold;">${calc.score}</td>
                    <td>
                      <span class="badge ${calc.rating === 'High' ? 'badge-alert' : ''}">
                        ${calc.rating === 'High' ? t('risk_level_high') : calc.rating === 'Medium' ? t('risk_level_med') : t('risk_level_low')}
                      </span>
                    </td>
                    <td>${strategyText}</td>
                    <td>${r.owner}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 5. Team Structure List -->
        <div class="section">
          <h2>${textTeamTitle}</h2>
          <table>
            <thead>
              <tr>
                <th>${textTeamHeaders[0]}</th>
                <th>${textTeamHeaders[1]}</th>
                <th>${textTeamHeaders[2]}</th>
                <th>${textTeamHeaders[3]}</th>
              </tr>
            </thead>
            <tbody>
              ${(state.team || []).map(m => {
                const parent = m.reportsTo ? (state.team || []).find(p => p.id === m.reportsTo) : null;
                const parentName = parent ? parent.name : t('team_reports_none');
                return `
                  <tr>
                    <td><strong>${m.name}</strong></td>
                    <td>${m.role}</td>
                    <td>${m.department}</td>
                    <td>${parentName}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 6. Action Items Tracker -->
        <div class="section">
          <h2>${textActionTitle}</h2>
          <table>
            <thead>
              <tr>
                <th>${textActionHeaders[0]}</th>
                <th>${textActionHeaders[1]}</th>
                <th>${textActionHeaders[2]}</th>
                <th>${textActionHeaders[3]}</th>
                <th>${textActionHeaders[4]}</th>
                <th>${textActionHeaders[5]}</th>
                <th>${textActionHeaders[6]}</th>
              </tr>
            </thead>
            <tbody>
              ${(state.actionItems || []).map(item => {
                const statusLabel = item.status === 'Completed' ? t('act_status_completed') : t('act_status_pending');
                let priorityLabel = t('act_priority_low');
                if (item.priority === 'High') priorityLabel = t('act_priority_high');
                else if (item.priority === 'Medium') priorityLabel = t('act_priority_med');
                return `
                  <tr>
                    <td>${item.content}</td>
                    <td>${item.triggerDate}</td>
                    <td>${item.owner}</td>
                    <td>${item.targetDate}</td>
                    <td>${item.delayDays}${t('act_delay_unit')}</td>
                    <td>${priorityLabel}</td>
                    <td>${statusLabel}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="page-break"></div>

        <!-- 7. Narrative Charters -->
        <div class="section">
          <h2>${textDocTitle}</h2>
          
          <h3 style="margin-top:20px; border-bottom: 1px dashed #ccc; padding-bottom:5px;">${textCharterTitle}</h3>
          <div class="doc-panel">${getDocHtml('developProjectCharter', 'Project Charter')}</div>
          
          <h3 style="margin-top:20px; border-bottom: 1px dashed #ccc; padding-bottom:5px;">${textScopeTitle}</h3>
          <div class="doc-panel">${getDocHtml('defineScope', 'Project Scope Statement')}</div>
          
          <h3 style="margin-top:20px; border-bottom: 1px dashed #ccc; padding-bottom:5px;">${textQualityTitle}</h3>
          <div class="doc-panel">${getDocHtml('planQualityManagement', 'Quality Management Plan')}</div>
        </div>

        <div class="no-print" style="margin-top: 50px; text-align: center; border-top:1px solid #eee; padding-top:20px; font-family: sans-serif;">
          <button onclick="window.print()" style="background:#ED0007; color:white; border:none; padding:10px 24px; border-radius:4px; font-weight:bold; font-size:14px; cursor:pointer;">
            ${textBtnPrint}
          </button>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }
}
