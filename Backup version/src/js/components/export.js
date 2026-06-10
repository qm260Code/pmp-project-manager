import { store } from '../store.js';
import { PmpCalculators } from '../utils/pmpCalculators.js';

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
    
    store.publish('notify', { type: 'success', message: '项目 JSON 备份已下载。' });
  }

  importProjectJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const success = store.importData(content);
      
      // Clear file input value to allow importing same file again
      this.fileImportJson.value = '';
    };
    reader.onerror = () => {
      store.publish('notify', { type: 'error', message: '读取 JSON 文件失败。' });
    };
    reader.readAsText(file);
  }

  exportStakeholdersCsv() {
    const stakeholders = store.state.stakeholders || [];
    if (stakeholders.length === 0) {
      store.publish('notify', { type: 'warning', message: '相关方登记册无数据，无法导出。' });
      return;
    }

    const headers = ['相关方姓名', '项目职责/角色', '权力等级', '利益等级', '当前参与水平', '沟通应对策略'];
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
    if (risks.length === 0) {
      store.publish('notify', { type: 'warning', message: '风险登记册无数据，无法导出。' });
      return;
    }

    const headers = ['风险描述', '类型/分类', '发生概率', '影响程度', '风险得分', '风险等级', '应对策略', '责任承担人', '状态'];
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
    // Formats array to standard CSV string with Excel compatible BOM header
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
    
    store.publish('notify', { type: 'success', message: `${filename} 报表已下载。` });
  }

  generatePrintReport() {
    const state = store.state;
    const project = state.projectInfo;
    const evm = PmpCalculators.calculateEVM(state.costs, project.budget);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      store.publish('notify', { type: 'error', message: '无法打开新窗口，请允许本站弹出窗口。' });
      return;
    }

    // Convert document markdown-like contents to basic HTML
    const getDocHtml = (key, title) => {
      const text = state.documents[key] || '';
      if (!text.trim()) return `<div class="doc-empty">（未录入《${title}》文档）</div>`;
      
      // Basic markdown headers/bullets regex converters
      return text
        .replace(/# (.*)/g, '<h2>$1</h2>')
        .replace(/## (.*)/g, '<h3>$1</h3>')
        .replace(/\* (.*)/g, '<li>$1</li>')
        .replace(/\n\n/g, '<p></p>')
        .replace(/\n/g, '<br>');
    };

    const cpiText = evm.CPI >= 1.0 ? '正常 (CPI >= 1.0)' : '预算超支 (CPI < 1.0)';
    const spiText = evm.SPI >= 1.0 ? '正常 (SPI >= 1.0)' : '进度滞后 (SPI < 1.0)';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PMP 项目执行与管理分析报告 - ${project.name}</title>
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
            border-left: 4px solid #1a73e8;
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
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
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
          
          /* Document formatting styling */
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
          
          /* Print configuration overrides */
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #f1f3f4; padding: 12px; border-radius:6px; margin-bottom:30px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; color:#5f6368;">💡 这是项目报告预览页。点击右侧按钮可在您的操作系统中导出为 PDF 或进行纸面打印。</span>
          <button onclick="window.print()" style="background:#1a73e8; color:white; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">
            🖨️ 打印 / 存为 PDF
          </button>
        </div>

        <div class="header">
          <h1>PMP 项目执行情况与绩效分析报告</h1>
          <p>项目名称: ${project.name} | 项目经理: ${project.manager} | 发起人: ${project.sponsor}</p>
          <p>报告生成时间: ${new Date().toLocaleString()}</p>
        </div>

        <!-- 1. Basic Info Section -->
        <div class="section">
          <h2>一、项目基本概要 (Project Overview)</h2>
          <table style="margin-bottom: 15px;">
            <tr>
              <th style="width: 20%;">项目开始日期</th>
              <td style="width: 30%;">${project.startDate}</td>
              <th style="width: 20%;">计划完工日期</th>
              <td style="width: 30%;">${project.endDate}</td>
            </tr>
            <tr>
              <th>整体执行状态</th>
              <td><span class="badge badge-ok">${project.status}</span></td>
              <th>批准总预算 (BAC)</th>
              <td>¥${Number(project.budget || 0).toLocaleString()}元</td>
            </tr>
          </table>
          <p style="font-size:13px;"><strong>商业目标及项目简介:</strong><br>${project.description}</p>
        </div>

        <!-- 2. EVM Section -->
        <div class="section">
          <h2>二、挣值绩效评估 (Earned Value Management)</h2>
          <p style="font-size:13px; margin-bottom: 10px;">通过对比计划的价值、实际成本以及完成任务挣得的价值，客观反映项目的预算健康度与进度健康度。</p>
          <table>
            <thead>
              <tr>
                <th>绩效指标</th>
                <th>数值</th>
                <th>控制基准评估</th>
                <th>预测分析说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>计划价值 (PV)</strong></td>
                <td>¥${evm.PV.toLocaleString()}</td>
                <td>计划内分配至各工作包的财务额度</td>
                <td>--</td>
              </tr>
              <tr>
                <td><strong>挣值 (EV)</strong></td>
                <td>¥${evm.EV.toLocaleString()}</td>
                <td>已完成工作折算出的预算额度</td>
                <td>当前活动物理完成进度之和</td>
              </tr>
              <tr>
                <td><strong>实际成本 (AC)</strong></td>
                <td>¥${evm.AC.toLocaleString()}</td>
                <td>已发生工作的实际财务流出</td>
                <td>--</td>
              </tr>
              <tr>
                <td><strong>成本偏差 (CV)</strong></td>
                <td style="color: ${evm.CV >= 0 ? 'green' : 'red'}; font-weight:bold;">¥${evm.CV.toLocaleString()}</td>
                <td>
                  <span class="badge ${evm.CV >= 0 ? 'badge-ok' : 'badge-alert'}">
                    ${evm.CV >= 0 ? '成本节约' : '超支警告'}
                  </span>
                </td>
                <td>正数代表成本低于预算，负数代表超支</td>
              </tr>
              <tr>
                <td><strong>进度偏差 (SV)</strong></td>
                <td style="color: ${evm.SV >= 0 ? 'green' : 'red'}; font-weight:bold;">¥${evm.SV.toLocaleString()}</td>
                <td>
                  <span class="badge ${evm.SV >= 0 ? 'badge-ok' : 'badge-alert'}">
                    ${evm.SV >= 0 ? '进度领先' : '进度滞后'}
                  </span>
                </td>
                <td>正数代表领先于原计划进度，负数代表落后</td>
              </tr>
              <tr>
                <td><strong>成本绩效指数 (CPI)</strong></td>
                <td style="font-weight:bold;">${evm.CPI.toFixed(2)}</td>
                <td>指标评估：${cpiText}</td>
                <td>1元实际发销创造了 ${evm.CPI.toFixed(2)} 元等值可交付物</td>
              </tr>
              <tr>
                <td><strong>进度绩效指数 (SPI)</strong></td>
                <td style="font-weight:bold;">${evm.SPI.toFixed(2)}</td>
                <td>指标评估：${spiText}</td>
                <td>工作推进效率为计划的 ${Math.round(evm.SPI * 100)}%</td>
              </tr>
              <tr>
                <td><strong>完工估算 (EAC)</strong></td>
                <td style="font-weight:bold;">¥${Math.round(evm.EAC).toLocaleString()}</td>
                <td>估算剩余工作保持当前绩效</td>
                <td>完工时预计总花费。偏差(VAC): ¥${Math.round(evm.VAC).toLocaleString()}元</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="page-break"></div>

        <!-- 3. Gantt Milestones -->
        <div class="section">
          <h2>三、进度计划与里程碑清单 (Schedule & Milestones)</h2>
          <table>
            <thead>
              <tr>
                <th>任务/里程碑名称</th>
                <th>计划开始时间</th>
                <th>计划结束时间</th>
                <th>负责人</th>
                <th>完成进度</th>
              </tr>
            </thead>
            <tbody>
              ${state.schedule.map(t => `
                <tr>
                  <td><strong>${t.name}</strong></td>
                  <td>${t.startDate}</td>
                  <td>${t.endDate}</td>
                  <td>${t.owner || '-'}</td>
                  <td>${t.progress}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 4. Risk Register -->
        <div class="section">
          <h2>四、高风险及应对战略登记册 (Priority Risks Log)</h2>
          <table>
            <thead>
              <tr>
                <th>风险描述</th>
                <th>发生概率</th>
                <th>影响程度</th>
                <th>分值</th>
                <th>等级</th>
                <th>应对策略</th>
                <th>责任人</th>
              </tr>
            </thead>
            <tbody>
              ${state.risks.map(r => {
                const calc = PmpCalculators.calculateRisk(r.probability, r.impact);
                return `
                  <tr>
                    <td>${r.description}</td>
                    <td>${r.probability}/5</td>
                    <td>${r.impact}/5</td>
                    <td style="font-weight:bold;">${calc.score}</td>
                    <td>
                      <span class="badge ${calc.rating === 'High' ? 'badge-alert' : ''}">
                        ${calc.rating}
                      </span>
                    </td>
                    <td>${r.strategy}</td>
                    <td>${r.owner}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 5. Team Structure List -->
        <div class="section">
          <h2>五、项目团队组织架构成员清单 (Project Team Structure)</h2>
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>角色岗位</th>
                <th>所属部门</th>
                <th>汇报上级</th>
              </tr>
            </thead>
            <tbody>
              ${(state.team || []).map(m => {
                const parent = m.reportsTo ? (state.team || []).find(p => p.id === m.reportsTo) : null;
                const parentName = parent ? parent.name : '无 (直接汇报)';
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
          <h2>六、项目待完成事项清单 (Action Items Tracker)</h2>
          <table>
            <thead>
              <tr>
                <th>待完成事项内容</th>
                <th>触发日期</th>
                <th>负责人</th>
                <th>期望完成日期</th>
                <th>延迟天数</th>
                <th>优先级</th>
                <th>当前状态</th>
              </tr>
            </thead>
            <tbody>
              ${(state.actionItems || []).map(item => {
                const statusLabel = item.status === 'Completed' ? '已完成' : '待处理';
                let priorityLabel = '低 (Low)';
                if (item.priority === 'High') priorityLabel = '高 (High)';
                else if (item.priority === 'Medium') priorityLabel = '中 (Medium)';
                return `
                  <tr>
                    <td>${item.content}</td>
                    <td>${item.triggerDate}</td>
                    <td>${item.owner}</td>
                    <td>${item.targetDate}</td>
                    <td>${item.delayDays} 天</td>
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
          <h2>七、PMP 核心过程输出文档 (Process Documents)</h2>
          
          <h3 style="margin-top:20px; border-bottom: 1px dashed #ccc; padding-bottom:5px;">1. 项目章程 (Integration - Initiating)</h3>
          <div class="doc-panel">${getDocHtml('developProjectCharter', '项目章程')}</div>
          
          <h3 style="margin-top:20px; border-bottom: 1px dashed #ccc; padding-bottom:5px;">2. 项目范围说明书 (Scope - Planning)</h3>
          <div class="doc-panel">${getDocHtml('defineScope', '范围说明书')}</div>
          
          <h3 style="margin-top:20px; border-bottom: 1px dashed #ccc; padding-bottom:5px;">3. 项目质量管理计划 (Quality - Planning)</h3>
          <div class="doc-panel">${getDocHtml('planQualityManagement', '质量管理计划')}</div>
        </div>

        <div class="no-print" style="margin-top: 50px; text-align: center; border-top:1px solid #eee; padding-top:20px;">
          <button onclick="window.print()" style="background:#1a73e8; color:white; border:none; padding:10px 24px; border-radius:4px; font-weight:bold; font-size:14px; cursor:pointer;">
            🖨️ 确认无误，打印/保存为 PDF
          </button>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }
}
