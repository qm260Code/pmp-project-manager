import { store } from '../store.js';
import { PmpCalculators } from '../utils/pmpCalculators.js';

export class DashboardComponent {
  constructor(container) {
    this.container = container;
    this.kpiContainer = document.getElementById('dashboard-kpi-container');
    this.timelineContent = document.getElementById('dashboard-timeline-content');
    this.risksContent = document.getElementById('dashboard-risks-content');
    
    this.render();
    
    // Subscribe to store updates to trigger re-renders
    store.subscribe('state-updated', () => {
      this.render();
    });
  }

  render() {
    const state = store.state;
    this.renderKPIs(state);
    this.renderMilestones(state);
    this.renderCriticalRisks(state);
  }

  renderKPIs(state) {
    const evm = PmpCalculators.calculateEVM(state.costs, state.projectInfo.budget);
    const risks = state.risks || [];
    const schedule = state.schedule || [];
    
    // Compute High Risks
    const highRisksCount = risks.filter(r => PmpCalculators.calculateRisk(r.probability, r.impact).score >= 12).length;
    
    // Compute Schedule average progress
    let avgProgress = 0;
    if (schedule.length > 0) {
      const total = schedule.reduce((sum, item) => sum + Number(item.progress || 0), 0);
      avgProgress = Math.round(total / schedule.length);
    }
    
    // EVM status descriptions
    const cpiStr = evm.CPI.toFixed(2);
    const spiStr = evm.SPI.toFixed(2);
    let cpiDesc = '预算匹配';
    let cpiClass = 'status-success';
    if (evm.CPI < 0.9) { cpiDesc = '超出预算'; cpiClass = 'status-danger'; }
    else if (evm.CPI > 1.1) { cpiDesc = '节省预算'; cpiClass = 'status-success'; }

    let spiDesc = '进度正常';
    let spiClass = 'status-success';
    if (evm.SPI < 0.9) { spiDesc = '进度滞后'; spiClass = 'status-danger'; }
    else if (evm.SPI > 1.1) { spiDesc = '进度提前'; spiClass = 'status-success'; }

    this.kpiContainer.innerHTML = `
      <!-- Card 1: Project Budget -->
      <div class="glass-panel kpi-card" style="border-left: 4px solid var(--accent-primary);">
        <span class="kpi-title">项目预算与花费</span>
        <span class="kpi-value">¥${(evm.BAC / 1000).toFixed(0)}k</span>
        <div class="kpi-desc">
          <span>实际已花费: <strong>¥${(evm.AC / 1000).toFixed(0)}k</strong></span>
        </div>
      </div>
      
      <!-- Card 2: CPI Indicator -->
      <div class="glass-panel kpi-card" style="border-left: 4px solid ${evm.CPI < 0.9 ? 'var(--status-danger)' : 'var(--status-success)'};">
        <span class="kpi-title">成本绩效指数 (CPI)</span>
        <span class="kpi-value ${evm.CPI < 0.9 ? 'text-danger' : ''}">${cpiStr}</span>
        <div class="kpi-desc">
          <span style="color: var(--${cpiClass === 'status-danger' ? 'status-danger' : 'status-success'});">● ${cpiDesc}</span>
        </div>
      </div>

      <!-- Card 3: SPI Indicator -->
      <div class="glass-panel kpi-card" style="border-left: 4px solid ${evm.SPI < 0.9 ? 'var(--status-danger)' : 'var(--status-success)'};">
        <span class="kpi-title">进度绩效指数 (SPI)</span>
        <span class="kpi-value ${evm.SPI < 0.9 ? 'text-danger' : ''}">${spiStr}</span>
        <div class="kpi-desc">
          <span style="color: var(--${spiClass === 'status-danger' ? 'status-danger' : 'status-success'});">● ${spiDesc}</span>
        </div>
      </div>

      <!-- Card 4: Risks summary -->
      <div class="glass-panel kpi-card" style="border-left: 4px solid ${highRisksCount > 0 ? 'var(--status-warning)' : 'var(--border-color)'};">
        <span class="kpi-title">风险状态 (Risks)</span>
        <span class="kpi-value">${risks.length} <span style="font-size:16px; font-weight:400; color:var(--text-muted);">总数</span></span>
        <div class="kpi-desc">
          <span style="${highRisksCount > 0 ? 'color: var(--status-danger); font-weight:600;' : ''}">
            ⚠️ 严重风险：${highRisksCount} 个
          </span>
        </div>
      </div>

      <!-- Card 5: Schedule Progress -->
      <div class="glass-panel kpi-card" style="border-left: 4px solid var(--accent-secondary);">
        <span class="kpi-title">项目总体进度</span>
        <span class="kpi-value">${avgProgress}%</span>
        <div class="kpi-desc">
          <span>共 <strong>${schedule.length}</strong> 个任务节点</span>
        </div>
      </div>
    `;
  }

  renderMilestones(state) {
    const schedule = state.schedule || [];
    if (schedule.length === 0) {
      this.timelineContent.innerHTML = `<p style="color: var(--text-muted); font-size:13px;">暂无进度数据，请前往进度视图添加。</p>`;
      return;
    }

    // Sort by start date
    const sorted = [...schedule].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    let html = `<ul style="list-style:none; padding:5px 0;">`;
    sorted.forEach(task => {
      const isMilestone = task.name.includes('里程碑') || task.name.includes('Milestone');
      html += `
        <li style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding: 10px; background:var(--bg-secondary); border-radius:6px; border-left: 3px solid ${isMilestone ? 'var(--status-warning)' : 'var(--accent-primary)'};">
          <div style="flex:1; padding-right:15px;">
            <div style="font-size:13px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
              ${task.name} 
              ${isMilestone ? '<span style="font-size:10px; background:rgba(251,192,45,0.15); color:var(--status-warning); padding:1px 5px; border-radius:3px;">里程碑</span>' : ''}
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
              起止: ${task.startDate} 至 ${task.endDate} | 负责人: ${task.owner || '未分配'}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px; font-weight:700; color:var(--accent-secondary);">${task.progress}%</div>
            <div style="width:70px; background:var(--border-color); height:4px; border-radius:2px; overflow:hidden; margin-top:4px;">
              <div style="width:${task.progress}%; background:var(--accent-secondary); height:100%;"></div>
            </div>
          </div>
        </li>
      `;
    });
    html += `</ul>`;
    
    this.timelineContent.innerHTML = html;
  }

  renderCriticalRisks(state) {
    const risks = state.risks || [];
    if (risks.length === 0) {
      this.risksContent.innerHTML = `<p style="color: var(--text-muted); font-size:13px;">当前项目无任何已知风险登记。</p>`;
      return;
    }

    // Compute scores and sort descending
    const risksWithScores = risks.map(r => {
      const calc = PmpCalculators.calculateRisk(r.probability, r.impact);
      return { ...r, ...calc };
    }).sort((a, b) => b.score - a.score);

    // Filter top 3 highest scores
    const topRisks = risksWithScores.slice(0, 3);
    
    let html = `<ul style="list-style:none; padding:5px 0;">`;
    topRisks.forEach(risk => {
      let scoreBadgeColor = 'var(--status-success)';
      if (risk.score >= 12) scoreBadgeColor = 'var(--status-danger)';
      else if (risk.score >= 5) scoreBadgeColor = 'var(--status-warning)';

      html += `
        <li style="margin-bottom:12px; padding: 10px; background:var(--bg-secondary); border-radius:6px; border:1px solid var(--border-color);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <span style="font-size:13px; font-weight:600; color:var(--text-primary); line-height:1.4;">${risk.description}</span>
            <span class="badge" style="background:${scoreBadgeColor}20; color:${scoreBadgeColor}; border:1px solid ${scoreBadgeColor}50; flex-shrink:0;">
              得 ${risk.score} 分
            </span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-muted); border-top:1px dashed var(--border-color); padding-top:6px; margin-top:6px;">
            <span>类别: ${risk.category} | 责任人: ${risk.owner}</span>
            <span style="color:var(--text-secondary);">应对: <strong>${risk.strategy}</strong></span>
          </div>
        </li>
      `;
    });
    html += `</ul>`;
    
    this.risksContent.innerHTML = html;
  }
}
