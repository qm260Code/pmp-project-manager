/**
 * Baseline Project Template Data
 * Focus: Smart Warehousing & Cold Chain Logistics Digital Upgrade Project
 */
export const InitialData = {
  projectInfo: {
    name: '智慧仓储与冷链物流数字化升级项目',
    manager: '李国强 (PMP)',
    sponsor: '张建华 (集团副总裁)',
    status: 'In Progress',
    startDate: '2026-06-01',
    endDate: '2026-11-30',
    budget: 500000,
    description: '通过引入物联网、自动化仓储系统(WMS)与冷链温控感应器，实现物流中心的全流程数字化监控，提升20%的仓储吞吐率，确保食品医药运输冷链合规率达到100%。'
  },
  sidebarTitles: {
    dashboard: "项目基本情况总览",
    matrix: "PMP 5x10 过程矩阵",
    stakeholders: "相关方登记册 (10.1)",
    risks: "风险登记册 (11.2)",
    schedule: "进度里程碑与甘特图",
    cost: "成本挣值分析 (EVM)",
    raci: "责任分配矩阵 (RACI)",
    export: "数据导出与分析报告"
  },
  // Text contents for PMP major deliverables
  documents: {
    // 启动过程组
    developProjectCharter: `# 1. 项目章程 (Project Charter)
## 1.1 项目背景与目的
当前集团冷链仓储物流环节自动化程度低，温湿度控制缺乏实时监控，存在食品变质风险及合规审计隐患。本项目旨在通过数字化技术升级，构建实时监控的智能仓储冷链物流管理系统。

## 1.2 项目目标
* 在2026年11月30日前完成系统上线，控制在50万预算内。
* 冷链温控合规率达 100%，消除人工漏检。
* 仓库吞吐与分拣效率提升 20% 以上。

## 1.3 高层级里程碑
1. 项目立项章程签署：2026-06-15
2. 系统需求与设计完成：2026-07-15
3. 传感硬件与系统开发完成：2026-09-15
4. 现场部署联调及员工培训：2026-10-15
5. UAT验收测试与正式上线：2026-11-15
6. 项目合同收尾与交接：2026-11-30

## 1.4 高层级风险
* 供应链受限导致定制化温控传感器到货延误。
* 既有仓库信号屏蔽严重影响物联网通信。
* 仓管人员对数字化系统存在操作壁垒和抵触情绪。`,

    // 规划过程组
    developProjectManagementPlan: `# 2. 项目管理计划 (Project Management Plan)
## 2.1 整合管理计划
由项目经理李国强统筹，每周召开里程碑评审会。变更必须经由“项目变更控制委员会 (CCB)”审批。

## 2.2 范围管理计划
详见范围说明书与WBS。采用严格的需求基准，避免未经变更控制的需求蔓延。

## 2.3 进度与成本基准
* 进度基准：使用 Gantt 图跟进，每周更新实际进度百分比。
* 成本基准：项目总预算 500,000 元，按 WBS 分配到具体工作包，通过 Earned Value 挣值分析法进行每周监控。`,

    defineScope: `# 3. 项目范围说明书 (Project Scope Statement)
## 3.1 项目范围描述
本项目包含：
1. 3个主要物流中心仓库的 WiFi/LoRa 物联网网格部署。
2. 50个冷链温控硬件传感器的采购与标定安装。
3. WMS系统的仓储管理模块、冷链监控模块、告警中心模块的集成开发。
4. 仓库管理员及运维班组的系统操作培训。

## 3.2 验收标准
* 传感器数据上报间隔不超过5分钟，丢包率 < 0.1%。
* WMS系统在高并发读写下（100+传感器同时上报）无卡顿，平均响应时间 < 2秒。
* 模拟断电等异常情况下，告警短信与APP推送能在30秒内送达负责人。

## 3.3 项目除外 (Out of Scope)
* 物流中心货梯及货架等硬件改造。
* 物流车队外部干线运输GPS实时追踪（属于第二期规划）。`,

    planQualityManagement: `# 4. 质量管理计划 (Quality Management Plan)
## 4.1 质量测量指标
* 传感器校准偏差：温度偏差 <= ±0.2℃，湿度偏差 <= ±2% RH。
* 系统可用性：服务运行时间比例 >= 99.9%。
* 测试覆盖率：核心业务代码单元测试覆盖率 >= 85%，系统UAT用例通过率 100%。

## 4.2 质量保证与控制方法
* 开发阶段引入代码同行评审（Code Review）。
* 硬件安装前必须经过实验室标定，出具合格证书。
* 部署后进行48小时连续无间断压力测试与烤机。`,

    planCommunicationsManagement: `# 5. 沟通管理计划 (Communications Management Plan)
## 5.1 沟通矩阵
* **每日晨会**：项目团队成员，15分钟，讨论昨日完成、今日计划与问题阻碍，口头汇报。
* **每周进度汇报**：项目经理发给所有相关方，包括赞助商及客户代表，EVM状态与风险控制表，电子邮件。
* **每月里程碑评审会**：Sponsor、客户代表、PM及技术专家，汇报阶段交付成果，会议室演示与纪要。`
  },

  // 10大知识领域涉及的其他核心结构数据
  
  // 相关方管理 - 相关方登记册
  stakeholders: [
    { id: 'sh-1', name: '张建华', role: '项目发起人(Sponsor) / 集团副总裁', power: 5, interest: 5, engagement: 'Supportive', strategy: '每周重点呈报资金使用与进度报告，定期拜访汇报确保支持。' },
    { id: 'sh-2', name: '王志强', role: '关键用户 / 物流中心运营总监', power: 4, interest: 5, engagement: 'Leading', strategy: '密切沟通仓管业务细节，邀请参与系统Demo演示及UAT设计，确保最终验收满意。' },
    { id: 'sh-3', name: '刘明', role: '项目技术负责人 / 软件架构师', power: 3, interest: 5, engagement: 'Supportive', strategy: '充分授权技术路线制定，日常晨会解决资源冲突与技术障碍。' },
    { id: 'sh-4', name: '陈小丽', role: '质量控制经理 / QA主管', power: 3, interest: 3, engagement: 'Neutral', strategy: '确保其及时获得测试报告和合规指标，争取在项目关键节点给予支持。' },
    { id: 'sh-5', name: '赵铁柱', role: '外部硬件传感器供应商项目经理', power: 2, interest: 4, engagement: 'Resistant', strategy: '严格执行采购合同约束，细化交付时间表，通过高频催催施加约束。' },
    { id: 'sh-6', name: '王小二', role: '现场仓库管理员代表', power: 1, interest: 3, engagement: 'Neutral', strategy: '提供简单易懂的操作手册，组织现场手把手培训，缓解对新系统的焦虑。' }
  ],

  // 风险管理 - 风险登记册
  risks: [
    { id: 'r-1', description: '冷链物联网硬件传感器交付延误，影响现场部署进度', category: 'External', probability: 4, impact: 3, strategy: 'Mitigate', owner: '赵铁柱', status: 'Active' },
    { id: 'r-2', description: '仓库库体钢结构屏蔽严重，导致LoRa/WiFi无线温控设备数据发生丢包', category: 'Technical', probability: 3, impact: 4, strategy: 'Mitigate', owner: '刘明', status: 'Active' },
    { id: 'r-3', description: '物流业务部门提出合同范围外的新系统对接需求，造成范围蔓延', category: 'PM', probability: 3, impact: 3, strategy: 'Avoid', owner: '李国强', status: 'Active' },
    { id: 'r-4', description: '现场仓管人员抵触复杂系统操作，影响系统推广落地', category: 'Organizational', probability: 2, impact: 4, strategy: 'Mitigate', owner: '李国强', status: 'Active' },
    { id: 'r-5', description: '集团本季度削减资本性开支，导致项目后期节点付款延期', category: 'Organizational', probability: 1, impact: 5, strategy: 'Transfer', owner: '张建华', status: 'Active' }
  ],

  // 进度管理 - 进度里程碑与活动任务 (Gantt Chart 基础)
  schedule: [
    { id: 't-1', name: '项目立项与章程签署 (里程碑)', startDate: '2026-06-01', endDate: '2026-06-15', progress: 100, owner: '李国强', dependencies: '' },
    { id: 't-2', name: '系统需求调研与大纲设计', startDate: '2026-06-16', endDate: '2026-07-15', progress: 95, owner: '王志强', dependencies: 't-1' },
    { id: 't-3', name: '温控传感器硬件采购与二次标定', startDate: '2026-07-16', endDate: '2026-08-20', progress: 60, owner: '赵铁柱', dependencies: 't-2' },
    { id: 't-4', name: 'WMS冷链监测与告警模块代码开发', startDate: '2026-07-16', endDate: '2026-09-15', progress: 40, owner: '刘明', dependencies: 't-2' },
    { id: 't-5', name: '仓库无线网格搭建与硬件现场施工', startDate: '2026-09-16', endDate: '2026-10-15', progress: 0, owner: '刘明', dependencies: 't-3,t-4' },
    { id: 't-6', name: '联调集成与用户验收UAT测试 (里程碑)', startDate: '2026-10-16', endDate: '2026-11-15', progress: 0, owner: '陈小丽', dependencies: 't-5' },
    { id: 't-7', name: '系统割接上线、总结与收尾交付', startDate: '2026-11-16', endDate: '2026-11-30', progress: 0, owner: '李国强', dependencies: 't-6' }
  ],

  // 成本管理 - 挣值计算源数据
  costs: [
    { id: 'c-1', description: '项目调研、方案编写与咨询费', plannedValue: 50000, earnedValue: 50000, actualCost: 48000 },
    { id: 'c-2', description: 'WMS系统软件套件及数据库授权', plannedValue: 150000, earnedValue: 142500, actualCost: 145000 },
    { id: 'c-3', description: '冷链无线传感器硬件及主控基站采购', plannedValue: 120000, earnedValue: 72000, actualCost: 82000 },
    { id: 'c-4', description: '物流仓库本地网格敷设及支架施工安装费', plannedValue: 80000, earnedValue: 32000, actualCost: 42000 },
    { id: 'c-5', description: '系统集成费、API定制开发费', plannedValue: 60000, earnedValue: 0, actualCost: 0 },
    { id: 'c-6', description: '项目管理及后勤、会议培训与收尾差旅', plannedValue: 40000, earnedValue: 0, actualCost: 0 }
  ],

  // 资源管理 - RACI 责任分配矩阵
  raci: {
    roles: ['李国强 (PM)', '张建华 (Sponsor)', '王志强 (Customer)', '刘明 (Tech Lead)', '陈小丽 (QA)', '赵铁柱 (Vendor)'],
    matrix: [
      { activity: '制定项目章程', roles: { '李国强 (PM)': 'A', '张建华 (Sponsor)': 'R', '王志强 (Customer)': 'C', '刘明 (Tech Lead)': 'C', '陈小丽 (QA)': 'I', '赵铁柱 (Vendor)': 'I' } },
      { activity: '收集详细需求', roles: { '李国强 (PM)': 'A', '张建华 (Sponsor)': 'I', '王志强 (Customer)': 'R', '刘明 (Tech Lead)': 'R', '陈小丽 (QA)': 'C', '赵铁柱 (Vendor)': 'C' } },
      { activity: '编制工作分解结构 (WBS)', roles: { '李国强 (PM)': 'A', '张建华 (Sponsor)': 'I', '王志强 (Customer)': 'C', '刘明 (Tech Lead)': 'R', '陈小丽 (QA)': 'I', '赵铁柱 (Vendor)': 'I' } },
      { activity: '软硬件集成调试', roles: { '李国强 (PM)': 'A', '张建华 (Sponsor)': 'I', '王志强 (Customer)': 'I', '刘明 (Tech Lead)': 'R', '陈小丽 (QA)': 'R', '赵铁柱 (Vendor)': 'R' } },
      { activity: '制定风险响应计划', roles: { '李国强 (PM)': 'A', '张建华 (Sponsor)': 'R', '王志强 (Customer)': 'C', '刘明 (Tech Lead)': 'R', '陈小丽 (QA)': 'C', '赵铁柱 (Vendor)': 'R' } },
      { activity: '用户验收测试 (UAT)', roles: { '李国强 (PM)': 'C', '张建华 (Sponsor)': 'I', '王志强 (Customer)': 'A', '刘明 (Tech Lead)': 'C', '陈小丽 (QA)': 'R', '赵铁柱 (Vendor)': 'I' } },
      { activity: '阶段与合同项目收尾', roles: { '李国强 (PM)': 'A', '张建华 (Sponsor)': 'R', '王志强 (Customer)': 'R', '刘明 (Tech Lead)': 'I', '陈小丽 (QA)': 'I', '赵铁柱 (Vendor)': 'C' } }
    ]
  },
  team: [
    { id: 'm-1', name: '李国强', role: '项目经理 (PM)', department: '项目管理部', reportsTo: '' },
    { id: 'm-2', name: '张建华', role: '项目发起人 (Sponsor)', department: '集团总经办', reportsTo: '' },
    { id: 'm-3', name: '刘明', role: '技术负责人 (Tech Lead)', department: '软件开发部', reportsTo: 'm-1' },
    { id: 'm-4', name: '陈小丽', role: '质量控制经理 (QA)', department: '质量安全部', reportsTo: 'm-1' },
    { id: 'm-5', name: '赵铁柱', role: '供应商接口经理 (Vendor PM)', department: '供应链管理部', reportsTo: 'm-1' },
    { id: 'm-6', name: '张三', role: '高级软件工程师 (SE)', department: '软件开发部', reportsTo: 'm-3' },
    { id: 'm-7', name: '李四', role: '测试开发工程师 (STE)', department: '质量安全部', reportsTo: 'm-4' }
  ],
  actionItems: [
    { id: 'a-1', content: '完成冷链传感器在低能耗模式下的温湿度上报实验室测试', triggerDate: '2026-06-10', owner: '陈小丽', targetDate: '2026-06-20', delayDays: 0, priority: 'High', status: 'Pending' },
    { id: 'a-2', content: '提交一号物流仓库无线 AP/LoRa 覆盖拓扑网络图给王志强确认', triggerDate: '2026-06-12', owner: '刘明', targetDate: '2026-06-18', delayDays: 2, priority: 'Medium', status: 'Completed' },
    { id: 'a-3', content: '起草第二期物流车队GPS全程干线运输跟踪规划草案备忘录', triggerDate: '2026-06-15', owner: '李国强', targetDate: '2026-06-30', delayDays: 0, priority: 'Low', status: 'Pending' }
  ]
};
