import { store } from '../store.js';
import { PmpCalculators } from '../utils/pmpCalculators.js';
import { t } from '../utils/i18n.js';

export class DashboardCharts {
  constructor() {
    this.charts = {
      gantt: null,
      network: null,
      scurve: null,
      burndown: null,
      cfd: null,
      resource: null,
      control: null,
      riskmatrix: null
    };
    
    // Bind resize event
    window.addEventListener('resize', () => {
      Object.values(this.charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') chart.resize();
      });
    });
  }

  init() {
    const state = store.state;
    // Wait for DOM to be ready
    setTimeout(() => {
      this.renderGantt(state);
      this.renderNetwork(state);
      this.renderSCurve(state);
      this.renderBurndown(state);
      this.renderCFD(state);
      this.renderResource(state);
      this.renderControl(state);
      this.renderRiskMatrix(state);
    }, 100);
  }

  update() {
    this.init();
  }

  dispose() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.dispose === 'function') chart.dispose();
    });
  }

  ensureChartEngine(el, title, rows = []) {
    if (!el) return false;
    if (window.echarts) return true;

    const body = rows.length
      ? rows.map(row => `
          <div class="fallback-row">
            <span>${row.label}</span>
            <strong>${row.value}</strong>
          </div>
        `).join('')
      : `<div class="chart-empty-state">${t('dashboard_no_schedule')}</div>`;

    el.innerHTML = `
      <div class="chart-fallback">
        <div class="chart-fallback-title">${title}</div>
        <div class="chart-fallback-body">${body}</div>
      </div>
    `;
    return false;
  }

  renderGantt(state) {
    const el = document.getElementById('chart-gantt');
    const schedule = state.schedule || [];
    if (!this.ensureChartEngine(el, 'Schedule Summary', schedule.slice(0, 6).map(task => ({
      label: task.name,
      value: `${task.progress || 0}% | ${task.startDate} to ${task.endDate}`
    })))) return;
    if (!this.charts.gantt) this.charts.gantt = window.echarts.init(el);

    if (schedule.length === 0) {
      this.charts.gantt.clear();
      return;
    }

    // Sort by start date
    const sorted = [...schedule].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    const categories = sorted.map(t => t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name);
    
    // We'll map start dates and durations
    const minDate = new Date(sorted[0].startDate).getTime();
    
    const startData = sorted.map(t => new Date(t.startDate).getTime() - minDate);
    const durationData = sorted.map(t => new Date(t.endDate).getTime() - new Date(t.startDate).getTime());
    const progressData = sorted.map(t => t.progress);

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          const idx = params[0].dataIndex;
          const task = sorted[idx];
          return `${task.name}<br/>Start: ${task.startDate}<br/>End: ${task.endDate}<br/>Progress: ${task.progress}%`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: categories, inverse: true },
      series: [
        {
          name: 'Placeholder',
          type: 'bar',
          stack: 'Total',
          itemStyle: { borderColor: 'transparent', color: 'transparent' },
          emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
          data: startData
        },
        {
          name: 'Duration',
          type: 'bar',
          stack: 'Total',
          itemStyle: { color: '#ED0007', borderRadius: [0, 4, 4, 0] },
          data: durationData
        }
      ]
    };
    this.charts.gantt.setOption(option);
  }

  renderNetwork(state) {
    const el = document.getElementById('chart-network');
    const schedule = state.schedule || [];
    const dependencyCount = schedule.filter(t => String(t.dependencies || '').trim()).length;
    if (!this.ensureChartEngine(el, 'Dependency Network', [
      { label: 'Activities', value: schedule.length },
      { label: 'Activities with dependencies', value: dependencyCount },
      { label: 'Milestones', value: schedule.filter(t => String(t.name || '').includes('Milestone')).length }
    ])) return;
    if (!this.charts.network) this.charts.network = window.echarts.init(el);

    // Mock Network Node data focusing on critical path (Total Float == 0)
    const data = [
      { name: 'A', x: 100, y: 150, value: [0, 5, 0, 5], symbolSize: 50, itemStyle: { color: '#ED0007' } }, // Critical
      { name: 'B', x: 300, y: 100, value: [5, 10, 8, 13], symbolSize: 40, itemStyle: { color: '#005691' } }, // Float=3
      { name: 'C', x: 300, y: 200, value: [5, 12, 5, 12], symbolSize: 50, itemStyle: { color: '#ED0007' } }, // Critical
      { name: 'D', x: 500, y: 150, value: [12, 20, 12, 20], symbolSize: 50, itemStyle: { color: '#ED0007' } }  // Critical
    ];

    const links = [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'C' },
      { source: 'B', target: 'D' },
      { source: 'C', target: 'D', lineStyle: { color: '#ED0007', width: 3 } }
    ];

    const option = {
      title: { text: 'Critical Path Method (CPM)', textStyle: { fontSize: 12, color: '#6b7280' } },
      tooltip: {
        formatter: function (params) {
          if (params.dataType === 'node') {
            const v = params.data.value;
            const float = v[2] - v[0]; // LS - ES
            return `Node ${params.data.name}<br/>ES: ${v[0]} | EF: ${v[1]}<br/>LS: ${v[2]} | LF: ${v[3]}<br/>Total Float: ${float}`;
          }
          return '';
        }
      },
      series: [
        {
          type: 'graph',
          layout: 'none',
          symbolSize: 50,
          roam: true,
          label: { show: true },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          data: data,
          links: links,
          lineStyle: { color: '#9ca3af', width: 2 }
        }
      ]
    };
    this.charts.network.setOption(option);
  }

  renderSCurve(state) {
    const el = document.getElementById('chart-scurve');
    const history = state.evmHistory || [];
    const latest = history[history.length - 1] || {};
    if (!this.ensureChartEngine(el, 'EVM S-Curve', [
      { label: 'Latest PV', value: `¥${Number(latest.PV || 0).toLocaleString()}` },
      { label: 'Latest EV', value: `¥${Number(latest.EV || 0).toLocaleString()}` },
      { label: 'Latest AC', value: `¥${Number(latest.AC || 0).toLocaleString()}` }
    ])) return;
    if (!this.charts.scurve) this.charts.scurve = window.echarts.init(el);

    const xAxis = history.map(h => h.timePoint);
    const pv = history.map(h => h.PV);
    const ev = history.map(h => h.EV);
    const ac = history.map(h => h.AC);
    
    // Calculate current SPI / CPI for the tooltip/title
    let titleStr = 'Earned Value Management';
    if (history.length > 0) {
      const last = history[history.length - 1];
      const spi = last.PV ? (last.EV / last.PV).toFixed(2) : 1;
      const cpi = last.AC ? (last.EV / last.AC).toFixed(2) : 1;
      titleStr = `EVM S-Curve | Current SPI: ${spi} | CPI: ${cpi}`;
    }

    const option = {
      title: { text: titleStr, textStyle: { fontSize: 14, color: '#374151' }, top: 0 },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Planned Value (PV)', 'Earned Value (EV)', 'Actual Cost (AC)'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xAxis },
      yAxis: { type: 'value', name: 'Value (RMB)' },
      series: [
        { name: 'Planned Value (PV)', type: 'line', smooth: true, itemStyle: { color: '#005691' }, data: pv },
        { name: 'Earned Value (EV)', type: 'line', smooth: true, itemStyle: { color: '#10b981' }, areaStyle: { opacity: 0.1 }, data: ev },
        { name: 'Actual Cost (AC)', type: 'line', smooth: true, itemStyle: { color: '#ED0007' }, data: ac }
      ]
    };
    this.charts.scurve.setOption(option);
  }

  renderBurndown(state) {
    const el = document.getElementById('chart-burndown');
    const data = state.sprintBurndown || [];
    const latest = data[data.length - 1] || {};
    if (!this.ensureChartEngine(el, 'Sprint Burndown', [
      { label: 'Latest day', value: latest.day || '-' },
      { label: 'Ideal remaining', value: latest.idealRemaining ?? '-' },
      { label: 'Actual remaining', value: latest.actualRemaining ?? '-' }
    ])) return;
    if (!this.charts.burndown) this.charts.burndown = window.echarts.init(el);

    const xAxis = data.map(d => d.day);
    const ideal = data.map(d => d.idealRemaining);
    const actual = data.map(d => d.actualRemaining);

    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Ideal', 'Actual'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xAxis },
      yAxis: { type: 'value', name: 'Story Points' },
      series: [
        { name: 'Ideal', type: 'line', itemStyle: { color: '#9ca3af' }, lineStyle: { type: 'dashed' }, data: ideal },
        { 
          name: 'Actual', 
          type: 'line', 
          itemStyle: { color: '#ED0007' },
          data: actual,
          markArea: {
            itemStyle: { color: 'rgba(237, 0, 7, 0.05)' },
            data: [ [{ xAxis: 'Day 5' }, { xAxis: 'Day 8' }] ] // Mock highlight deviation
          }
        }
      ]
    };
    this.charts.burndown.setOption(option);
  }

  renderCFD(state) {
    const el = document.getElementById('chart-cfd');
    const data = state.cfd || [];
    const latest = data[data.length - 1] || {};
    if (!this.ensureChartEngine(el, 'Cumulative Flow', [
      { label: 'Done', value: latest.done ?? '-' },
      { label: 'Testing', value: latest.testing ?? '-' },
      { label: 'In progress', value: latest.inProgress ?? '-' },
      { label: 'To do', value: latest.todo ?? '-' }
    ])) return;
    if (!this.charts.cfd) this.charts.cfd = window.echarts.init(el);

    const xAxis = data.map(d => d.date);
    const todo = data.map(d => d.todo);
    const inProgress = data.map(d => d.inProgress);
    const testing = data.map(d => d.testing);
    const done = data.map(d => d.done);

    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } } },
      legend: { data: ['Done', 'Testing', 'In Progress', 'To Do'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [ { type: 'category', boundaryGap: false, data: xAxis } ],
      yAxis: [ { type: 'value' } ],
      series: [
        { name: 'Done', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, itemStyle: { color: '#10b981' }, data: done },
        { name: 'Testing', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, itemStyle: { color: '#f59e0b' }, data: testing },
        { name: 'In Progress', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, itemStyle: { color: '#3b82f6' }, data: inProgress },
        { name: 'To Do', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, itemStyle: { color: '#9ca3af' }, data: todo }
      ]
    };
    this.charts.cfd.setOption(option);
  }

  renderResource(state) {
    const el = document.getElementById('chart-resource');
    const data = state.resourceHistogram || [];
    const overloads = data.filter(d => Number(d.allocatedHours || 0) > Number(d.capacityHours || 0)).length;
    if (!this.ensureChartEngine(el, 'Resource Load', [
      { label: 'Periods tracked', value: data.length },
      { label: 'Over capacity periods', value: overloads },
      { label: 'Total allocated hours', value: data.reduce((sum, d) => sum + Number(d.allocatedHours || 0), 0) }
    ])) return;
    if (!this.charts.resource) this.charts.resource = window.echarts.init(el);

    const xAxis = data.map(d => d.period + ' (' + d.role + ')');
    const capacity = data.map(d => d.capacityHours);
    const allocated = data.map(d => d.allocatedHours);

    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Capacity', 'Allocated'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xAxis, axisLabel: { interval: 0, rotate: 15 } },
      yAxis: { type: 'value', name: 'Hours' },
      series: [
        { name: 'Capacity', type: 'bar', itemStyle: { color: '#e5e7eb' }, data: capacity },
        { 
          name: 'Allocated', 
          type: 'bar', 
          barGap: '-100%',
          itemStyle: { 
            color: function(params) {
              return params.data > capacity[params.dataIndex] ? '#ED0007' : '#005691';
            } 
          }, 
          data: allocated 
        }
      ]
    };
    this.charts.resource.setOption(option);
  }

  renderControl(state) {
    const el = document.getElementById('chart-control');
    const data = state.controlChart || [];
    const outOfControl = data.filter(d => Number(d.measurement) > Number(d.UCL) || Number(d.measurement) < Number(d.LCL)).length;
    if (!this.ensureChartEngine(el, 'Quality Control', [
      { label: 'Samples', value: data.length },
      { label: 'Out of control', value: outOfControl },
      { label: 'Mean target', value: data[0]?.mean ?? '-' }
    ])) return;
    if (!this.charts.control) this.charts.control = window.echarts.init(el);

    const xAxis = data.map(d => d.sampleId);
    const measurement = data.map(d => d.measurement);
    const ucl = data[0] ? data[0].UCL : 0;
    const lcl = data[0] ? data[0].LCL : 0;
    const mean = data[0] ? data[0].mean : 0;

    const option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xAxis },
      yAxis: { type: 'value', min: lcl - 1, max: ucl + 1 },
      series: [
        {
          name: 'Measurement',
          type: 'line',
          data: measurement,
          itemStyle: { color: '#005691' },
          markLine: {
            data: [
              { yAxis: ucl, name: 'UCL', lineStyle: { color: '#ED0007' } },
              { yAxis: lcl, name: 'LCL', lineStyle: { color: '#ED0007' } },
              { yAxis: mean, name: 'Mean', lineStyle: { color: '#10b981' } }
            ]
          }
        }
      ]
    };
    this.charts.control.setOption(option);
  }

  renderRiskMatrix(state) {
    const el = document.getElementById('chart-riskmatrix');
    const risks = state.risks || [];
    const severe = risks.filter(r => Number(r.probability || 0) * Number(r.impact || 0) >= 12).length;
    if (!this.ensureChartEngine(el, 'Risk Matrix', [
      { label: 'Registered risks', value: risks.length },
      { label: 'High severity risks', value: severe },
      { label: 'Active risks', value: risks.filter(r => r.status === 'Active').length }
    ])) return;
    if (!this.charts.riskmatrix) this.charts.riskmatrix = window.echarts.init(el);

    // Data schema: [Probability (0-5), Impact (0-5), description]
    const activeRisks = risks.map(r => [r.probability, r.impact, r.description, r.owner]);

    const option = {
      tooltip: {
        formatter: function (params) {
          const d = params.data;
          return `<strong>Risk:</strong> ${d[2]}<br/><strong>Owner:</strong> ${d[3]}<br/>Prob: ${d[0]} | Impact: ${d[1]}<br/>Score: ${d[0]*d[1]}`;
        }
      },
      grid: { left: '5%', right: '5%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'value', name: 'Impact (1-5)', min: 0, max: 5, splitLine: { show: false } },
      yAxis: { type: 'value', name: 'Probability (1-5)', min: 0, max: 5, splitLine: { show: false } },
      visualMap: {
        show: false,
        dimension: 0,
        pieces: [
          { min: 0, max: 2, color: '#10b981' }, // Green
          { min: 2, max: 3.5, color: '#f59e0b' }, // Yellow
          { min: 3.5, max: 5, color: '#ED0007' }  // Red
        ]
      },
      series: [
        {
          name: 'Risks',
          type: 'scatter',
          symbolSize: function (data) {
            return (data[0] * data[1]) * 2 + 10; // Bubble size based on score
          },
          data: activeRisks,
          itemStyle: { opacity: 0.8, borderColor: '#fff', borderWidth: 1 }
        }
      ]
    };
    this.charts.riskmatrix.setOption(option);
  }
}
