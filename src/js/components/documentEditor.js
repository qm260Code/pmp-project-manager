import { store } from '../store.js';
import { ModalHelper } from '../app.js';

export const PmpDocumentEditor = {
  /**
   * Templates for documents when empty
   */
  templates: {
    developProjectCharter: `# 项目章程 (Project Charter)
## 一、项目背景与目的
[在此输入项目启动的背景原因，解决什么商业痛点]

## 二、项目可交付成果与目标
* 目标1：
* 目标2：

## 三、高层级里程碑与进度
1. 里程碑 1：
2. 里程碑 2：

## 四、项目发起人(Sponsor)及高层授权
项目经理：
发起人签字：`,

    developProjectManagementPlan: `# 项目管理计划 (Project Management Plan)
## 一、项目生命周期及过程方法
[描述项目采用预测型、敏捷型还是混合型生命周期]

## 二、核心管理子计划
1. 范围管理计划：
2. 进度管理计划：
3. 成本管理计划：
4. 质量管理计划：
5. 风险管理计划：

## 三、基准配置 (Baselines)
* 范围基准 (Scope Baseline)：
* 进度基准 (Schedule Baseline)：
* 成本基准 (Cost Baseline)：`,

    defineScope: `# 范围说明书 (Project Scope Statement)
## 一、项目范围描述 (In Scope)
[详细描述项目要交付的具体产品或服务内容]

## 二、可交付物标准与验收准则
* 交付物 1 验收标准：
* 交付物 2 验收标准：

## 三、项目边界与除外情况 (Out of Scope)
* 明确不包含：
* 明确不包含：`,

    planQualityManagement: `# 质量管理计划 (Quality Management Plan)
## 一、项目质量标准
[参照的国家标准、行业标准或集团内部规范]

## 二、核心质量测量指标 (Metrics)
* 指标 1：
* 指标 2：

## 三、质量保证 (QA) 与质量控制 (QC) 活动
* QA 审计安排：
* QC 检查频次：`,

    planCommunicationsManagement: `# 沟通管理计划 (Communications Management Plan)
## 一、沟通需求分析
[各利益相关方所需要的关键信息、格式及获取时间]

## 二、沟通策略矩阵
* **例会**：对象、频率、汇报形式。
* **报告**：对象、频率、发送方式。
* **变更升级**：决策流程及审批链条。`,

    // Dynamic template fallback for any standard PMP processes
    generic: (kaName, pgName, processName) => `# ${processName} (PMP 记录)
* **知识领域**: ${kaName}
* **过程组**: ${pgName}
* **最后更新人**: ${store.state.projectInfo.manager}
* **状态**: 草稿

## 一、过程输入 (Inputs)
* 

## 二、工具与技术 (Tools & Techniques)
* 

## 三、过程输出 / 实战记录 (Outputs / Log)
[在此记录本阶段该领域的活动执行情况、变更备忘录或输出结果]`
  },

  /**
   * Translates a cell process to its document storage key
   */
  getDocKey(kaKey, pgKey, processId) {
    // Check if it's one of the primary document keys prefilled in initialData
    const mapping = {
      'integration_initiating_1': 'developProjectCharter',
      'integration_planning_2': 'developProjectManagementPlan',
      'scope_planning_3': 'defineScope',
      'quality_planning_1': 'planQualityManagement',
      'communications_planning_1': 'planCommunicationsManagement'
    };
    return mapping[processId] || `doc_${kaKey}_${pgKey}_${processId}`;
  },

  /**
   * Opens the editor in the modal shell
   */
  openEditor(kaName, pgName, processId, processName, docKey) {
    const state = store.state;
    let text = state.documents[docKey] || '';
    
    // Auto-generate template if document is empty
    if (!text.trim()) {
      if (this.templates[docKey]) {
        text = this.templates[docKey];
      } else {
        text = this.templates.generic(kaName, pgName, processName);
      }
    }

    // Determine status badge
    let status = 'not-started';
    if (state.documents[docKey]) {
      status = text.includes('状态: 最终') || text.includes('状态: 发布') ? 'final' : 'draft';
    }

    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:var(--text-muted);">
            知识领域: <strong>${kaName}</strong> | 过程组: <strong>${pgName}</strong>
          </span>
          <div class="form-group" style="margin-bottom:0; display:flex; align-items:center; gap:8px;">
            <label for="doc-status" style="margin-bottom:0;">发布状态:</label>
            <select name="status" id="doc-status" class="form-control" style="width:110px; padding:4px 8px;">
              <option value="draft" ${status === 'draft' || status === 'not-started' ? 'selected' : ''}>草稿中 (Draft)</option>
              <option value="final" ${status === 'final' ? 'selected' : ''}>定稿发布 (Final)</option>
            </select>
          </div>
        </div>
        
        <div class="form-group" style="margin-bottom:4px;">
          <textarea name="documentText" id="editor-textarea" class="form-control" style="height:350px; font-family: 'Courier New', Courier, monospace; font-size:13px; line-height:1.6; background-color: var(--bg-secondary); color: var(--text-primary);">${text}</textarea>
        </div>
        
        <p style="font-size:11px; color:var(--text-muted); margin-bottom:0;">
          💡 提示：该文档支持标准 Markdown 格式。完成修改后点击“保存”会自动写入 LocalStorage。
        </p>
      </div>
    `;

    ModalHelper.open(
      `编辑：${processName}`,
      bodyHtml,
      (data) => {
        let textToSave = data.documentText || '';
        
        // Append status line to generic template if selected final
        if (data.status === 'final') {
          if (!textToSave.includes('状态: 定稿发布') && !textToSave.includes('状态: 最终')) {
            textToSave = textToSave.replace(/状态: (草稿|未开始)/g, '状态: 定稿发布');
          }
        }
        
        // Save to central store
        store.updateDocument(docKey, textToSave);
        store.publish('notify', { type: 'success', message: `《${processName}》文档保存成功` });
        return true;
      },
      '保存更新'
    );
  }
};
