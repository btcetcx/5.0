<template>
  <operation-setting-page v-if="settingModule" :module="settingModule" />

  <aw-detail-page v-else-if="isDetail">
    <template #toolbar>
      <aw-detail-toolbar :actions="detailToolbarActions" @back="goDetailBack" @action="handleDetailAction" />
    </template>
    <template #header>
      <aw-detail-header
        v-if="detailRecord"
        :title="detailRecord.title"
        :status-text="detailRecord.statusText"
        :status-tone="detailRecord.statusTone"
        :code="detailRecord.code"
        :metas="detailRecord.metas"
      />
    </template>

    <section v-if="!detailRecord" class="aw-card">
      <div class="aw-empty-cell">正在加载详情...</div>
    </section>

    <template v-else>
      <section v-if="detailRecord.metrics?.length" class="rd-detail-summary">
        <div v-for="metric in detailRecord.metrics" :key="metric.label" :class="['rd-detail-metric', metric.tone || '']">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </div>
      </section>

      <section class="aw-card">
        <aw-detail-tabs v-model="activeDetailTab" :tabs="detailRecord.tabs" />

        <div v-if="isProjectDetail" class="rd-project-detail">
          <template v-if="activeDetailTab === 'detail'">
            <div v-for="section in activeDetailSections" :key="section.key" class="rd-detail-section">
              <div v-if="section.title" class="aw-detail-section-title">{{ section.title }}</div>
              <aw-detail-info-grid v-if="section.type === 'fields'" :items="section.fields" />
              <div v-else-if="section.type === 'richText'" class="rd-detail-rich">{{ section.content }}</div>
              <div v-else-if="section.type === 'attachments'" class="rd-attach-grid">
                <div v-for="file in section.rows" :key="file.name" class="rd-attach-card">
                  <strong>{{ file.name }}</strong>
                  <span>{{ file.size }} · {{ file.uploader }}</span>
                  <span>{{ file.time }}</span>
                  <div><span class="aw-link">查看</span><span class="aw-link">下载</span></div>
                </div>
              </div>
              <detail-table v-else-if="section.type === 'table'" :section-key="section.key" :columns="section.columns" :rows="section.rows" />
            </div>
          </template>

          <template v-else-if="activeDetailTab === 'members'">
            <div class="rd-project-action-row">
              <button class="aw-btn" type="button" :disabled="!projectStageEditable" @click="openProjectMemberPicker">新增成员</button>
              <button class="aw-btn danger" type="button" :disabled="!projectStageEditable" @click="detailMessage = '请选择成员后再移除'">移除成员</button>
            </div>
            <detail-table :columns="['姓名', '角色', '加入时间']" :rows="projectMemberRows" />
          </template>

          <template v-else-if="activeDetailTab === 'materials'">
            <div v-if="!projectHasBom" class="rd-project-empty">
              <strong>BOM 清单还是空的</strong>
              <span>可以引用已有 BOM，也可以新增项目物料清单，或从 Excel 导入后再逐项修正。</span>
              <div>
                <button class="aw-btn primary" type="button" :disabled="!projectCanEditBom" @click="openProjectModal('bomRef')">引用BOM</button>
                <button class="aw-btn" type="button" :disabled="!projectCanEditBom" @click="openProjectModal('bomAdd')">添加BOM</button>
                <button class="aw-btn" type="button" :disabled="!projectCanEditBom" @click="openProjectModal('bomImport')">导入Excel</button>
              </div>
              <div v-if="!projectCanEditBom" class="rd-project-hint">{{ projectLockedHint }}</div>
            </div>
            <template v-else>
              <div class="rd-project-action-row">
                <button class="aw-btn" type="button" :disabled="!projectCanEditBom" @click="openProjectModal('bomRef')">引用BOM</button>
                <button class="aw-btn" type="button" :disabled="!projectCanEditBom" @click="openProjectModal('bomAdd')">添加BOM</button>
                <button class="aw-btn" type="button" :disabled="!projectCanEditBom" @click="openProjectModal('bomImport')">导入Excel</button>
                <button :class="['aw-btn', projectCanLockBom ? 'primary' : '']" type="button" :disabled="!projectCanLockBom" @click="lockProjectBom">{{ projectBomLocked ? '已锁定' : '锁定BOM' }}</button>
                <span v-if="projectBomLocked" class="rd-muted">锁定后作为当前项目采购、报价和生产的版本基准。</span>
                <span v-else-if="!projectCanEditBom" class="rd-muted">{{ projectLockedHint }}</span>
              </div>
              <detail-table :columns="['序号', '层级', '物料编码', '物料名称', '规格型号', '单位', '项目用量', '损耗率', '来源', '状态']" :rows="projectBomRows" />
            </template>
          </template>

          <template v-else-if="activeDetailTab === 'process'">
            <div v-if="!projectHasProcess" class="rd-project-empty">
              <strong>工艺流程还是空的</strong>
              <span>可以选择标准工艺流程，也可以新增项目专属工艺流程。</span>
              <div>
                <button class="aw-btn primary" type="button" :disabled="!projectCanEditProcess" @click="openProjectModal('processRef')">选择工艺流程</button>
                <button class="aw-btn" type="button" :disabled="!projectCanEditProcess" @click="openProjectModal('processAdd')">添加工艺流程</button>
              </div>
              <div v-if="!projectCanEditProcess" class="rd-project-hint">{{ projectLockedHint }}</div>
            </div>
            <template v-else>
              <div class="rd-project-action-row">
                <button class="aw-btn" type="button" :disabled="!projectCanEditProcess" @click="openProjectModal('processAdd')">添加工艺流程</button>
                <button :class="['aw-btn', projectCanLockProcess ? 'primary' : '']" type="button" :disabled="!projectCanLockProcess" @click="lockProjectProcess">{{ projectProcessLocked ? '已锁定' : '锁定工艺' }}</button>
                <span v-if="projectProcessLocked" class="rd-muted">锁定后作为当前项目报价和生产的工艺基准。</span>
                <span v-else-if="!projectCanEditProcess" class="rd-muted">{{ projectLockedHint }}</span>
              </div>
              <detail-table :columns="['序号', '工艺编号', '工艺名称', '版本', '来源', '状态']" :rows="projectProcessRows" />
            </template>
          </template>

          <template v-else-if="activeDetailTab === 'quote'">
            <div v-if="!projectQuoteRows.length" class="rd-project-empty">
              <strong>报价信息还是空的</strong>
              <span>添加 BOM 和工艺后会自动形成对应成本，也可以手动新增成本项。</span>
              <div><button class="aw-btn primary" type="button" :disabled="!projectCanAddQuoteItem" @click="openProjectModal('quoteAdd')">新增成本项</button></div>
              <div v-if="!projectCanAddQuoteItem" class="rd-project-hint">{{ projectQuoteHint }}</div>
            </div>
            <template v-else>
              <div class="rd-project-action-row">
                <button class="aw-btn primary" type="button" :disabled="!projectCanAddQuoteItem" @click="openProjectModal('quoteAdd')">新增成本项</button>
                <button :class="['aw-btn', projectCanLockQuote ? 'primary' : '']" type="button" :disabled="!projectCanLockQuote" @click="lockProjectQuote">{{ projectQuoteConfirmed ? '已锁定报价' : '锁定报价' }}</button>
                <span v-if="!projectCanLockQuote" class="rd-muted">{{ projectQuoteHint }}</span>
              </div>
              <detail-table :columns="['序号', '成本项', '来源说明', '金额', '状态']" :rows="projectQuoteTableRows" />
              <div class="rd-project-metrics">
                <div><span>当前成本估算</span><strong>{{ money(projectQuoteBaseAmount) }}</strong></div>
                <div>
                  <span>预计成本波动</span>
                  <input v-model="projectQuoteAdjustAmount" class="aw-input aw-num" :disabled="!projectCanAdjustQuote" />
                </div>
                <div class="primary"><span>预计成本</span><strong>{{ money(projectQuoteActualAmount) }}</strong></div>
              </div>
            </template>
          </template>

          <template v-else-if="activeDetailTab === 'purchase'">
            <div v-if="!projectHasPurchase" class="rd-project-empty">
              <strong>采购信息还是空的</strong>
              <span>报价确认后，可从项目物料清单发起采购，并在这里追踪采购进度。</span>
              <div><button :class="['aw-btn', projectCanStartPurchase ? 'primary' : '']" type="button" :disabled="!projectCanStartPurchase" @click="startProjectPurchase">发起采购</button></div>
            </div>
            <detail-table v-else :columns="['序号', '采购单号', '来源', '采购金额', '状态', '进度']" :rows="projectPurchaseRows" />
            <div v-if="projectPurchaseHint" class="rd-project-hint">{{ projectPurchaseHint }}</div>
          </template>

          <template v-else-if="activeDetailTab === 'production'">
            <div v-if="!projectHasProduction" class="rd-project-empty">
              <strong>生产信息还是空的</strong>
              <span>报价确认后，可发起生产需求，并在这里追踪计划、订单、工单和完工进度。</span>
              <div><button :class="['aw-btn', projectCanStartProduction ? 'primary' : '']" type="button" :disabled="!projectCanStartProduction" @click="startProjectProduction">下单生产需求</button></div>
            </div>
            <detail-table v-else :columns="['序号', '生产需求号', '来源', '需求数量', '状态', '进度']" :rows="projectProductionRows" />
            <div v-if="projectProductionHint" class="rd-project-hint">{{ projectProductionHint }}</div>
          </template>

          <template v-else-if="activeDetailTab === 'expense'">
            <div class="rd-project-intro">
              <div><b>1.</b> 记录项目BOM、工艺之外产生的成本项目，用于项目整体成本核算。</div>
              <div><b>2.</b> 成本可按类别、发生日期和责任人归集，并参与项目利润分析。</div>
            </div>
            <div class="rd-project-action-row spread">
              <span class="rd-muted">{{ projectCanAddCost ? '可补充差旅、测试、外协等项目执行成本。' : projectLockedHint }}</span>
              <button class="aw-btn primary" type="button" :disabled="!projectCanAddCost" @click="openProjectModal('projectCostAdd')">新增成本项目</button>
            </div>
            <detail-table :columns="['序号', '成本类型', '成本说明', '金额', '发生日期', '责任人', '状态']" :rows="projectCostTableRows" />
          </template>

          <template v-else-if="activeDetailTab === 'logs'">
            <div class="rd-timeline">
              <div v-for="item in projectLogRows" :key="`${item.operator}-${item.time}`" class="rd-timeline-row">
                <span class="rd-timeline-dot" />
                <div>
                  <strong>{{ item.operator }}</strong>
                  <span>{{ item.action }}</span>
                  <em>{{ item.time }}</em>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div v-else v-for="section in activeDetailSections" :key="section.key" class="rd-detail-section">
          <div v-if="section.title" class="aw-detail-section-title">{{ section.title }}</div>
          <aw-detail-info-grid v-if="section.type === 'fields'" :items="section.fields" />

          <div v-else-if="section.type === 'richText'" class="rd-detail-rich">{{ section.content }}</div>

          <div v-else-if="section.type === 'attachments'" class="rd-attach-grid">
            <div v-for="file in section.rows" :key="file.name" class="rd-attach-card">
              <strong>{{ file.name }}</strong>
              <span>{{ file.size }} · {{ file.uploader }}</span>
              <span>{{ file.time }}</span>
              <div><span class="aw-link">查看</span><span class="aw-link">下载</span></div>
            </div>
          </div>

          <div v-else-if="section.type === 'timeline'" class="rd-timeline">
            <div v-for="item in section.rows" :key="`${item.operator}-${item.time}`" class="rd-timeline-row">
              <span class="rd-timeline-dot" />
              <div>
                <strong>{{ item.operator }}</strong>
                <span>{{ item.action }}</span>
                <em>{{ item.time }} · {{ item.result || '已记录' }}</em>
              </div>
            </div>
          </div>

          <div v-else-if="section.type === 'bomTree'" class="aw-doc-tbl-wrap">
            <div class="aw-doc-tbl-inner">
              <table class="aw-doc-tbl rd-bom-detail-table">
                <thead>
                  <tr>
                    <th>行号</th>
                    <th>物料编码</th>
                    <th>物料名称</th>
                    <th>规格</th>
                    <th>适用型号</th>
                    <th>用量</th>
                    <th>单位</th>
                    <th>物料类型</th>
                    <th>替代料</th>
                    <th>损耗%</th>
                    <th>毛用量</th>
                    <th>关联工序</th>
                    <th>单价</th>
                    <th>小计</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in flattenDetailBomRows(section.tree)" :key="row.id">
                    <td>
                      <span class="rd-bom-rowno" :style="{ paddingLeft: `${row.level * 18}px` }">
                        <button v-if="row.hasChildren" class="rd-caret" type="button" @click="toggleDetailBomCollapse(row.id)">{{ detailBomCollapsed[row.id] ? '▸' : '▾' }}</button>
                        <span v-else class="rd-caret ghost" />
                        {{ row.no }}
                      </span>
                    </td>
                    <td class="aw-num">{{ row.node.code }}</td>
                    <td>{{ row.node.name }}</td>
                    <td>{{ row.node.spec }}</td>
                    <td>{{ bomVariantText(row.node) }}</td>
                    <td class="aw-num">{{ row.node.qty }}</td>
                    <td>{{ row.node.unit }}</td>
                    <td><span class="rd-chip">{{ row.node.type }}</span></td>
                    <td>{{ bomAltText(row.node) }}</td>
                    <td class="aw-num">{{ row.node.loss }}</td>
                    <td class="aw-num">{{ bomGross(row.node).toFixed(3) }}</td>
                    <td>{{ row.node.processOp || '未关联' }}</td>
                    <td class="aw-num">¥ {{ Number(row.node.price || 0).toFixed(2) }}</td>
                    <td class="aw-num">¥ {{ bomSubtotal(row.node).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="section.type === 'craftRoute'" class="rd-craft-detail">
            <div class="rd-craft-legend"><span><i class="in" />自制</span><span><i class="out" />委外</span><span><i class="seq" />串序</span><span><i class="par" />并序</span></div>
            <div class="rd-craft-flow">
              <div v-for="(stage, index) in section.stages" :key="stage.id" :class="['rd-craft-stage', stage.kind]">
                <div class="rd-stage-no">{{ index + 1 }}</div>
                <div v-for="op in stage.ops" :key="op.id" :class="['rd-craft-op', op.type, { selected: selectedCraftOp?.id === op.id }]" @click="selectedDetailOpId = op.id">
                  <div><strong>{{ op.code }}</strong><span>{{ op.name }}</span></div>
                  <p>{{ op.type === 'out' ? '委外厂商' : '工作中心' }}：{{ op.workCenter }}</p>
                  <p>单件工时：{{ op.setupTime + op.runTime }} min · {{ op.qcRequired ? '需检验' : '随机抽检' }}</p>
                </div>
              </div>
            </div>
            <div v-if="selectedCraftOp" class="rd-craft-panel">
              <div class="aw-detail-section-title">工序只读信息</div>
              <aw-detail-info-grid :items="selectedCraftFields" />
              <div class="rd-craft-subtables">
                <div>
                  <div class="aw-detail-section-title">物料消耗（每件）</div>
                  <detail-table :columns="['物料编码', '名称', '数量', '单位']" :rows="selectedCraftOp.materialRows" />
                </div>
                <div>
                  <div class="aw-detail-section-title">副产品 / 废料</div>
                  <detail-table :columns="['名称', '数量', '单位']" :rows="selectedCraftOp.wasteRows" />
                </div>
              </div>
            </div>
          </div>

          <detail-table v-else-if="section.type === 'table'" :section-key="section.key" :columns="section.columns" :rows="section.rows" />
        </div>
        <div v-if="detailMessage" class="aw-form-note">{{ detailMessage }}</div>
      </section>
    </template>

    <aw-audit-action-modal
      :open="rdAuditModalOpen"
      :title="rdAuditTitle"
      :document="rdAuditDocument"
      :approval-nodes="rdAuditApprovalNodes"
      :person-depts="rdPeopleDepts"
      @cancel="rdAuditModalOpen = false"
      @confirm="confirmRdAuditAction"
    />
  </aw-detail-page>

  <rd-craft-create-page v-else-if="isCraftCreate" @back="goList" />

  <aw-form-page v-else-if="isBomCreate" :actions="bomActions" @back="goList" @action="handleBomAction">
    <section class="aw-form-card">
      <div class="aw-detail-section-title">基础信息</div>
      <div class="aw-form-grid">
        <div class="aw-field"><label>BOM编号</label><input class="aw-input" value="自动生成" disabled /></div>
        <div class="aw-field"><label class="req">BOM名称</label><input v-model="bomForm.name" class="aw-input" placeholder="请输入 BOM 名称" /></div>
        <div class="aw-field">
          <label class="req">适用产品</label>
          <div class="aw-field-row">
            <input v-model="bomForm.product" class="aw-input" placeholder="选择适用产品" readonly @click="openGenericPicker('product', 'bomProduct')" />
            <button class="aw-tool-btn" type="button" @click="openGenericPicker('product', 'bomProduct')">选择产品</button>
          </div>
        </div>
        <div class="aw-field"><label>版本号</label><input v-model="bomForm.version" class="aw-input" placeholder="如 V1.0" /></div>
        <div class="aw-field"><label class="req">BOM类型</label><select v-model="bomForm.type" class="aw-select"><option value="">请选择</option><option v-for="type in bomHeaderTypeOptions" :key="type">{{ type }}</option></select></div>
        <div class="aw-field"><label>编制人</label><input v-model="bomForm.author" class="aw-input" placeholder="请输入编制人" /></div>
        <div class="aw-field"><label>生效日期</label><input v-model="bomForm.effectiveDate" class="aw-input" type="date" /></div>
        <div class="aw-field"><label class="req">审批流程</label><select v-model="bomForm.workflow" class="aw-select"><option value="">请选择审批流程</option><option v-for="workflow in bomWorkflowOptions" :key="workflow">{{ workflow }}</option></select></div>
      </div>
      <div class="rd-model-config">
        <div>
          <div class="rd-mini-title">产品型号配置</div>
          <div class="rd-muted">适用产品选择 iPhone17 后，生产展开 BOM 时按下单型号过滤适用物料。</div>
        </div>
        <div class="rd-chip-list"><span v-for="model in bomModelOptions" :key="model" class="rd-chip on">{{ model }}</span></div>
      </div>
    </section>

    <section class="rd-summary">
      <div class="rd-summary-card"><span>层级数</span><strong>{{ bomStats.levels }}</strong></div>
      <div class="rd-summary-card"><span>物料数</span><strong>{{ bomStats.materials }}</strong></div>
      <div class="rd-summary-card"><span>自制</span><strong>{{ bomStats.self }}</strong></div>
      <div class="rd-summary-card"><span>外购</span><strong>{{ bomStats.buy }}</strong></div>
      <div class="rd-summary-card"><span>单件成本</span><strong>¥ {{ bomStats.cost.toFixed(2) }}</strong></div>
      <div class="rd-summary-card"><span>累计工时</span><strong>{{ bomStats.hours.toFixed(2) }}h</strong></div>
    </section>

    <section class="aw-form-card">
      <div class="rd-structure-entry">
        <div>
          <div class="aw-detail-section-title">物料清单配置</div>
          <p v-if="bomRows.length" class="rd-muted">已配置 <b>{{ bomStats.materials }}</b> 项物料，<b>{{ bomStats.levels }}</b> 级结构，单件成本 <b>¥ {{ bomStats.cost.toFixed(2) }}</b>，累计工时 <b>{{ bomStats.hours.toFixed(2) }}h</b>。</p>
          <p v-else class="rd-muted">当前未添加物料清单。点击“添加物料清单”后维护父子件层级、用量、损耗、替代料和工序关联。</p>
        </div>
        <button class="aw-btn primary" type="button" @click="showStructureModal = true">{{ bomRows.length ? '编辑物料清单' : '+ 添加物料清单' }}</button>
      </div>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">BOM说明</div>
      <aw-rich-text-editor v-model="bomDetail" />
    </section>
    <div v-if="submitMessage" class="aw-form-note">{{ submitMessage }}</div>
  </aw-form-page>

  <aw-form-page v-else-if="isSubstituteCreate" :actions="substituteActions" @back="goSubstituteList" @action="handleSubstituteAction">
    <section class="aw-form-card">
      <div class="aw-detail-section-title">基础信息</div>
      <div class="aw-form-grid">
        <div class="aw-field">
          <label class="req">主物料</label>
          <div class="aw-field-row">
            <input v-model="substituteForm.mainMaterial" class="aw-input" readonly placeholder="选择主物料" @click="openGenericPicker('material', 'subMain')" />
            <button class="aw-tool-btn" type="button" @click="openGenericPicker('material', 'subMain')">选择</button>
          </div>
        </div>
        <div class="aw-field"><label>主物料编码</label><input v-model="substituteForm.mainCode" class="aw-input" readonly placeholder="选择后回填" /></div>
        <div class="aw-field">
          <label class="req">替代物料</label>
          <div class="aw-field-row">
            <input v-model="substituteForm.subMaterial" class="aw-input" readonly placeholder="选择替代物料" @click="openGenericPicker('material', 'subSub')" />
            <button class="aw-tool-btn" type="button" @click="openGenericPicker('material', 'subSub')">选择</button>
          </div>
        </div>
        <div class="aw-field"><label>替代物料编码</label><input v-model="substituteForm.subCode" class="aw-input" readonly placeholder="选择后回填" /></div>
        <div class="aw-field"><label class="req">替代比例</label><input v-model="substituteForm.ratio" class="aw-input" placeholder="如 1:1" /></div>
        <div class="aw-field"><label>优先级</label><input v-model="substituteForm.priority" class="aw-input" type="number" /></div>
        <div class="aw-field"><label>生效日期</label><input v-model="substituteForm.effectiveDate" class="aw-input" type="date" /></div>
        <div class="aw-field"><label>失效日期</label><input v-model="substituteForm.expiryDate" class="aw-input" placeholder="长期或日期" /></div>
        <div class="aw-field"><label>状态</label><select v-model="substituteForm.state" class="aw-select"><option v-for="state in substituteStateOptions" :key="state">{{ state }}</option></select></div>
      </div>
    </section>
    <section class="aw-form-card">
      <div class="aw-detail-section-title">说明</div>
      <aw-rich-text-editor v-model="substituteForm.remark" />
    </section>
    <div v-if="submitMessage" class="aw-form-note">{{ submitMessage }}</div>
  </aw-form-page>

  <aw-form-page v-else-if="isCreate" :actions="genericActions" @back="goList" @action="handleGenericAction">
    <section v-for="section in createConfig.sections" :key="section.title" class="aw-form-card">
      <div class="aw-detail-section-title">{{ section.title }}</div>
      <div class="aw-form-grid">
        <div v-for="field in section.fields" :key="field.key" class="aw-field">
          <label :class="{ req: field.required }">{{ field.label }}</label>
          <select v-if="field.type === 'select'" v-model="genericForm[field.key]" class="aw-select">
            <option value="">请选择</option>
            <option v-for="option in field.options || []" :key="option">{{ option }}</option>
          </select>
          <textarea v-else-if="field.type === 'textarea'" v-model="genericForm[field.key]" class="aw-input rd-textarea" :placeholder="field.placeholder || ''" :maxlength="field.maxLength" />
              <input v-else-if="field.type === 'readonly'" class="aw-input" :value="genericForm[field.key] || field.placeholder || '自动生成'" disabled />
              <div v-else-if="field.type === 'person'" class="aw-field-row">
                <input v-model="genericForm[field.key]" class="aw-input" readonly placeholder="点击选择人员" @click="openPersonPicker(field)" />
                <button class="aw-tool-btn" type="button" @click="openPersonPicker(field)">选择</button>
              </div>
              <div v-else-if="field.type === 'picker'" class="aw-field-row">
                <input v-model="genericForm[field.key]" class="aw-input" readonly :placeholder="field.placeholder || '点击选择'" @click="openGenericPicker(field.picker || 'product', 'generic', field)" />
                <button class="aw-tool-btn" type="button" @click="openGenericPicker(field.picker || 'product', 'generic', field)">
                  <span v-if="field.picker === 'qcPlan'" class="aw-line-icon line-search"></span>
                  <template v-else>选择</template>
                </button>
              </div>
              <div v-else-if="field.type === 'categoryPicker'" class="aw-field-row">
                <input class="aw-input" readonly :value="categoryDisplayValue(field)" :placeholder="field.placeholder || '请选择分类'" @click="openCategoryPicker(field)" />
                <button class="aw-tool-btn" type="button" @click="openCategoryPicker(field)">选择</button>
              </div>
              <div v-else-if="processFieldUnit(field.key)" class="rd-unit-field">
                <input v-model="genericForm[field.key]" class="aw-input" :type="field.type === 'number' ? 'number' : 'text'" :placeholder="field.placeholder || ''" :maxlength="field.maxLength" />
                <span>{{ processFieldUnit(field.key) }}</span>
              </div>
              <input v-else v-model="genericForm[field.key]" class="aw-input" :type="field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'" :placeholder="field.placeholder || ''" :maxlength="field.maxLength" />
        </div>
      </div>
    </section>

    <section v-for="table in createConfig.subTables || []" :key="table.key" class="aw-form-card">
        <div class="aw-detail-section-title">{{ table.title }}</div>
        <aw-editable-sub-table :columns="table.columns" :rows="genericSubTables[table.key] || []" :add-text="table.addText" :action-width="90" @add="addGenericRow(table.key, table.columns)">
          <template #cell="{ column, row, index }">
          <label v-if="column.type === 'switch'" class="rd-ios-switch">
            <input type="checkbox" role="switch" checked />
            <span></span>
          </label>
          <input v-else v-model="row[column.key]" class="aw-input" />
          </template>
        <template #actions="{ row }">
          <span v-if="showGenericRemove(table.key)" class="aw-link" style="color:var(--aw-danger)" @click="removeGenericRow(table.key, row.id)">删除</span>
        </template>
      </aw-editable-sub-table>
    </section>

    <section v-if="createTabs.length && isProcessCreate" class="aw-form-card rd-process-config-card">
      <div class="aw-tabs rd-process-tabs">
        <button v-for="tab in createTabs" :key="tab.key" :class="['t', { on: activeCreateTabKey === tab.key }]" type="button" @click="activeCreateTabKey = tab.key">{{ tab.label }}</button>
      </div>

      <div class="rd-process-tab-panel">
        <template v-if="activeCreateTabKey === 'station'">
          <div class="rd-process-table-wrap">
            <table class="aw-table rd-process-jsx-table">
              <thead><tr><th v-for="column in processTableColumns('stations')" :key="column.key" :style="{ width: column.width ? `${column.width}px` : undefined }">{{ column.title }}</th><th style="width:80px">操作</th></tr></thead>
              <tbody>
                <tr v-for="row in genericSubTables.stations || []" :key="row.id">
                  <td v-for="column in processTableColumns('stations')" :key="column.key" :class="{ 'aw-num': column.key === 'code' }">{{ row[column.key] }}</td>
                  <td><span class="aw-link rd-danger-link" @click="removeProcessRow('stations', row.id)">删除</span></td>
                </tr>
                <tr v-if="!(genericSubTables.stations || []).length"><td :colspan="processTableColspan('stations')" class="rd-process-empty-cell">暂未添加工位</td></tr>
              </tbody>
            </table>
          </div>
          <div class="rd-process-action-row"><button class="aw-btn" type="button" @click="openProcessPicker('station')">+ 添加工位</button></div>
        </template>

        <template v-else-if="activeCreateTabKey === 'hours'">
          <div class="rd-process-switch-row">
            <span>{{ processSwitchLabel('hours') }}</span>
            <span :class="['aw-switch', { off: !processSwitches.hours }]" role="switch" :aria-checked="processSwitches.hours" tabindex="0" @click="toggleProcessSwitch('hours')" @keydown.enter.prevent="toggleProcessSwitch('hours')" @keydown.space.prevent="toggleProcessSwitch('hours')" />
            <em>{{ processSwitches.hours ? '已开启' : '已关闭' }}</em>
          </div>
          <div v-if="processSwitches.hours" class="rd-process-hours-grid">
            <div v-for="field in processFieldsForTab('hours')" :key="field.key" class="aw-field">
              <label>{{ field.label }}</label>
              <div class="rd-unit-field">
                <input v-model="genericForm[field.key]" class="aw-input" type="number" placeholder="0" />
                <span>{{ processFieldUnit(field.key) }}</span>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeCreateTabKey === 'byproduct'">
          <div class="rd-process-switch-row">
            <span>{{ processSwitchLabel('byproduct') }}</span>
            <span :class="['aw-switch', { off: !processSwitches.byproduct }]" role="switch" :aria-checked="processSwitches.byproduct" tabindex="0" @click="toggleProcessSwitch('byproduct')" @keydown.enter.prevent="toggleProcessSwitch('byproduct')" @keydown.space.prevent="toggleProcessSwitch('byproduct')" />
            <em>{{ processSwitches.byproduct ? '已开启' : '已关闭' }}</em>
          </div>
          <template v-if="processSwitches.byproduct">
            <div class="rd-process-action-row is-top"><button class="aw-btn" type="button" @click="openProcessPicker('byproduct')">+ 选择副产品</button></div>
            <div v-if="(genericSubTables.byproducts || []).length" class="rd-process-table-wrap">
              <table class="aw-table rd-process-jsx-table">
                <thead><tr><th v-for="column in processTableColumns('byproducts')" :key="column.key" :style="{ width: column.width ? `${column.width}px` : undefined }">{{ column.title }}</th><th style="width:80px">操作</th></tr></thead>
                <tbody>
                  <tr v-for="row in genericSubTables.byproducts || []" :key="row.id">
                    <td v-for="column in processTableColumns('byproducts')" :key="column.key" :class="{ 'aw-num': column.key === 'code' }">
                      <span v-if="column.key === 'image'" class="rd-process-img-placeholder">图</span>
                      <template v-else>{{ row[column.key] }}</template>
                    </td>
                    <td><span class="aw-link rd-danger-link" @click="removeProcessRow('byproducts', row.id)">删除</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="rd-process-empty-box">暂未选择副产品，请点击上方按钮选择</div>
          </template>
        </template>

        <template v-else-if="activeCreateTabKey === 'params'">
          <div class="rd-process-table-wrap">
            <table class="aw-table rd-process-jsx-table">
              <thead><tr><th v-for="column in processTableColumns('params')" :key="column.key">{{ column.title }}</th><th style="width:80px">操作</th></tr></thead>
              <tbody>
                <tr v-for="row in genericSubTables.params || []" :key="row.id">
                  <td v-for="column in processTableColumns('params')" :key="column.key"><input v-model="row[column.key]" class="aw-input" :placeholder="column.key === 'name' ? '请输入参数名称' : '请输入参数值'" /></td>
                  <td><span v-if="showGenericRemove('params')" class="aw-link rd-danger-link" @click="removeProcessRow('params', row.id)">删除</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="rd-process-action-row"><button class="aw-btn" type="button" @click="addProcessParam">+ 添加参数</button></div>
        </template>

        <template v-else-if="activeCreateTabKey === 'qc'">
          <div class="rd-process-switch-row">
            <span>{{ processSwitchLabel('qc') }}</span>
            <span :class="['aw-switch', { off: !processSwitches.qc }]" role="switch" :aria-checked="processSwitches.qc" tabindex="0" @click="toggleProcessSwitch('qc')" @keydown.enter.prevent="toggleProcessSwitch('qc')" @keydown.space.prevent="toggleProcessSwitch('qc')" />
            <em>{{ processSwitches.qc ? '已开启' : '已关闭' }}</em>
          </div>
          <template v-if="processSwitches.qc">
            <div class="rd-process-help-text">选择当前工序执行时需要带出的制程质检 IPQC 方案。</div>
            <div v-if="(genericSubTables.qcPlans || []).length" class="rd-process-table-wrap">
              <table class="aw-table rd-process-jsx-table">
                <thead><tr><th v-for="column in processTableColumns('qcPlans')" :key="column.key" :style="{ width: column.width ? `${column.width}px` : undefined }">{{ column.title }}</th><th style="width:80px">操作</th></tr></thead>
                <tbody>
                  <tr v-for="row in genericSubTables.qcPlans || []" :key="row.id">
                    <td v-for="column in processTableColumns('qcPlans')" :key="column.key" :class="{ 'aw-num': column.key === 'code' }">
                      <span v-if="column.key === 'state'" :class="['aw-badge', row[column.key] === '启用' ? 'g' : 'y']">{{ row[column.key] }}</span>
                      <template v-else>{{ row[column.key] }}</template>
                    </td>
                    <td><span class="aw-link rd-danger-link" @click="removeProcessRow('qcPlans', row.id)">删除</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="rd-process-empty-box">暂未选择质检方案，请点击下方按钮添加 IPQC 质检方案</div>
            <div class="rd-process-action-row"><button class="aw-btn" type="button" @click="openProcessPicker('qc')">+ 添加质检方案</button></div>
          </template>
        </template>
      </div>
    </section>

    <section v-else-if="createTabs.length" class="aw-form-card rd-tab-card">
      <div class="aw-detail-tabs">
        <button v-for="tab in createTabs" :key="tab.key" :class="['aw-detail-tab', { on: activeCreateTabKey === tab.key }]" type="button" @click="activeCreateTabKey = tab.key">{{ tab.label }}</button>
      </div>
      <template v-if="activeCreateTab">
        <div v-if="activeProcessSwitchKey" class="rd-process-switch-row">
          <span>{{ processSwitchLabel(activeProcessSwitchKey) }}</span>
          <label class="aw-switch-line mini">
            <input :checked="isProcessSwitchOpen(activeProcessSwitchKey)" type="checkbox" @change="setProcessSwitchFromEvent(activeProcessSwitchKey, $event)" />
            <i></i>
          </label>
          <em>{{ isProcessSwitchOpen(activeProcessSwitchKey) ? '已开启' : '已关闭' }}</em>
        </div>

        <template v-if="!activeProcessSwitchKey || isProcessSwitchOpen(activeProcessSwitchKey)">
          <div v-for="section in activeCreateTab.sections || []" :key="section.title" class="rd-tab-section">
            <div class="aw-detail-section-title">{{ section.title }}</div>
            <div class="aw-form-grid">
              <div v-for="field in section.fields" :key="field.key" class="aw-field">
                <label :class="{ req: field.required }">{{ field.label }}</label>
                <select v-if="field.type === 'select'" v-model="genericForm[field.key]" class="aw-select">
                  <option value="">请选择</option>
                  <option v-for="option in field.options || []" :key="option">{{ option }}</option>
                </select>
                <textarea v-else-if="field.type === 'textarea'" v-model="genericForm[field.key]" class="aw-input rd-textarea" :placeholder="field.placeholder || ''" :maxlength="field.maxLength" />
                <input v-else-if="field.type === 'readonly'" class="aw-input" :value="genericForm[field.key] || field.placeholder || '自动生成'" disabled />
                <div v-else-if="field.type === 'person'" class="aw-field-row">
                  <input v-model="genericForm[field.key]" class="aw-input" readonly placeholder="点击选择人员" @click="openPersonPicker(field)" />
                  <button class="aw-tool-btn" type="button" @click="openPersonPicker(field)">选择</button>
                </div>
                <div v-else-if="field.type === 'picker'" class="aw-field-row">
                  <input v-model="genericForm[field.key]" class="aw-input" readonly :placeholder="field.placeholder || '点击选择'" @click="openGenericPicker(field.picker || 'product', 'generic', field)" />
                  <button class="aw-tool-btn" type="button" @click="openGenericPicker(field.picker || 'product', 'generic', field)">
                    <span v-if="field.picker === 'qcPlan'" class="aw-line-icon line-search"></span>
                    <template v-else>选择</template>
                  </button>
                </div>
                <div v-else-if="field.type === 'categoryPicker'" class="aw-field-row">
                  <input class="aw-input" readonly :value="categoryDisplayValue(field)" :placeholder="field.placeholder || '请选择分类'" @click="openCategoryPicker(field)" />
                  <button class="aw-tool-btn" type="button" @click="openCategoryPicker(field)">选择</button>
                </div>
                <div v-else-if="processFieldUnit(field.key)" class="rd-unit-field">
                  <input v-model="genericForm[field.key]" class="aw-input" :type="field.type === 'number' ? 'number' : 'text'" :placeholder="field.placeholder || ''" :maxlength="field.maxLength" />
                  <span>{{ processFieldUnit(field.key) }}</span>
                </div>
                <input v-else v-model="genericForm[field.key]" class="aw-input" :type="field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'" :placeholder="field.placeholder || ''" :maxlength="field.maxLength" />
              </div>
            </div>
          </div>

          <div v-for="table in activeCreateTab.subTables || []" :key="table.key" class="rd-tab-section">
            <div class="aw-detail-section-title">{{ table.title }}</div>
            <aw-editable-sub-table :columns="table.columns" :rows="genericSubTables[table.key] || []" :add-text="table.addText" :action-width="90" @add="addGenericRow(table.key, table.columns)">
              <template #cell="{ column, row, index }">
                <label v-if="column.type === 'switch'" class="rd-ios-switch">
                  <input type="checkbox" role="switch" checked />
                  <span></span>
                </label>
                <input v-else v-model="row[column.key]" class="aw-input" />
              </template>
              <template #actions="{ row }">
                <span v-if="showGenericRemove(table.key)" class="aw-link" style="color:var(--aw-danger)" @click="removeGenericRow(table.key, row.id)">删除</span>
              </template>
            </aw-editable-sub-table>
          </div>
        </template>
      </template>
    </section>

    <section v-if="createConfig.attachmentLabel !== null" class="aw-form-card">
      <div class="aw-detail-section-title">{{ createConfig.attachmentLabel || '附件' }}</div>
      <aw-attachment-table
        :rows="attachmentRows"
        :type-options="rdAttachmentTypeOptions"
        @add="addAttachment"
        @remove="removeAttachment"
        @upload="uploadAttachment"
      />
    </section>

    <section v-if="createConfig.richTextLabel !== null" class="aw-form-card">
      <div class="aw-detail-section-title">{{ createConfig.richTextSectionTitle || createConfig.richTextLabel || '说明' }}</div>
      <div v-if="createConfig.richTextFields?.length" class="aw-form-grid rd-rich-lead-grid">
        <div v-for="field in createConfig.richTextFields" :key="field.key" class="aw-field">
          <label :class="{ req: field.required }">{{ field.label }}</label>
          <select v-if="field.type === 'select'" v-model="genericForm[field.key]" class="aw-select">
            <option value="">请选择</option>
            <option v-for="option in field.options || []" :key="option">{{ option }}</option>
          </select>
          <textarea v-else-if="field.type === 'textarea'" v-model="genericForm[field.key]" class="aw-input rd-textarea" :placeholder="field.placeholder || ''" :maxlength="field.maxLength" />
          <input v-else-if="field.type === 'readonly'" class="aw-input" :value="genericForm[field.key] || field.placeholder || '自动生成'" disabled />
          <div v-else-if="field.type === 'person'" class="aw-field-row">
            <input v-model="genericForm[field.key]" class="aw-input" readonly placeholder="点击选择人员" @click="openPersonPicker(field)" />
            <button class="aw-tool-btn" type="button" @click="openPersonPicker(field)">选择</button>
          </div>
          <div v-else-if="field.type === 'picker'" class="aw-field-row">
            <input v-model="genericForm[field.key]" class="aw-input" readonly :placeholder="field.placeholder || '点击选择'" @click="openGenericPicker(field.picker || 'product', 'generic', field)" />
            <button class="aw-tool-btn" type="button" @click="openGenericPicker(field.picker || 'product', 'generic', field)">
              <span v-if="field.picker === 'qcPlan'" class="aw-line-icon line-search"></span>
              <template v-else>选择</template>
            </button>
          </div>
          <div v-else-if="field.type === 'categoryPicker'" class="aw-field-row">
            <input class="aw-input" readonly :value="categoryDisplayValue(field)" :placeholder="field.placeholder || '请选择分类'" @click="openCategoryPicker(field)" />
            <button class="aw-tool-btn" type="button" @click="openCategoryPicker(field)">选择</button>
          </div>
          <input v-else v-model="genericForm[field.key]" class="aw-input" :type="field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'" :placeholder="field.placeholder || ''" :maxlength="field.maxLength" />
        </div>
      </div>
      <aw-rich-text-editor v-model="genericDetail" />
    </section>
    <div v-if="submitMessage" class="aw-form-note">{{ submitMessage }}</div>
  </aw-form-page>

  <aw-list-page v-else>
    <template v-if="!isSubstituteList && activeConfig.treeNodes?.length" #tree>
      <aw-resource-tree v-model="pickedTree" :title="activeConfig.treeTitle || activeConfig.title" :total="rows.length" :nodes="activeConfig.treeNodes" />
    </template>

    <aw-list-toolbar :search-placeholder="toolbarPlaceholder" :create-label="toolbarCreateLabel" @search="keyword = $event" @refresh="load" @create="openCreate" />
    <aw-data-table
      :columns="displayColumns"
      :rows="filteredRows"
      :total="filteredRows.length"
      :bulk-actions="activeConfig.bulkActions"
      :filter-values="columnFilters"
      :fit-width="fitWidth"
      @column-filter="setColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'state'" :class="['aw-status', String(record.tone || statusTone(value))]">{{ value }}</span>
        <span v-else-if="column.key === 'image'" class="rd-thumb">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="readonlyDetailNotice(record)">{{ value }}</span>
        <span v-else-if="column.link" class="aw-link" @click="readonlyDetailNotice(record)">{{ value }}</span>
        <span v-else>{{ value }}</span>
      </template>
    </aw-data-table>
    <div v-if="notice" class="aw-form-note">{{ notice }}</div>
  </aw-list-page>

  <div v-if="projectModal" class="aw-mask" @click="closeProjectModal">
    <div :class="['aw-modal', { lg: ['bomRef', 'bomAdd', 'processRef'].includes(projectModal), 'rd-project-route-modal': projectModal === 'processAdd' }, 'rd-project-modal']" @click.stop>
      <div class="head">
        <div><span class="aw-modal-title">{{ projectModalTitle }}</span><span class="aw-modal-sub">项目详情页内操作</span></div>
        <button class="aw-modal-close" type="button" @click="closeProjectModal">×</button>
      </div>
      <div class="body">
        <template v-if="projectModal === 'bomRef'">
          <div class="rd-project-picker">
            <aside class="aw-doc-tree">
              <button v-for="(name, index) in ['全部BOM', '成品BOM', '半成品BOM', '工程BOM', '虚拟BOM']" :key="name" :class="['aw-tree-row', 'aw-tree-l2', { on: index === 0 }]" type="button">
                <span>{{ index === 0 ? '▾' : '' }}</span><span>{{ name }}</span>
              </button>
            </aside>
            <section class="rd-project-picker-main">
              <div class="rd-project-search"><input class="aw-input" placeholder="搜索BOM编号、BOM名称、适用产品" /></div>
              <table class="aw-table">
                <thead><tr><th style="width:46px"></th><th>BOM编号</th><th>BOM名称</th><th>适用产品</th><th>分类</th><th>版本</th><th>状态</th></tr></thead>
                <tbody>
                  <tr v-for="(row, index) in [['BOM-STD-001','标准输送线BOM','智能输送线系统','成品BOM','V3.2','已发布'], ['BOM-STD-002','半成品模组BOM','半成品模组','半成品BOM','V2.1','已发布'], ['BOM-STD-003','工程试制BOM','新品试制','工程BOM','V0.9','待审核']]" :key="row[0]" :class="{ picked: index === 0 }">
                    <td><input type="radio" :checked="index === 0" /></td>
                    <td v-for="cell in row" :key="cell">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </template>

        <template v-else-if="projectModal === 'bomAdd'">
          <section class="rd-project-modal-section">
            <div class="aw-detail-section-title">BOM基础信息</div>
            <div class="aw-form-grid">
              <div class="aw-field"><label class="req">BOM名称</label><input class="aw-input" value="智能输送线项目BOM" /></div>
              <div class="aw-field"><label class="req">适用产品</label><input class="aw-input" value="智能输送线系统" /></div>
              <div class="aw-field"><label>版本号</label><input class="aw-input" value="V1.0" /></div>
              <div class="aw-field"><label>BOM分类</label><select class="aw-select"><option>项目BOM</option><option>成品BOM</option><option>工程BOM</option></select></div>
              <div class="aw-field"><label>来源</label><input class="aw-input" value="项目新增" readonly /></div>
              <div class="aw-field"><label>锁定状态</label><input class="aw-input" value="未锁定" readonly /></div>
            </div>
          </section>
          <section class="rd-project-modal-section">
            <div class="aw-detail-section-title">BOM明细</div>
            <table class="aw-table">
              <thead><tr><th>序号</th><th>层级</th><th>物料编码</th><th>物料名称</th><th>规格型号</th><th>单位</th><th>用量</th><th>损耗率</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="row in [['1','1','WL-7820864','半成品物料','规格一','KG','500','2%'], ['2','1.1','WL-8518691','铝合金型材','AL-6061','KG','320','3%']]" :key="row[0]">
                  <td v-for="cell in row" :key="cell">{{ cell }}</td><td><span class="aw-link">调整</span></td>
                </tr>
                <tr><td colspan="9"><span class="aw-link">+ 添加子件</span></td></tr>
              </tbody>
            </table>
          </section>
        </template>

        <template v-else-if="projectModal === 'bomImport'">
          <div class="rd-project-upload">
            <strong>上传项目 BOM Excel</strong>
            <span>支持 .xlsx / .xls，导入后可在项目内逐项修正。</span>
          </div>
        </template>

        <template v-else-if="projectModal === 'processRef'">
          <div class="rd-project-picker">
            <aside class="aw-doc-tree">
              <button v-for="(name, index) in ['全部工艺', '电子装配', '机加工', '焊接', '表面处理', '包装']" :key="name" :class="['aw-tree-row', 'aw-tree-l2', { on: index === 0 }]" type="button">
                <span>{{ index === 0 ? '▾' : '' }}</span><span>{{ name }}</span>
              </button>
            </aside>
            <section class="rd-project-picker-main">
              <div class="rd-project-search"><input class="aw-input" placeholder="搜索工艺编号、工艺名称、适用产品" /></div>
              <table class="aw-table">
                <thead><tr><th style="width:46px"></th><th>工艺编号</th><th>工艺名称</th><th>适用产品</th><th>分类</th><th>版本</th><th>状态</th></tr></thead>
                <tbody>
                  <tr v-for="(row, index) in [['CRAFT-STD-001','标准总装工艺','智能输送线系统','电子装配','V1.8','已发布'], ['CRAFT-STD-002','机加工工艺','铝合金外壳','机加工','V2.0','已发布'], ['CRAFT-STD-003','焊接检验工艺','控制板组件','焊接','V1.2','待审核']]" :key="row[0]" :class="{ picked: index === 0 }">
                    <td><input type="radio" :checked="index === 0" /></td>
                    <td v-for="cell in row" :key="cell">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </template>

        <template v-else-if="projectModal === 'processAdd'">
          <div class="rd-project-route-editor">
            <aside class="rd-project-route-palette">
              <div class="rd-route-palette-head">工序模板 <span>点击加入画布</span></div>
              <div class="rd-route-search"><span>⌕</span><input v-model="projectCraftKeyword" placeholder="搜索工序" /></div>
              <div class="rd-route-tabs">
                <button :class="{ on: projectCraftPaletteTab === 'in' }" type="button" @click="projectCraftPaletteTab = 'in'">自制</button>
                <button :class="{ on: projectCraftPaletteTab === 'out' }" type="button" @click="projectCraftPaletteTab = 'out'">委外</button>
              </div>
              <div class="rd-route-template-list">
                <div v-for="group in projectCraftGroupedTemplates" :key="group.name" class="rd-route-group">
                  <div class="rd-route-group-head">{{ group.name }} <span>{{ group.list.length }}</span></div>
                  <button v-for="template in group.list" :key="template.key" class="rd-route-template-card" type="button" @click="addProjectRouteOp(template)">
                    <i :class="template.type">{{ template.icon }}</i>
                    <span><b>{{ template.name }}</b><em>{{ template.category }} · {{ template.setupTime + template.runTime }} 分钟</em></span>
                  </button>
                </div>
                <div v-if="!projectCraftGroupedTemplates.length" class="rd-project-empty-text">没有匹配的工序模板</div>
              </div>
            </aside>

            <main class="rd-project-route-canvas">
              <div class="rd-route-canvas-bar">
                <span><i class="sw in" /> 自制</span>
                <span><i class="sw out" /> 委外</span>
                <span><i class="sw seq" /> 串序</span>
                <span><i class="sw par" /> 并序</span>
                <div class="rd-route-zoom"><button type="button">−</button><span>100%</span><button type="button">+</button><button type="button">适配</button></div>
              </div>
              <div class="rd-route-flow">
                <div class="rd-route-start"><span>开始</span><i /></div>
                <template v-for="(op, index) in projectRouteOps" :key="op.id">
                  <button :class="['rd-route-op-card', op.type, { selected: projectSelectedRouteOpId === op.id }]" type="button" @click="projectSelectedRouteOpId = op.id">
                    <span class="no">{{ index + 1 }}</span>
                    <div class="head"><b>{{ op.code }}</b><strong>{{ op.name }}</strong><em @click.stop="removeProjectRouteOp(op.id)">×</em></div>
                    <p>{{ op.type === 'out' ? '委外厂商' : '工作中心' }}：{{ op.workCenter }}</p>
                    <p>工时：{{ op.setupTime + op.runTime }} min · {{ op.qcRequired ? '需检验' : '随机抽检' }}</p>
                  </button>
                  <div class="rd-route-line"><i /></div>
                </template>
                <button class="rd-route-add" type="button">+ 拖入新工序</button>
              </div>
            </main>

            <aside v-if="projectSelectedRouteOp" class="rd-project-route-props">
              <div class="rd-route-props-head">
                <span :class="['type', projectSelectedRouteOp.type]">{{ projectSelectedRouteOp.type === 'in' ? '自制' : '委外' }}</span>
                <strong>{{ projectSelectedRouteOp.name }}</strong>
                <em>{{ projectSelectedRouteOp.code }}</em>
              </div>
              <div class="rd-route-props-tabs"><span class="on">基础</span><span>工位</span><span>工时</span><span>质检</span><span>备注</span></div>
              <div class="rd-route-props-body">
                <label>工序编号<input class="aw-input" :value="projectSelectedRouteOp.code" disabled /></label>
                <label>工序名称<input class="aw-input" :value="projectSelectedRouteOp.name" disabled /></label>
                <label>工序分类<input class="aw-input" :value="projectSelectedRouteOp.category" disabled /></label>
                <label>工序类型<select v-model="projectSelectedRouteOp.type" class="aw-select"><option value="in">自制工序</option><option value="out">委外工序</option></select></label>
                <label>工作中心<input v-model="projectSelectedRouteOp.workCenter" class="aw-input" /></label>
                <label>准备工时<input v-model.number="projectSelectedRouteOp.setupTime" class="aw-input" type="number" /></label>
                <label>单件工时<input v-model.number="projectSelectedRouteOp.runTime" class="aw-input" type="number" /></label>
                <label>质检方案<select v-model="projectSelectedRouteOp.qcRequired" class="aw-select"><option :value="true">开启</option><option :value="false">关闭</option></select></label>
              </div>
              <div class="rd-route-props-foot">
                <span class="aw-link danger" @click="removeProjectRouteOp(projectSelectedRouteOp.id)">移除此工序</span>
                <button class="aw-btn primary" type="button">应用</button>
              </div>
            </aside>
          </div>
          <div class="rd-project-route-summary">
            <span>工序总数：{{ projectRouteStats.totalOps }}</span>
            <span>自制：{{ projectRouteStats.inOps }}</span>
            <span>委外：{{ projectRouteStats.outOps }}</span>
            <span>预计时长：{{ (projectRouteStats.totalMin / 60).toFixed(1) }}h</span>
          </div>
        </template>

        <template v-else-if="projectModal === 'quoteAdd'">
          <div class="aw-form-grid single">
            <div class="aw-field"><label class="req">成本项</label><input class="aw-input" value="项目管理费" /></div>
            <div class="aw-field"><label class="req">金额</label><input class="aw-input" value="¥ 60,000.00" /></div>
            <div class="aw-field"><label>说明</label><input class="aw-input" value="手动录入的项目成本项" /></div>
          </div>
        </template>

        <template v-else-if="projectModal === 'projectCostAdd'">
          <div class="aw-form-grid single">
            <div class="aw-field"><label class="req">成本类型</label><input class="aw-input" value="外协费" /></div>
            <div class="aw-field"><label class="req">金额</label><input class="aw-input" value="¥ 3,000.00" /></div>
            <div class="aw-field"><label>发生日期</label><input class="aw-input" value="2026-06-20" /></div>
            <div class="aw-field"><label>责任人</label><input class="aw-input" :value="projectOwnerName" /></div>
            <div class="aw-field"><label>成本说明</label><input class="aw-input" value="项目执行过程中的外协加工费用" /></div>
          </div>
        </template>
      </div>
      <div class="foot">
        <button class="aw-tool-btn" type="button" @click="closeProjectModal">取消</button>
        <button class="aw-btn primary" type="button" :disabled="!projectCanConfirmModal" @click="confirmProjectModal">{{ projectModalPrimaryText }}</button>
      </div>
    </div>
  </div>

  <div v-if="pickerOpen" class="aw-mask">
    <div class="aw-modal lg">
      <div class="head">
        <div><span class="aw-modal-title">{{ pickerTitle }}</span><span class="aw-modal-sub">选择后自动回填编号、名称和相关字段</span></div>
        <button class="aw-modal-close" type="button" @click="closeGenericPicker">×</button>
      </div>
      <div class="body">
        <div v-if="pickerType === 'source' || pickerType === 'supplier'" class="rd-source-picker">
          <aside class="aw-picker-side rd-source-picker-side">
            <div class="aw-picker-search">
              <span class="aw-line-icon line-search"></span>
              <input :placeholder="pickerType === 'supplier' ? '搜索供应商' : '搜索客户'" />
            </div>
            <button
              v-for="category in sourcePickerCategories"
              :key="category"
              :class="['aw-picker-tree-row', { on: activeSourceCategory === category }]"
              type="button"
              @click="activeSourceCategory = category"
            >
              <span>{{ category === '全部客户' ? '▣' : '' }}</span>{{ category }}
            </button>
          </aside>
          <section class="aw-picker-main rd-source-picker-main">
            <div class="aw-picker-title">
              <strong>{{ activeSourceCategory }}</strong>
              <span>共 {{ visibleSourcePickerRows.length }} 个{{ pickerType === 'supplier' ? '供应商' : '客户' }}</span>
            </div>
            <table class="aw-doc-tbl">
              <thead><tr><th style="width:44px">选择</th><th>{{ pickerType === 'supplier' ? '供应商编号' : '客户编号' }}</th><th>{{ pickerType === 'supplier' ? '供应商名称' : '客户名称' }}</th><th>{{ pickerType === 'supplier' ? '供应商分类' : '客户分类' }}</th><th>负责人</th><th>说明</th></tr></thead>
              <tbody>
                <tr v-for="item in visibleSourcePickerRows" :key="item.id" :class="{ picked: pickerPicked?.id === item.id }" @click="pickerPicked = item">
                  <td><input type="radio" :checked="pickerPicked?.id === item.id" /></td>
                  <td>{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.category || '-' }}</td>
                  <td>{{ item.owner || '-' }}</td>
                  <td>{{ item.extra || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <table v-else class="aw-doc-tbl">
          <thead><tr><th style="width:44px">选择</th><th>编码</th><th>名称</th><th>分类</th><th>品牌</th><th>型号/规格</th><th>单位</th><th>说明</th></tr></thead>
          <tbody>
            <tr v-for="item in pickerRows" :key="item.id" :class="{ picked: pickerPicked?.id === item.id }" @click="pickerPicked = item">
              <td><input type="radio" :checked="pickerPicked?.id === item.id" /></td>
              <td>{{ item.code }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.category || '-' }}</td>
              <td>{{ item.brand || '-' }}</td>
              <td>{{ item.model || '-' }}</td>
              <td>{{ item.unit || '-' }}</td>
              <td>{{ item.extra || item.owner || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="foot">
        <button class="aw-tool-btn" type="button" @click="closeGenericPicker">取消</button>
        <button class="aw-btn primary" type="button" @click="confirmGenericPicker">确定</button>
      </div>
    </div>
  </div>

  <aw-category-picker-modal
    :open="businessCategoryPickerOpen"
    :title="businessCategoryPickerTitle"
    :groups="businessCategoryGroups"
    :default-parent-key="businessCategoryDefaultParentKey"
    :default-child-key="businessCategoryDefaultChildKey"
    @cancel="closeBusinessCategoryPicker"
    @confirm="confirmBusinessCategoryPicker"
  />

  <div v-if="docCategoryPickerOpen" class="aw-mask">
    <div class="aw-modal lg rd-doc-category-modal">
      <div class="head">
        <div><span class="aw-modal-title">选择文档分类</span><span class="aw-modal-sub">左侧一级分类，右侧二级分类列表；确认后回填所属分类</span></div>
        <button class="aw-modal-close" type="button" @click="closeDocCategoryPicker">×</button>
      </div>
      <div class="body">
        <div class="rd-doc-category-picker">
          <aside class="aw-doc-tree rd-doc-category-tree">
            <div class="aw-doc-tree-list">
              <button
                v-for="group in docCategoryGroups"
                :key="group.key"
                :class="['aw-tree-row', 'aw-tree-l2', { on: activeDocCategoryRoot === group.key }]"
                type="button"
                @click="selectDocCategoryRoot(group.key)"
              >
                <span class="aw-tree-icon">▾</span>
                <span>{{ group.name }}</span>
                <em>({{ group.rows.length }})</em>
              </button>
            </div>
          </aside>
          <section class="rd-doc-category-main">
            <div class="rd-doc-category-head">
              <div>
                <strong>{{ activeDocCategoryGroup?.name || '文档分类' }}</strong>
                <span>选择当前一级分类下的二级分类</span>
              </div>
              <span v-if="pickedDocCategory" class="rd-muted">已选：{{ pickedDocCategory.parentName }} / {{ pickedDocCategory.name }}</span>
            </div>
            <div class="aw-doc-tbl-inner rd-doc-category-table-wrap">
              <table class="aw-doc-tbl">
                <thead>
                  <tr>
                    <th style="width:54px">选择</th>
                    <th>分类名称</th>
                    <th>上级分类</th>
                    <th>分类编码</th>
                    <th style="width:90px">排序</th>
                    <th style="width:90px">状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in activeDocCategoryGroup?.rows || []"
                    :key="row.id"
                    :class="{ picked: pickedDocCategory?.id === row.id }"
                    @click="pickedDocCategory = row"
                  >
                    <td><input type="radio" :checked="pickedDocCategory?.id === row.id" /></td>
                    <td>{{ row.name }}</td>
                    <td>{{ row.parentName }}</td>
                    <td>{{ row.code }}</td>
                    <td>{{ row.sort }}</td>
                    <td><span :class="['aw-badge', row.enabled ? 'g' : 'y']">{{ row.enabled ? '启用' : '停用' }}</span></td>
                  </tr>
                  <tr v-if="!(activeDocCategoryGroup?.rows || []).length">
                    <td colspan="6" class="aw-empty-cell">当前一级分类暂无二级分类</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
      <div class="foot">
        <button class="aw-tool-btn" type="button" @click="closeDocCategoryPicker">取消</button>
        <button class="aw-btn primary" type="button" @click="confirmDocCategoryPicker">确定</button>
      </div>
    </div>
  </div>

  <div v-if="processPickerOpen" class="aw-mask" @click="closeProcessPicker">
    <div :class="['aw-modal', 'lg', 'rd-process-picker-modal', { 'is-qc': processPickerOpen === 'qc' }]" @click.stop>
      <div class="head">
        <div><span class="aw-modal-title">{{ processPickerTitle }}</span><span class="aw-modal-sub">{{ processPickerSubtitle }}</span></div>
        <button class="aw-modal-close" type="button" @click="closeProcessPicker">×</button>
      </div>
      <div class="body">
        <div :class="['rd-process-picker-layout', { 'with-tree': processPickerOpen === 'qc' }]">
          <aside v-if="processPickerOpen === 'qc'" class="aw-doc-tree rd-process-picker-tree">
            <div class="aw-doc-tree-list">
              <button v-for="(item, index) in processQcPickerGroups" :key="item" :class="['aw-tree-row', 'aw-tree-l2', { on: index === 0 }]" type="button">{{ item }}</button>
            </div>
          </aside>
          <section class="rd-process-picker-main">
            <div class="rd-process-picker-toolbar">
              <span>已勾选 {{ processPickerSelectedCount }} 项</span>
              <div class="rd-process-picker-search">
                <span>⌕</span>
                <input v-model="processPickerKeyword" :placeholder="processPickerSearchPlaceholder" />
              </div>
            </div>
            <div class="aw-doc-tbl-inner rd-process-picker-table-wrap">
              <table class="aw-doc-tbl rd-process-picker-table" :style="{ minWidth: processPickerOpen === 'qc' ? '980px' : undefined }">
                <thead>
                  <tr>
                    <th style="width:48px"><div class="aw-th-inner rd-center"><span :class="['aw-chk', { on: processPickerAllChecked, indet: processPickerIndeterminate }]" @click.stop="toggleProcessPickerAll" /></div></th>
                    <th v-if="processPickerOpen === 'byproduct'" style="width:60px"><div class="aw-th-inner">图片</div></th>
                    <th v-for="column in processPickerColumns" :key="column.key" :style="{ width: column.width ? `${column.width}px` : undefined }"><div class="aw-th-inner">{{ column.title }}</div></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in processPickerRows" :key="processPickerRowCode(row)" @click="toggleProcessPickerRow(row)">
                    <td class="rd-center"><span :class="['aw-chk', { on: processPickerSelected[processPickerRowCode(row)] }]" /></td>
                    <td v-if="processPickerOpen === 'byproduct'"><span class="rd-process-img-placeholder">图</span></td>
                    <td v-for="column in processPickerColumns" :key="column.key" :class="{ 'aw-num': column.key === 'code' }">
                      <span v-if="column.key === 'state'" :class="['aw-badge', processPickerCell(row, column.key) === '启用' ? 'g' : 'y']">{{ processPickerCell(row, column.key) }}</span>
                      <template v-else>{{ processPickerCell(row, column.key) }}</template>
                    </td>
                  </tr>
                  <tr v-if="!processPickerRows.length"><td :colspan="processPickerColspan" class="rd-process-empty-cell">暂无匹配数据</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
      <div class="foot">
        <button class="aw-tool-btn" type="button" @click="closeProcessPicker">取消</button>
        <button class="aw-btn primary" type="button" @click="confirmProcessPicker">确定</button>
      </div>
    </div>
  </div>

  <aw-person-picker-modal
    :open="personPickerOpen"
    :title="personPickerTitle"
    :depts="rdPeopleDepts"
    :picked="pickedPeople"
    @cancel="closePersonPicker"
    @confirm="confirmPeople"
  />

  <div v-if="showStructureModal" class="aw-mask">
    <div class="aw-modal rd-structure-wide bn-config-modal">
      <div class="head bn-config-modal-head">
        <div><span class="aw-modal-title bn-config-modal-title">配置物料清单</span><span class="aw-modal-sub bn-config-modal-sub">维护父子件层级、用量、损耗、替代料、适用型号和工序关联。</span></div>
        <button class="aw-modal-close" type="button" @click="showStructureModal = false">×</button>
      </div>
      <div class="body bn-config-modal-body">
        <div class="bn-create-steps">
          <div class="bn-step-track">
            <div v-for="step in bomStepStates" :key="step.label" :class="['bn-step', { done: step.done, current: step.current }]">
              <span class="dot">{{ step.done ? '✓' : step.index }}</span>
              <div><div class="name">{{ step.label }}</div></div>
            </div>
          </div>
        </div>
        <div class="bn-variant-card">
          <div class="bn-variant-group">
            <span class="bn-variant-label">当前预览型号：</span>
            <button v-for="model in bomModelOptions" :key="model" :class="['rd-chip', { on: bomSpec.model === model }]" type="button" @click="bomSpec.model = model">{{ model }}</button>
          </div>
        </div>
        <div :class="['bn-editor', { 'with-panel': selectedBomNode }]">
          <div class="bn-table-wrap">
            <div class="bn-editor-h">
              <div>
                <div class="section-title">BOM 结构</div>
                <div class="rd-muted">按销售下单型号过滤适用料，维护替代料与工艺关联</div>
              </div>
              <div class="rd-table-toolbar">
                <button class="aw-tool-btn" type="button" @click="addBomRoot">+ 根物料</button>
                <button class="aw-tool-btn" type="button" @click="addBomChild(selectedBomNodeId)">+ 子项</button>
                <button class="aw-tool-btn" type="button" @click="addBomSibling(selectedBomNodeId)">+ 同级</button>
                <button class="aw-tool-btn" type="button" @click="showAttrModal = true">属性配置</button>
                <button class="aw-tool-btn" type="button" @click="showImportModal = true">从 Excel 导入</button>
              </div>
            </div>
            <div class="bn-table-scroll">
              <table class="bn-table rd-bom-table">
                <thead>
                  <tr>
                    <th style="width:46px">☐ 选</th>
                    <th style="width:112px">行号</th>
                    <th style="width:230px">物料</th>
                    <th style="width:180px">适用型号</th>
                    <th style="width:88px">用量</th>
                    <th style="width:80px">单位</th>
                    <th style="width:100px">物料类型</th>
                    <th style="width:150px">替代料</th>
                    <th style="width:88px">损耗%</th>
                    <th style="width:90px">毛用量</th>
                    <th style="width:130px">关联工序</th>
                    <th style="width:90px">单价</th>
                    <th style="width:100px">小计</th>
                    <th v-for="attr in visibleBomAttrs" :key="attr.key" style="width:110px">{{ attr.label }}</th>
                    <th style="width:120px">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!bomRows.length">
                    <td :colspan="14 + visibleBomAttrs.length">
                      <div class="bn-empty-builder">
                        <div class="bn-empty-title">BOM 清单还是空的</div>
                        <div class="bn-empty-text">从根物料开始，一层一层添加子件；也可以从 Excel 导入后再逐项修正。</div>
                        <div class="bn-empty-actions">
                          <button class="aw-btn primary" type="button" @click="addBomRoot">+ 添加根物料</button>
                          <button class="aw-tool-btn" type="button" @click="showImportModal = true">从 Excel 导入</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="row in bomRows" :key="row.id" :class="{ selected: selectedBomNodeId === row.id, inactive: !row.active }" @click="selectedBomNodeId = row.id">
                    <td><input type="checkbox" :checked="checkedBomRows[row.id]" @click.stop="checkedBomRows[row.id] = !checkedBomRows[row.id]" /></td>
                    <td>
                      <span class="rd-row-no" :style="{ paddingLeft: `${row.level * 14}px` }">
                        <button v-if="row.hasChildren" class="rd-caret" type="button" @click.stop="toggleBomCollapse(row.id)">{{ collapsedBomRows[row.id] ? '▸' : '▾' }}</button>
                        <span v-else class="rd-caret empty" />
                        {{ row.no }}
                      </span>
                    </td>
                    <td>
                      <button class="rd-material-btn" type="button" @click.stop="openBomMaterialPicker(row.id)">
                        <b>{{ row.node.name || '请选择物料' }}</b><span>{{ row.node.code || '点击选择' }}</span>
                      </button>
                    </td>
                    <td>
                      <button v-for="model in bomVariantOptions" :key="model" :class="['rd-chip tiny', { on: isBomVariantOn(row.node, model) }]" type="button" @click.stop="toggleBomVariant(row.node, model)">{{ model }}</button>
                    </td>
                    <td><input v-model="row.node.qty" class="aw-input rd-num-input" type="number" /></td>
                    <td><select v-model="row.node.unit" class="aw-select rd-small-select"><option v-for="unit in bomUnitOptions" :key="unit">{{ unit }}</option></select></td>
                    <td><select v-model="row.node.type" class="aw-select rd-small-select"><option v-for="type in bomTypeOptions" :key="type">{{ type }}</option></select></td>
                    <td>
                      <span v-if="row.node.alts?.length" class="rd-alt">主料 + {{ row.node.alts.length }} 个备选</span>
                      <span v-else class="rd-muted">无</span>
                    </td>
                    <td><input v-model="row.node.loss" class="aw-input rd-num-input" type="number" /></td>
                    <td>{{ bomGross(row.node).toFixed(3) }}</td>
                    <td><select v-model="row.node.processOp" class="aw-select rd-process-select"><option value="">未关联</option><option v-for="op in bomProcessOps" :key="op.code" :value="op.code">{{ op.code }} {{ op.name }}</option></select></td>
                    <td><input v-model="row.node.price" class="aw-input rd-num-input" type="number" /></td>
                    <td>¥ {{ bomNodeSubtotal(row.node).toFixed(2) }}</td>
                    <td v-for="attr in visibleBomAttrs" :key="attr.key"><input v-model="row.node.customAttrs![attr.key]" class="aw-input rd-attr-input" /></td>
                    <td>
                      <span class="aw-link" @click.stop="addBomChild(row.id)">子项</span>
                      <span class="aw-link" @click.stop="addBomSibling(row.id)">同级</span>
                      <span class="aw-link" style="color:var(--aw-danger)" @click.stop="removeBomNode(row.id)">删除</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <aside v-if="selectedBomNode" class="bn-props rd-bom-props">
            <div class="bn-props-h rd-props-head"><strong>{{ selectedBomNode.name || '请选择物料' }}</strong><span class="code">{{ selectedBomNode.code || '未选择物料' }}</span><button class="close" type="button" @click="selectedBomNodeId = ''">×</button></div>
            <div class="aw-detail-tabs">
              <button v-for="tabItem in bomPropTabs" :key="tabItem.key" :class="['aw-detail-tab', { on: bomPropTab === tabItem.key }]" type="button" @click="bomPropTab = tabItem.key">{{ tabItem.label }}</button>
            </div>
            <div v-if="bomPropTab === 'basic'" class="bn-props-body rd-prop-grid">
              <label>物料编码<input v-model="selectedBomNode.code" class="aw-input" /></label>
              <label>名称<input v-model="selectedBomNode.name" class="aw-input" /></label>
              <label>物料类型<select v-model="selectedBomNode.type" class="aw-select"><option v-for="type in bomTypeOptions" :key="type">{{ type }}</option></select></label>
              <label>单位<input v-model="selectedBomNode.unit" class="aw-input" /></label>
              <label>用量<input v-model="selectedBomNode.qty" class="aw-input" type="number" /></label>
              <label>损耗%<input v-model="selectedBomNode.loss" class="aw-input" type="number" /></label>
              <label>毛用量<input class="aw-input" :value="bomGross(selectedBomNode).toFixed(3)" readonly /></label>
              <label>单价<input v-model="selectedBomNode.price" class="aw-input" type="number" /></label>
              <label>关联工序<select v-model="selectedBomNode.processOp" class="aw-select"><option value="">请选择</option><option v-for="op in bomProcessOps" :key="op.code" :value="op.code">{{ op.code }} {{ op.name }}</option></select></label>
              <label>备注<textarea v-model="selectedBomNode.remark" class="aw-input rd-textarea" /></label>
            </div>
            <div v-else-if="bomPropTab === 'attrs'" class="bn-props-body rd-prop-grid">
              <label v-for="attr in enabledBomAttrs" :key="attr.key">{{ attr.label }}<input v-model="selectedBomNode.customAttrs![attr.key]" class="aw-input" /></label>
            </div>
            <div v-else-if="bomPropTab === 'alts'" class="bn-props-body rd-alt-list">
              <div class="rd-alt-row"><input :value="`★ ${selectedBomNode.name}`" class="aw-input" readonly /><input value="P1" class="aw-input" readonly /></div>
              <div v-for="(alt, index) in selectedBomNode.alts || []" :key="index" class="rd-alt-row">
                <input v-model="alt.name" class="aw-input" />
                <input v-model="alt.priority" class="aw-input" type="number" />
                <span class="aw-link" style="color:var(--aw-danger)" @click="removeBomAlt(index)">删除</span>
              </div>
              <button class="aw-tool-btn" type="button" @click="addBomAlt">+ 添加替代料</button>
            </div>
            <div v-else class="bn-props-body rd-change-list">
              <div v-for="(log, index) in selectedBomNode.logs || []" :key="index"><b>{{ log.v }}</b> {{ log.text }}</div>
              <div v-if="!selectedBomNode.logs?.length" class="rd-muted">暂无变更</div>
            </div>
            <div class="bn-props-foot">
              <span class="aw-link" style="color:var(--aw-danger)" @click="removeBomNode(selectedBomNode.id)">移除此项</span>
              <button class="aw-btn primary" type="button">应用</button>
            </div>
          </aside>
        </div>
        <div v-if="selectedBomCount" class="rd-bom-batch">
          <span>已选 {{ selectedBomCount }} 项</span>
          <button class="aw-tool-btn" type="button" @click="applyBomBatch('qty')">批量改用量</button>
          <button class="aw-tool-btn" type="button" @click="applyBomBatch('replace')">批量替换</button>
          <button class="aw-tool-btn" type="button" @click="applyBomBatch('copy')">批量复制</button>
          <button class="aw-tool-btn" type="button" @click="applyBomBatch('move')">批量移动</button>
          <button class="aw-tool-btn danger" type="button" @click="applyBomBatch('delete')">批量删除</button>
          <span v-if="bomBatchNotice" class="rd-muted">{{ bomBatchNotice }}</span>
        </div>
      </div>
      <div class="foot bn-config-modal-foot">
        <span class="rd-muted">已选 {{ selectedBomCount }} 项</span>
        <button class="aw-tool-btn" type="button" @click="showStructureModal = false">取消</button>
        <button class="aw-btn primary" type="button" @click="showStructureModal = false">确定</button>
      </div>
    </div>
  </div>

  <div v-if="bomMaterialPickerOpen" class="aw-mask">
    <div class="aw-modal lg rd-material-modal">
      <div class="head">
        <div><span class="aw-modal-title">选择物料</span><span class="aw-modal-sub">支持分类侧栏、搜索与多选；确认后回填物料编码、名称、规格、类型、单位、单价</span></div>
        <button class="aw-modal-close" type="button" @click="closeBomMaterialPicker">×</button>
      </div>
      <div class="body rd-material-picker">
        <aside class="rd-material-cats">
          <button v-for="category in bomMaterialCategories" :key="category" :class="['rd-picker-tree-row', { on: bomMaterialCategory === category }]" type="button" @click="bomMaterialCategory = category">{{ category }}</button>
        </aside>
        <section class="rd-material-main">
          <div class="rd-picker-search">
            <input v-model="bomMaterialKeyword" class="aw-input" placeholder="搜索物料编码、名称、规格" />
            <span class="rd-muted">已选 {{ pickedBomMaterials.length }} 项</span>
          </div>
          <table class="aw-doc-tbl">
            <thead><tr><th style="width:44px">选择</th><th>物料编码</th><th>物料名称</th><th>分类</th><th>规格</th><th>类型</th><th>单位</th><th>单价</th></tr></thead>
            <tbody>
              <tr v-for="material in filteredBomMaterialPool" :key="material.code" :class="{ picked: isBomMaterialPicked(material) }" @click="toggleBomMaterialPick(material)">
                <td><input type="checkbox" :checked="isBomMaterialPicked(material)" /></td>
                <td>{{ material.code }}</td>
                <td>{{ material.name }}</td>
                <td>{{ material.category }}</td>
                <td>{{ material.spec }}</td>
                <td>{{ material.type }}</td>
                <td>{{ material.unit }}</td>
                <td>¥ {{ material.price }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
      <div class="foot">
        <span class="rd-muted">确认后第 1 项回填当前行，其余项作为同级行追加。</span>
        <button class="aw-tool-btn" type="button" @click="closeBomMaterialPicker">取消</button>
        <button class="aw-btn primary" type="button" @click="confirmBomMaterial">确定</button>
      </div>
    </div>
  </div>

  <template v-if="showAttrModal">
    <div class="aw-drawer-mask" @click="showAttrModal = false" />
    <div class="aw-drawer rd-attr-drawer">
      <div class="bn-drawer-h"><span class="bn-drawer-mark" /><div><div class="bn-drawer-title">属性配置</div><div class="bn-drawer-sub">启用后同步到树表列与右侧“规格属性”Tab</div></div><button class="bn-drawer-close" type="button" @click="showAttrModal = false">×</button></div>
      <div class="bn-drawer-body rd-attr-layout">
        <section class="rd-attr-library">
          <div class="rd-mini-title">预置属性库</div>
          <div v-for="preset in bomAttrPresets" :key="preset.key" class="rd-attr-card">
            <div><b>{{ preset.label }}</b><span>{{ preset.fieldType }} · 默认 {{ preset.defaultValue || '-' }}</span></div>
            <button class="aw-tool-btn" type="button" @click="enableBomAttr(preset)">启用</button>
          </div>
          <div class="rd-mini-title">自定义属性</div>
          <div class="rd-custom-attr">
            <input v-model="customAttrDraft.label" class="aw-input" placeholder="属性名称" />
            <select v-model="customAttrDraft.fieldType" class="aw-select"><option>文本</option><option>数字</option><option>下拉</option></select>
            <input v-model="customAttrDraft.defaultValue" class="aw-input" placeholder="默认值" />
            <button class="aw-btn primary" type="button" @click="addCustomBomAttr">添加</button>
          </div>
        </section>
        <section class="rd-attr-enabled">
          <div class="rd-mini-title">已启用属性</div>
          <table class="aw-doc-tbl">
            <thead><tr><th>排序</th><th>属性名称</th><th>字段类型</th><th>默认值</th><th>表格显示</th><th>必填</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="(attr, index) in bomAttrs" :key="attr.key">
                <td>
                  <button class="aw-tool-btn rd-sort-btn" type="button" @click="moveBomAttr(index, -1)">↑</button>
                  <button class="aw-tool-btn rd-sort-btn" type="button" @click="moveBomAttr(index, 1)">↓</button>
                </td>
                <td>{{ attr.label }}</td><td>{{ attr.fieldType }}</td><td><input v-model="attr.defaultValue" class="aw-input" /></td>
                <td><input v-model="attr.showInTable" type="checkbox" /></td><td><input v-model="attr.required" type="checkbox" /></td>
                <td><span class="aw-link" style="color:var(--aw-danger)" @click="disableBomAttr(attr.key)">停用</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
      <div class="bn-drawer-foot"><button class="aw-tool-btn" type="button" @click="showAttrModal = false">取消</button><button class="aw-btn primary" type="button" @click="showAttrModal = false">应用配置</button></div>
    </div>
  </template>

  <div v-if="showImportModal" class="aw-mask">
    <div class="aw-modal lg">
      <div class="head"><div><span class="aw-modal-title">从 Excel 导入</span><span class="aw-modal-sub">四步导入向导，完成后写入可编辑 BOM 层级</span></div><button class="aw-modal-close" type="button" @click="closeBomImport">×</button></div>
      <div class="body">
        <div class="rd-import-steps">
          <span v-for="(step, index) in bomImportSteps" :key="step.key" :class="{ on: bomImportStep === index + 1, done: bomImportStep > index + 1 }">
            {{ index + 1 }} {{ step.title }}
          </span>
        </div>
        <div v-if="bomImportStep === 1" class="rd-import-box">
          <strong>上传/粘贴 Excel</strong>
          <p>模板列：父项编码、物料编码、物料名称、规格、类型、单位、用量、损耗率、工序、替代料。</p>
          <textarea v-model="bomImportText" class="aw-input rd-import-textarea" />
        </div>
        <div v-else-if="bomImportStep === 2">
          <table class="aw-doc-tbl">
            <thead><tr><th>目标字段</th><th>Excel 列名</th><th>必填</th></tr></thead>
            <tbody><tr v-for="field in bomImportMappingFields" :key="field.target"><td>{{ field.target }}</td><td><input v-model="field.source" class="aw-input" /></td><td>{{ field.required }}</td></tr></tbody>
          </table>
        </div>
        <div v-else-if="bomImportStep === 3">
          <table class="aw-doc-tbl">
            <thead><tr><th>行号</th><th>物料编码</th><th>物料名称</th><th>父项</th><th>用量</th><th>损耗率</th><th>校验</th></tr></thead>
            <tbody><tr v-for="row in bomImportPreviewRows" :key="row.no"><td>{{ row.no }}</td><td>{{ row.code }}</td><td>{{ row.name }}</td><td>{{ row.parent }}</td><td>{{ row.qty }}</td><td>{{ row.loss }}</td><td>{{ row.status }}</td></tr></tbody>
          </table>
        </div>
        <div v-else class="rd-import-box">
          <strong>准备写入清单</strong>
          <p>将写入 {{ bomImportPreviewRows.length }} 条物料行，包含根物料、子装配、替代料、损耗率、用量与关联工序。</p>
        </div>
      </div>
      <div class="foot">
        <button class="aw-tool-btn" type="button" @click="closeBomImport">取消</button>
        <button v-if="bomImportStep > 1" class="aw-tool-btn" type="button" @click="bomImportStep -= 1">上一步</button>
        <button v-if="bomImportStep < 4" class="aw-btn primary" type="button" @click="bomImportStep += 1">下一步</button>
        <button v-else class="aw-btn primary" type="button" @click="importBomTree">写入清单</button>
      </div>
    </div>
  </div>

  <div v-if="showCompareModal" class="aw-mask">
    <div class="aw-modal lg">
      <div class="head"><div><span class="aw-modal-title">版本对比</span><span class="aw-modal-sub">对比变更前后物料、用量和价格</span></div><button class="aw-modal-close" type="button" @click="showCompareModal = false">×</button></div>
      <div class="body rd-compare">
        <table class="aw-doc-tbl"><thead><tr><th>行号</th><th>编码</th><th>名称</th><th>用量</th><th>单价</th><th>状态</th></tr></thead><tbody><tr v-for="row in bomCompareLeft" :key="row.no + row.code"><td>{{ row.no }}</td><td>{{ row.code }}</td><td>{{ row.name }}</td><td>{{ row.qty }}</td><td>{{ row.price }}</td><td>{{ row.status }}</td></tr></tbody></table>
        <table class="aw-doc-tbl"><thead><tr><th>行号</th><th>编码</th><th>名称</th><th>用量</th><th>单价</th><th>状态</th></tr></thead><tbody><tr v-for="row in bomCompareRight" :key="row.no + row.code"><td>{{ row.no }}</td><td>{{ row.code }}</td><td>{{ row.name }}</td><td>{{ row.qty }}</td><td>{{ row.price }}</td><td>{{ row.status }}</td></tr></tbody></table>
      </div>
      <div class="foot"><button class="aw-btn primary" type="button" @click="showCompareModal = false">确定</button></div>
    </div>
  </div>

  <div v-if="showPreviewModal" class="aw-mask">
    <div class="aw-modal lg">
      <div class="head"><div><span class="aw-modal-title">物料清单预览</span><span class="aw-modal-sub">{{ bomForm.name || '未命名 BOM' }}</span></div><button class="aw-modal-close" type="button" @click="showPreviewModal = false">×</button></div>
      <div class="body">
        <div class="aw-form-grid rd-preview-grid">
          <div>BOM编号：提交后生成</div><div>BOM名称：{{ bomForm.name || '未填写' }}</div><div>适用产品：{{ bomForm.product || '未选择' }}</div><div>版本号：{{ bomForm.version || 'V1.0' }}</div>
          <div>BOM类型：{{ bomForm.type || '未选择' }}</div><div>物料数：{{ bomStats.materials }}</div><div>层级数：{{ bomStats.levels }}</div><div>单件成本：¥ {{ bomStats.cost.toFixed(2) }}</div>
        </div>
        <div class="rd-preview-text">{{ bomDetail }}</div>
      </div>
      <div class="foot"><button class="aw-tool-btn" type="button" @click="showPreviewModal = false">关闭</button><button class="aw-btn primary" type="button" @click="handleBomAction('submit')">提交审批</button></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch, type PropType } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwCategoryPickerModal from '@/components/form-page/AwCategoryPickerModal.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwAuditActionModal from '@/components/detail-page/AwAuditActionModal.vue';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import OperationSettingPage from '@/views/operation/shared/OperationSettingPage.vue';
import RdCraftCreatePage from './RdCraftCreatePage.vue';
import type { AttachmentRow, CategoryPickerConfirmPayload, EditableColumn, FormAction } from '@/components/form-page/types';
import type { OperationSettingModule } from '@/app/templates/operation-settings-template';
import type { PersonPickerPerson } from '@/components/setting-page/types';
import type { AuditActionPayload, AuditApprovalNode, AuditDocumentSummary, DetailAction } from '@/components/detail-page/types';
import {
  bomAttrPresets,
  bomCompareLeft,
  bomCompareRight,
  bomDetailText,
  bomHeaderTypeOptions,
  bomImportMappingFields,
  bomImportPreviewRows,
  bomImportSteps,
  bomImportTree,
  bomMaterialCategories,
  bomMaterialPool,
  bomModelOptions,
  bomProcessOps,
  bomUnitOptions,
  bomVariantOptions,
  bomWorkflowOptions,
  bomTypeOptions,
  approveRdDetail,
  changeRdDetail,
  copyProductToProject,
  copyRdResource,
  createRdVersion,
  createRdResource,
  createSubstitute,
  getRdDocCategoryPickerGroups,
  getRdCreateConfig,
  getRdDetail,
  getRdMaterialCategoryPickerGroups,
  getRdProductCategoryPickerGroups,
  getRdProjectCategoryPickerGroups,
  getRdListConfig,
  listRdPicker,
  listRdResource,
  listSubstitutes,
  processByproductOptions,
  processQcPlanOptions,
  processStationOptions,
  printExportRdDetail,
  publishRdDetail,
  rdPeopleDepts,
  rdAttachmentTypeOptions,
  rdCraftPaletteGroupsIn,
  rdCraftPaletteGroupsOut,
  rdCraftTemplates,
  substituteColumns,
  substituteStateOptions,
  updateRdDetail,
  type BomAttrPreset,
  type BomMaterialOption,
  type BomNode,
  type RdCraftOperation,
  type RdCraftStage,
  type RdCraftTemplate,
  type RdCreateConfig,
  type RdCreateSection,
  type RdDetailRecord,
  type RdDetailSection,
  type RdDocCategoryPickerRow,
  type RdField,
  type RdModule,
  type RdPickerRow,
} from '@/app/api/rd/resources';

type AnyRow = Record<string, any>;
type PickerKind = 'product' | 'material' | 'supplier' | 'source' | 'qcPlan';
type PickerContext = 'generic' | 'subMain' | 'subSub' | 'bomProduct';
type ProcessPickerKind = 'station' | 'byproduct' | 'qc';
type BomFlatRow = { id: string; node: BomNode; level: number; no: string; hasChildren: boolean; active: boolean };

const DetailTable = defineComponent({
  props: {
    sectionKey: { type: String, default: '' },
    columns: { type: Array as PropType<string[]>, required: true },
    rows: { type: Array as PropType<string[][]>, required: true },
  },
  setup(props) {
    const purpleBlueCodeSections = ['product-qc-records', 'product-after-sales-records'];
    const isPurpleBlueCodeCell = (column: string) => purpleBlueCodeSections.includes(props.sectionKey) && (column === '质检单号' || column === '售后单号');
    const renderSummaryCell = (row: string[]) => h('div', { class: 'rd-table-summary-items' }, row.slice(1).flatMap((item, index) => {
      const [label, value = ''] = item.split(/[:：]/);
      const summaryItem = h('span', { class: 'rd-table-summary-item' }, [
        h('span', { class: 'rd-table-summary-label' }, `${label}:`),
        h('span', { class: 'rd-table-summary-value', style: { color: '#D92D20', fontWeight: 700 } }, value.trim()),
      ]);
      return index === row.length - 2 ? [summaryItem] : [summaryItem, '\u00a0\u00a0\u00a0\u00a0'];
    }));

    return () => h('div', { class: 'aw-doc-tbl-wrap' }, [
      h('div', { class: 'aw-doc-tbl-inner' }, [
        h('table', { class: 'aw-doc-tbl' }, [
          h('thead', [h('tr', props.columns.map((column) => h('th', [h('div', { class: 'aw-th-inner' }, column)])))]),
          h('tbody', props.rows.length
            ? props.rows.map((row) => row[0] === '汇总'
              ? h('tr', { class: 'rd-table-summary-row' }, [
                h('td', { colspan: props.columns.length }, renderSummaryCell(row)),
              ])
              : h('tr', row.map((cell, index) => h('td', { class: { 'rd-purple-blue-cell': isPurpleBlueCodeCell(props.columns[index] || '') } }, cell))))
            : [h('tr', [h('td', { colspan: props.columns.length, class: 'aw-empty-cell' }, '暂无记录')])]),
        ]),
      ]),
    ]);
  },
});

const route = useRoute();
const router = useRouter();
const rows = ref<AnyRow[]>([]);
const substituteRows = ref<AnyRow[]>([]);
const keyword = ref('');
const pickedTree = ref('all');
const columnFilters = reactive<Record<string, string>>({});
const notice = ref('');
const submitMessage = ref('');
const detailRecord = ref<RdDetailRecord | null>(null);
const activeDetailTab = ref('');
const detailMessage = ref('');
const rdAuditModalOpen = ref(false);
const detailBomCollapsed = reactive<Record<string, boolean>>({});
const selectedDetailOpId = ref('');

type ProjectModalKey = '' | 'bomRef' | 'bomAdd' | 'bomImport' | 'processRef' | 'processAdd' | 'quoteAdd' | 'projectCostAdd';
const projectBomModalKeys: ProjectModalKey[] = ['bomRef', 'bomAdd', 'bomImport'];
const projectProcessModalKeys: ProjectModalKey[] = ['processRef', 'processAdd'];
type ProjectRouteOp = {
  id: string;
  code: string;
  name: string;
  type: 'in' | 'out';
  category: string;
  icon: string;
  workCenter: string;
  setupTime: number;
  runTime: number;
  qcRequired: boolean;
};

const projectHasBom = ref(false);
const projectBomLocked = ref(false);
const projectHasProcess = ref(false);
const projectProcessLocked = ref(false);
const projectQuoteItems = ref<string[][]>([]);
const projectQuoteConfirmed = ref(false);
const projectQuoteAdjustAmount = ref('-12000');
const projectHasPurchase = ref(false);
const projectHasProduction = ref(false);
const projectModal = ref<ProjectModalKey>('');
const projectCraftPaletteTab = ref<'in' | 'out'>('in');
const projectCraftKeyword = ref('');
const projectSelectedRouteOpId = ref('pj-op-1');
const projectRouteOps = ref<ProjectRouteOp[]>([
  { id: 'pj-op-1', code: 'OP1010', name: '来料检验', type: 'in', category: '检验', icon: '检', workCenter: 'IQC检验台', setupTime: 20, runTime: 25, qcRequired: true },
  { id: 'pj-op-2', code: 'OP1020', name: '机加工', type: 'in', category: '加工', icon: '加', workCenter: 'CNC加工中心', setupTime: 30, runTime: 60, qcRequired: true },
  { id: 'pj-op-3', code: 'OP1030', name: '总装调试', type: 'in', category: '装配', icon: '装', workCenter: '总装线 A', setupTime: 25, runTime: 75, qcRequired: true },
]);
const projectExtraMembers = ref<string[][]>([]);
const projectCostItems = ref<string[][]>([
  ['差旅费', '客户现场调研', '¥ 8,600.00', '2026-06-09', '李文涛', '已入账'],
  ['测试费', '样机可靠性测试', '¥ 12,000.00', '2026-06-14', '陈思源', '待审核'],
]);

const genericForm = reactive<Record<string, any>>({});
const genericSubTables = reactive<Record<string, AnyRow[]>>({});
const genericDetail = ref('');
const attachmentRows = ref<AttachmentRow[]>([]);
const activeCreateTabKey = ref('');
type ProcessSwitchTab = 'hours' | 'byproduct' | 'qc';
const processSwitchLabels: Record<ProcessSwitchTab, string> = {
  hours: '工时配置',
  byproduct: '副产品配置',
  qc: '质检方案配置',
};
const processSwitches = reactive<Record<ProcessSwitchTab, boolean>>({
  hours: false,
  byproduct: false,
  qc: false,
});
const processPickerOpen = ref<ProcessPickerKind | ''>('');
const processPickerKeyword = ref('');
const processPickerSelected = reactive<Record<string, boolean>>({});
const processQcPickerGroups = ['全部IPQC', '首件检验', '巡检方案', '停线处置', '复检放行'];

const pickerOpen = ref(false);
const pickerType = ref<PickerKind>('product');
const pickerContext = ref<PickerContext>('generic');
const pickerField = ref<RdField | null>(null);
const pickerRows = ref<RdPickerRow[]>([]);
const pickerPicked = ref<RdPickerRow | null>(null);
const activeSourceCategory = ref('全部客户');

const docCategoryPickerOpen = ref(false);
const activeDocCategoryRoot = ref('');
const pickedDocCategory = ref<RdDocCategoryPickerRow | null>(null);
const businessCategoryPickerOpen = ref(false);
const businessCategoryField = ref<RdField | null>(null);

type PersonPickerMode = 'field' | 'projectMember';
const personPickerOpen = ref(false);
const personPickerMode = ref<PersonPickerMode>('field');
const personField = ref<RdField | null>(null);
const pickedPeople = ref<PersonPickerPerson[]>([]);

const substituteForm = reactive({
  mainMaterial: '',
  mainCode: '',
  subMaterial: '',
  subCode: '',
  ratio: '1:1',
  priority: 1,
  effectiveDate: today(),
  expiryDate: '长期',
  state: '启用',
  remark: '',
});

const bomForm = reactive({
  name: '',
  product: '',
  productCode: '',
  version: 'V1.0',
  type: '',
  author: '老夏',
  effectiveDate: today(),
  workflow: '',
});
const bomTree = ref<BomNode[]>([]);
const bomDetail = ref(bomDetailText);
const bomSpec = reactive({ model: bomModelOptions[0] || '' });
const collapsedBomRows = reactive<Record<string, boolean>>({});
const checkedBomRows = reactive<Record<string, boolean>>({});
const selectedBomNodeId = ref('');
const bomAttrs = ref<BomAttrPreset[]>(clone(bomAttrPresets));
const bomPropTab = ref('basic');
const showStructureModal = ref(false);
const showAttrModal = ref(false);
const showImportModal = ref(false);
const showCompareModal = ref(false);
const showPreviewModal = ref(false);
const bomMaterialPickerOpen = ref(false);
const bomMaterialPickerNodeId = ref('');
const bomMaterialCategory = ref('全部');
const bomMaterialKeyword = ref('');
const pickedBomMaterials = ref<BomMaterialOption[]>([]);
const bomImportStep = ref(1);
const bomImportText = ref('父项编码\t物料编码\t物料名称\t规格\t类型\t单位\t用量\t损耗率\t工序\t替代料\n\tIP17-000\tiPhone17 整机总成\t17/17Pro/17PM\t自制\t台\t1\t0\tOP1040\t\nIP17-000\tIP17-110\t机身结构组件\t标准/Pro/PM\t子装配\t套\t1\t1\tOP1040\t\nIP17-110\tIP17-111\t17 / 17Pro 通用中框\t铝合金中框\t自制\t件\t1\t2\tOP1020\t');
const bomBatchNotice = ref('');
const customAttrDraft = reactive<{ label: string; fieldType: BomAttrPreset['fieldType']; defaultValue: string }>({
  label: '',
  fieldType: '文本',
  defaultValue: '',
});

const pathToModule: Record<string, RdModule> = {
  '/rd/doc': 'docs',
  '/rd/projects': 'projects',
  '/rd/products': 'products',
  '/rd/materials': 'materials',
  '/sales/products': 'products',
  '/sales/materials': 'materials',
  '/purchase/materials': 'materials',
  '/storehouse/products': 'products',
  '/storehouse/materials': 'materials',
  '/production/products': 'products',
  '/production/materials': 'materials',
  '/rd/processes': 'processes',
  '/rd/crafts': 'crafts',
  '/rd/bom': 'boms',
};

const module = computed<RdModule>(() => pathToModule[route.path] || 'docs');
const statusOverrideByPath: Record<string, string> = {
  '/sales/products': '在售',
  '/sales/materials': '在售',
  '/storehouse/products': '启用',
  '/storehouse/materials': '启用',
};
const catalogStatusOverride = computed(() => statusOverrideByPath[route.path] || '');
const catalogRows = computed(() => {
  if (!catalogStatusOverride.value) return rows.value;
  return rows.value.map((row) => ({ ...row, state: catalogStatusOverride.value, tone: 'green' }));
});
const activeConfig = computed(() => {
  const config = getRdListConfig(module.value, rows.value);
  if (!catalogStatusOverride.value) return config;
  return {
    ...config,
    columns: config.columns.map((column) => (column.key === 'state' ? { ...column, filterOptions: [catalogStatusOverride.value] } : column)),
  };
});
const createConfig = computed(() => getRdCreateConfig(module.value));
const createTabs = computed(() => createConfig.value.tabs || []);
const activeCreateTab = computed(() => createTabs.value.find((tab) => tab.key === activeCreateTabKey.value) || createTabs.value[0] || null);
const activeProcessSwitchKey = computed<ProcessSwitchTab | ''>(() => {
  if (module.value !== 'processes') return '';
  const key = activeCreateTab.value?.key;
  return key === 'hours' || key === 'byproduct' || key === 'qc' ? key : '';
});
const isCraftCreate = computed(() => module.value === 'crafts' && route.query.action === 'new');
const isBomCreate = computed(() => module.value === 'boms' && route.query.action === 'new');
const isSubstituteCreate = computed(() => module.value === 'boms' && route.query.action === '新增代替');
const isCreate = computed(() => route.query.action === 'new' && module.value !== 'boms' && module.value !== 'crafts');
const isProcessCreate = computed(() => isCreate.value && module.value === 'processes');
const isSubstituteList = computed(() => module.value === 'boms' && route.query.tab === 'substitute' && !isSubstituteCreate.value);
const isDetail = computed(() => route.query.action === 'detail' && !(module.value === 'boms' && route.query.tab === 'substitute'));
const isProjectDetail = computed(() => isDetail.value && module.value === 'projects');
const detailToolbarActions = computed<DetailAction[]>(() => detailRecord.value?.actions || []);
const rdAuditModuleName = computed(() => ({
  docs: '文档',
  projects: '项目',
  products: '产品',
  materials: '物料',
  processes: '工序',
  crafts: '工艺',
  boms: 'BOM',
})[module.value]);
const rdAuditTitle = computed(() => `${rdAuditModuleName.value}审核`);
const rdAuditDocument = computed<AuditDocumentSummary>(() => {
  const record = detailRecord.value;
  const applicant = record?.metas.find((item) => item.label === '编制人')?.value
    || record?.metas.find((item) => item.label === '负责人')?.value
    || record?.metas.find((item) => item.label === '创建人')?.value
    || record?.metas.find((item) => item.label === '默认供应商')?.value;
  return {
    title: record?.title || `${rdAuditModuleName.value}详情`,
    code: record?.code || '-',
    status: record?.statusText || '-',
    applicant: applicant || '老夏',
    flowName: `${rdAuditModuleName.value}默认审批流`,
    currentNode: module.value === 'projects' ? '项目负责人审核' : '研发主管审核',
  };
});
const rdAuditApprovalNodes = computed<AuditApprovalNode[]>(() => {
  return [
    { name: '提交审批', approver: rdAuditDocument.value.applicant || '老夏', method: '提交', state: 'done', result: '已提交', time: '2026-05-18 14:20' },
    { name: module.value === 'projects' ? '项目负责人审核' : '研发主管审核', approver: '老夏', method: '审批', state: 'current', result: '待审核' },
    { name: module.value === 'docs' ? '归档发布' : '状态生效', approver: '系统', method: module.value === 'docs' ? '自动发布' : '自动生效', state: 'pending' },
  ];
});
const displayColumns = computed(() => isSubstituteList.value ? substituteColumns : activeConfig.value.columns);
const displayRows = computed(() => isSubstituteList.value ? substituteRows.value : catalogRows.value);
const toolbarPlaceholder = computed(() => isSubstituteList.value ? '搜索主物料、替代物料、优先级' : activeConfig.value.searchPlaceholder);
const toolbarCreateLabel = computed(() => isSubstituteList.value ? '新增代替' : activeConfig.value.createLabel);
const fitWidth = computed(() => isSubstituteList.value || (activeConfig.value.fitWidth ?? displayColumns.value.length <= 8));
const pickerTitle = computed(() => ({ product: '选择产品', material: '选择物料', supplier: '选择供应商', source: '选择客户/来源', qcPlan: '选择质检方案' })[pickerType.value]);
const sourcePickerRootLabel = computed(() => pickerType.value === 'supplier' ? '全部供应商' : '全部客户');
const sourcePickerCategories = computed(() => [sourcePickerRootLabel.value, ...Array.from(new Set(pickerRows.value.map((row) => row.category || '未分类')))]);
const visibleSourcePickerRows = computed(() => activeSourceCategory.value === sourcePickerRootLabel.value ? pickerRows.value : pickerRows.value.filter((row) => (row.category || '未分类') === activeSourceCategory.value));
const processPickerTitle = computed(() => {
  const titles: Record<ProcessPickerKind, string> = {
    station: '选择工位',
    byproduct: '选择副产品',
    qc: '选择 IPQC 质检方案',
  };
  return processPickerOpen.value ? titles[processPickerOpen.value] : '';
});
const processPickerSubtitle = computed(() => {
  const subtitles: Record<ProcessPickerKind, string> = {
    station: '从工位库选择后回填到工序工位',
    byproduct: '选择工序产出的副产品或废料',
    qc: '制程质检方案列表',
  };
  return processPickerOpen.value ? subtitles[processPickerOpen.value] : '';
});
const processPickerSearchPlaceholder = computed(() => {
  const placeholders: Record<ProcessPickerKind, string> = {
    station: '搜索工位编码/名称',
    byproduct: '搜索产品名称/编号',
    qc: '搜索方案名称 / 编号 / 控制点',
  };
  return processPickerOpen.value ? placeholders[processPickerOpen.value] : '';
});
const processPickerSourceRows = computed<AnyRow[]>(() => {
  if (processPickerOpen.value === 'station') return processStationOptions;
  if (processPickerOpen.value === 'byproduct') return processByproductOptions;
  if (processPickerOpen.value === 'qc') return processQcPlanOptions.filter((row) => row.state === '启用');
  return [];
});
const processPickerRows = computed(() => {
  const term = processPickerKeyword.value.trim();
  return processPickerSourceRows.value.filter((row) => !term || JSON.stringify(row).includes(term));
});
const processPickerColumns = computed<EditableColumn[]>(() => {
  if (processPickerOpen.value === 'station') return processTableColumns('stations');
  if (processPickerOpen.value === 'byproduct') return processTableColumns('byproducts').filter((column) => column.key !== 'image');
  if (processPickerOpen.value === 'qc') return processTableColumns('qcPlans');
  return [];
});
const processPickerSelectedCount = computed(() => Object.values(processPickerSelected).filter(Boolean).length);
const processPickerAllChecked = computed(() => Boolean(processPickerRows.value.length) && processPickerRows.value.every((row) => processPickerSelected[processPickerRowCode(row)]));
const processPickerIndeterminate = computed(() => processPickerRows.value.some((row) => processPickerSelected[processPickerRowCode(row)]) && !processPickerAllChecked.value);
const processPickerColspan = computed(() => processPickerColumns.value.length + 1 + (processPickerOpen.value === 'byproduct' ? 1 : 0));
const docCategoryGroups = computed(() => getRdDocCategoryPickerGroups());
const activeDocCategoryGroup = computed(() => docCategoryGroups.value.find((group) => group.key === activeDocCategoryRoot.value) || docCategoryGroups.value[0] || null);
const businessCategoryGroups = computed(() => {
  if (businessCategoryField.value?.categoryKind === 'product') return getRdProductCategoryPickerGroups();
  if (businessCategoryField.value?.categoryKind === 'material') return getRdMaterialCategoryPickerGroups();
  return getRdProjectCategoryPickerGroups();
});
const businessCategoryPickerTitle = computed(() => {
  if (businessCategoryField.value?.categoryKind === 'product') return '选择产品分类';
  if (businessCategoryField.value?.categoryKind === 'material') return '选择物料分类';
  return '选择新品类型';
});
const businessCategoryDefaultParentKey = computed(() => String(genericForm.categoryParentKey || ''));
const businessCategoryDefaultChildKey = computed(() => String(genericForm.categoryCode || ''));
const allRdPeople = computed(() => rdPeopleDepts.flatMap((dept) => dept.persons));
const personPickerTitle = computed(() => (personPickerMode.value === 'projectMember' ? '选择项目成员' : '选择负责人'));
const visibleBomAttrs = computed(() => bomAttrs.value.filter((attr) => attr.showInTable));
const enabledBomAttrs = computed(() => bomAttrs.value);
const bomRows = computed(() => flattenBomRows(bomTree.value));
const selectedBomNode = computed(() => selectedBomNodeId.value ? findBomNode(bomTree.value, selectedBomNodeId.value) : null);
const selectedBomCount = computed(() => Object.values(checkedBomRows).filter(Boolean).length);
const bomStats = computed(() => calcBomStats(bomTree.value));
const bomStepStates = computed(() => {
  const steps = [
    { index: 1, label: '填写基础信息', done: Boolean(bomForm.name && bomForm.product) },
    { index: 2, label: '确认规格', done: true },
    { index: 3, label: '添加根物料', done: bomRows.value.some((row) => row.level === 0) },
    { index: 4, label: '添加子件', done: bomRows.value.some((row) => row.level > 0) },
    { index: 5, label: '完善属性', done: Boolean(bomRows.value.length && bomRows.value.every((row) => row.node.code)) },
  ];
  const currentIndex = steps.findIndex((step) => !step.done);
  return steps.map((step, index) => ({ ...step, current: index === (currentIndex < 0 ? steps.length - 1 : currentIndex) }));
});
const filteredBomMaterialPool = computed(() => {
  const term = bomMaterialKeyword.value.trim();
  return bomMaterialPool.filter((material) => {
    const categoryMatched = bomMaterialCategory.value === '全部' || material.category === bomMaterialCategory.value;
    const keywordMatched = !term || [material.code, material.name, material.spec, material.type].some((value) => value.includes(term));
    return categoryMatched && keywordMatched;
  });
});
const activeDetailSections = computed<RdDetailSection[]>(() => {
  if (!detailRecord.value) return [];
  return detailRecord.value.sections[activeDetailTab.value] || [];
});
const projectStatus = computed(() => detailRecord.value?.statusText || '');
const projectCompleted = computed(() => projectStatus.value === '已完成');
const projectPaused = computed(() => projectStatus.value === '已暂停');
const projectAuditLocked = computed(() => ['草稿', '待审核', '待审批', '已退回', '已驳回'].includes(projectStatus.value));
const projectStageEditable = computed(() => isProjectDetail.value && !projectCompleted.value && !projectPaused.value && !projectAuditLocked.value);
const projectCanEditBom = computed(() => projectStageEditable.value && !projectBomLocked.value);
const projectCanLockBom = computed(() => projectStageEditable.value && projectHasBom.value && !projectBomLocked.value);
const projectCanEditProcess = computed(() => projectStageEditable.value && !projectProcessLocked.value);
const projectCanLockProcess = computed(() => projectStageEditable.value && projectHasProcess.value && !projectProcessLocked.value);
const projectCanAddQuoteItem = computed(() => projectStageEditable.value && !projectQuoteConfirmed.value);
const projectCanAdjustQuote = computed(() => projectStageEditable.value && !projectQuoteConfirmed.value);
const projectCanAddCost = computed(() => projectStageEditable.value);
const projectLockedHint = computed(() => {
  if (projectCompleted.value) return '项目已完成，不可新增或发起业务动作。';
  if (projectPaused.value) return '项目已暂停，需恢复项目后才能继续处理。';
  if (projectAuditLocked.value) return '项目处于审批或返修状态，需完成审核或重新提交后才能处理。';
  return '当前状态不可处理该动作。';
});
const projectOwnerName = computed(() => detailRecord.value?.metas.find((item) => item.label === '负责人')?.value || '老夏');
const projectMemberRows = computed(() => [
  ['老夏', '负责人', '2025-03-01'],
  ['李文涛', '参与者', '2025-03-15'],
  ['陈思源', '观察者', '2025-04-10'],
  ...projectExtraMembers.value,
]);
const projectBomRows = computed(() => [
  ['1', '1', 'WL-7820864', '半成品物料', '规格一', 'KG', '500', '2%', '标准BOM引用', projectBomLocked.value ? '已锁定' : '可调整'],
  ['2', '1.1', 'WL-8518691', '铝合金型材', 'AL-6061', 'KG', '320', '3%', '标准BOM引用', projectBomLocked.value ? '已锁定' : '可调整'],
  ['3', '1.2', 'WL-6081578', '外箱包装', 'PK-500', '个', '800', '0%', '项目新增', projectBomLocked.value ? '已锁定' : '可调整'],
]);
const projectProcessRows = computed(() => [
  ['1', 'CRAFT-2026-0012', '智能输送线总装工艺', 'V1.0', '项目工艺', projectProcessLocked.value ? '已锁定' : '编辑'],
]);
const projectQuoteRows = computed(() => [
  ...(projectHasBom.value ? [['BOM成本', '由项目 BOM 物料清单汇总生成', '¥ 420,000.00']] : []),
  ...(projectHasProcess.value ? [['工艺成本', '由项目工艺流程工时与加工费汇总生成', '¥ 180,000.00']] : []),
  ...projectQuoteItems.value,
]);
const projectCanLockQuote = computed(() => projectStageEditable.value && projectBomLocked.value && projectProcessLocked.value && projectQuoteRows.value.length > 0 && !projectQuoteConfirmed.value);
const projectCanStartPurchase = computed(() => projectStatus.value === '进行中' && projectQuoteConfirmed.value && !projectHasPurchase.value);
const projectCanStartProduction = computed(() => projectStatus.value === '进行中' && projectBomLocked.value && projectProcessLocked.value && projectQuoteConfirmed.value && !projectHasProduction.value);
const projectQuoteHint = computed(() => {
  if (projectQuoteConfirmed.value) return '报价已锁定，不可继续调整成本项。';
  if (!projectStageEditable.value) return projectLockedHint.value;
  if (!projectBomLocked.value || !projectProcessLocked.value) return '需先锁定 BOM 和工艺，才能锁定报价并进入采购、生产。';
  return '当前报价信息可继续维护。';
});
const projectPurchaseHint = computed(() => {
  if (projectHasPurchase.value) return '';
  if (projectStatus.value !== '进行中') return '项目进入进行中后才可以发起采购。';
  if (!projectQuoteConfirmed.value) return '锁定报价后才可以发起采购。';
  return '';
});
const projectProductionHint = computed(() => {
  if (projectHasProduction.value) return '';
  if (projectStatus.value !== '进行中') return '项目进入进行中后才可以下单生产需求。';
  if (!projectBomLocked.value || !projectProcessLocked.value) return '需先锁定 BOM 和工艺，才能下单生产需求。';
  if (!projectQuoteConfirmed.value) return '锁定报价后才可以下单生产需求。';
  return '';
});
const projectCanConfirmModal = computed(() => {
  if (!projectModal.value) return false;
  if (projectBomModalKeys.includes(projectModal.value)) return projectCanEditBom.value;
  if (projectProcessModalKeys.includes(projectModal.value)) return projectCanEditProcess.value;
  if (projectModal.value === 'quoteAdd') return projectCanAddQuoteItem.value;
  if (projectModal.value === 'projectCostAdd') return projectCanAddCost.value;
  return projectStageEditable.value;
});
const projectQuoteTableRows = computed(() => projectQuoteRows.value.map((row, index) => [
  String(index + 1),
  row[0],
  row[1],
  row[2],
  index < (projectHasBom.value ? 1 : 0) + (projectHasProcess.value ? 1 : 0) ? '系统生成' : '手动新增',
]));
const projectQuoteBaseAmount = computed(() => projectQuoteRows.value.reduce((sum, row) => sum + moneyToNumber(row[2]), 0));
const projectQuoteActualAmount = computed(() => Math.max(projectQuoteBaseAmount.value + Number(projectQuoteAdjustAmount.value || 0), 0));
const projectPurchaseRows = computed(() => [['1', 'PO-2026-PRJ-001', '项目物料清单', '¥ 420,000.00', '待审核', '已发起']]);
const projectProductionRows = computed(() => [['1', 'MRP-2026-PRJ-001', '项目报价确认', '1 套', '待排产', '已下单']]);
const projectCostTableRows = computed(() => projectCostItems.value.map((row, index) => [String(index + 1), ...row]));
const projectLogRows = computed(() => [
  { operator: '老夏', action: '创建项目', time: '2025-03-01 09:00' },
  { operator: '老夏', action: '修改项目基本信息', time: '2025-03-02 14:20' },
  { operator: '李文涛', action: '添加项目成员「陈思源」', time: '2025-04-10 11:00' },
  { operator: '陈思源', action: '创建里程碑「系统联调测试」', time: '2025-06-15 16:30' },
  { operator: '老夏', action: '上传附件「测试方案.xlsx」', time: '2025-07-20 09:15' },
]);
const projectModalTitle = computed(() => ({
  bomRef: '引用BOM',
  bomAdd: '新增BOM',
  bomImport: '导入Excel',
  processRef: '选择工艺流程',
  processAdd: '添加工艺流程',
  quoteAdd: '新增成本项',
  projectCostAdd: '新增成本项目',
} as Partial<Record<ProjectModalKey, string>>)[projectModal.value] || '项目操作');
const projectModalPrimaryText = computed(() => ({
  bomRef: '引用',
  bomAdd: '保存BOM',
  bomImport: '开始导入',
  processRef: '确定',
  processAdd: '保存',
  quoteAdd: '保存',
  projectCostAdd: '保存',
} as Partial<Record<ProjectModalKey, string>>)[projectModal.value] || '确定');
const projectCraftGroupedTemplates = computed(() => {
  const groups = projectCraftPaletteTab.value === 'in' ? rdCraftPaletteGroupsIn : rdCraftPaletteGroupsOut;
  const term = projectCraftKeyword.value.trim();
  return groups
    .map((name) => ({
      name,
      list: rdCraftTemplates.filter((template) => template.type === projectCraftPaletteTab.value && template.category === name && (!term || [template.name, template.category, template.key].some((value) => value.includes(term)))),
    }))
    .filter((group) => group.list.length);
});
const projectSelectedRouteOp = computed(() => projectRouteOps.value.find((op) => op.id === projectSelectedRouteOpId.value) || projectRouteOps.value[0] || null);
const projectRouteStats = computed(() => {
  const totalMin = projectRouteOps.value.reduce((sum, op) => sum + op.setupTime + op.runTime, 0);
  return {
    totalOps: projectRouteOps.value.length,
    inOps: projectRouteOps.value.filter((op) => op.type === 'in').length,
    outOps: projectRouteOps.value.filter((op) => op.type === 'out').length,
    totalMin,
  };
});
const selectedCraftOp = computed<RdCraftOperation | null>(() => {
  for (const section of activeDetailSections.value) {
    if (section.type !== 'craftRoute') continue;
    for (const stage of section.stages) {
      const found = stage.ops.find((op) => op.id === selectedDetailOpId.value);
      if (found) return found;
    }
    return section.stages[0]?.ops[0] || null;
  }
  return null;
});
const selectedCraftStage = computed<RdCraftStage | null>(() => {
  for (const section of activeDetailSections.value) {
    if (section.type !== 'craftRoute') continue;
    return section.stages.find((stage) => stage.ops.some((op) => op.id === selectedCraftOp.value?.id)) || null;
  }
  return null;
});
const selectedCraftFields = computed(() => {
  const op = selectedCraftOp.value;
  const stage = selectedCraftStage.value;
  if (!op || !stage) return [];
  const isIn = op.type === 'in';
  return [
    { label: '工序编号', value: op.code },
    { label: '工序名称', value: op.name },
    { label: '工序分类', value: op.category },
    { label: '工序类型', value: isIn ? '自制工序' : '委外工序' },
    { label: '排序方式', value: stage.kind === 'par' ? '并序，同时执行' : '串序，独立步骤' },
    { label: isIn ? '工作中心' : '委外厂商', value: op.workCenter },
    { label: isIn ? '设备' : '外协协议', value: op.equipment },
    { label: '准备工时', value: `${op.setupTime} min` },
    { label: '单件工时', value: `${op.runTime} min` },
    { label: '排队等待', value: `${op.queueTime} min` },
    { label: '合计时长', value: `${op.setupTime + op.runTime + op.queueTime} min` },
    { label: isIn ? '工价' : '外协单价', value: isIn ? `${op.costRate} 元/min` : `${op.costRate} 元/件` },
    { label: '是否检验', value: op.qcRequired ? '需要' : '不需要' },
    { label: '检验方案', value: op.qcPlan },
    { label: 'SOP 编号', value: op.sopCode },
  ];
});

const settingModule = computed<OperationSettingModule | null>(() => {
  if (!route.query.setting) return null;
  const map: Record<RdModule, OperationSettingModule> = {
    docs: 'rdDocs',
    projects: 'rdProjects',
    products: 'rdProducts',
    materials: 'rdMaterials',
    processes: 'rdProcesses',
    crafts: 'rdCrafts',
    boms: 'rdBoms',
  };
  return map[module.value];
});

const filteredRows = computed(() => {
  const term = keyword.value.trim();
  const config = activeConfig.value;
  return displayRows.value.filter((row) => {
    const keywordMatched = !term || JSON.stringify(row).includes(term);
    const treeMatched = isSubstituteList.value || !config.treeFilterKey || pickedTree.value === 'all'
      || row[config.treeFilterKey] === pickedTree.value
      || (module.value === 'docs' && row.category === pickedTree.value);
    const columnMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
    return keywordMatched && treeMatched && columnMatched;
  });
});

const genericActions = computed<FormAction[]>(() => [
  { key: 'draft', label: '保存草稿' },
  { key: 'reset', label: '重置' },
  { key: 'submit', label: createConfig.value.submitText, primary: true },
]);
const substituteActions: FormAction[] = [
  { key: 'draft', label: '保存草稿' },
  { key: 'reset', label: '重置' },
  { key: 'submit', label: '提交审批', primary: true },
];
const bomActions: FormAction[] = [
  { key: 'draft', label: '暂存草稿' },
  { key: 'import', label: '导入' },
  { key: 'compare', label: '版本对比' },
  { key: 'preview', label: '预览' },
  { key: 'submit', label: '提交审批', primary: true },
];
const bomPropTabs = [
  { key: 'basic', label: '基础' },
  { key: 'attrs', label: '规格属性' },
  { key: 'alts', label: '替代料' },
  { key: 'logs', label: '变更记录' },
];

watch(() => route.fullPath, () => {
  if (module.value === 'boms' && route.query.action === '新增代替' && route.query.tab !== 'substitute') {
    router.replace({ path: '/rd/bom', query: { ...route.query, tab: 'substitute' } });
    return;
  }
  keyword.value = '';
  pickedTree.value = 'all';
  notice.value = '';
  submitMessage.value = '';
  detailMessage.value = '';
  rdAuditModalOpen.value = false;
  detailRecord.value = null;
  activeCreateTabKey.value = createTabs.value[0]?.key || '';
  Object.keys(columnFilters).forEach((key) => delete columnFilters[key]);
  if (isCreate.value) resetGenericForm();
  if (isSubstituteCreate.value) resetSubstituteForm();
  if (isBomCreate.value) resetBomForm();
  if (isDetail.value) loadDetail();
  load();
}, { immediate: true });

async function load() {
  rows.value = await listRdResource(module.value);
  substituteRows.value = await listSubstitutes();
}

async function loadDetail() {
  const record = await getRdDetail(module.value, String(route.query.id || ''));
  detailRecord.value = record;
  activeDetailTab.value = record.tabs[0]?.key || '';
  if (module.value === 'projects') resetProjectDetailState();
  const routeTab = record.sections.route?.find((section) => section.type === 'craftRoute');
  if (routeTab?.type === 'craftRoute') {
    selectedDetailOpId.value = routeTab.stages[0]?.ops[0]?.id || '';
  }
  Object.keys(detailBomCollapsed).forEach((key) => delete detailBomCollapsed[key]);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function moneyToNumber(value: unknown) {
  return Number(String(value || '').replace(/[^\d.-]/g, '') || 0);
}

function money(value: number) {
  return `¥ ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function resetProjectDetailState() {
  projectHasBom.value = false;
  projectBomLocked.value = false;
  projectHasProcess.value = false;
  projectProcessLocked.value = false;
  projectQuoteItems.value = [];
  projectQuoteConfirmed.value = false;
  projectQuoteAdjustAmount.value = '-12000';
  projectHasPurchase.value = false;
  projectHasProduction.value = false;
  projectModal.value = '';
  projectCraftPaletteTab.value = 'in';
  projectCraftKeyword.value = '';
  projectSelectedRouteOpId.value = 'pj-op-1';
  projectExtraMembers.value = [];
  projectRouteOps.value = [
    { id: 'pj-op-1', code: 'OP1010', name: '来料检验', type: 'in', category: '检验', icon: '检', workCenter: 'IQC检验台', setupTime: 20, runTime: 25, qcRequired: true },
    { id: 'pj-op-2', code: 'OP1020', name: '机加工', type: 'in', category: '加工', icon: '加', workCenter: 'CNC加工中心', setupTime: 30, runTime: 60, qcRequired: true },
    { id: 'pj-op-3', code: 'OP1030', name: '总装调试', type: 'in', category: '装配', icon: '装', workCenter: '总装线 A', setupTime: 25, runTime: 75, qcRequired: true },
  ];
  projectCostItems.value = [
    ['差旅费', '客户现场调研', '¥ 8,600.00', '2026-06-09', '李文涛', '已入账'],
    ['测试费', '样机可靠性测试', '¥ 12,000.00', '2026-06-14', '陈思源', '待审核'],
  ];
  if (['进行中', '已暂停', '已完成'].includes(projectStatus.value)) {
    projectHasBom.value = true;
    projectBomLocked.value = true;
    projectHasProcess.value = true;
    projectProcessLocked.value = true;
    projectQuoteConfirmed.value = true;
    projectHasPurchase.value = true;
    projectHasProduction.value = true;
  }
}

function projectModalBlockedMessage(key: ProjectModalKey) {
  if (projectBomModalKeys.includes(key) && !projectCanEditBom.value) return projectLockedHint.value;
  if (projectProcessModalKeys.includes(key) && !projectCanEditProcess.value) return projectLockedHint.value;
  if (key === 'quoteAdd' && !projectCanAddQuoteItem.value) return projectQuoteHint.value;
  if (key === 'projectCostAdd' && !projectCanAddCost.value) return projectLockedHint.value;
  return '';
}

function openProjectModal(key: ProjectModalKey) {
  const blockedMessage = projectModalBlockedMessage(key);
  if (blockedMessage) {
    detailMessage.value = blockedMessage;
    return;
  }
  projectModal.value = key;
}

function closeProjectModal() {
  projectModal.value = '';
}

function confirmProjectModal() {
  if (!projectCanConfirmModal.value) {
    detailMessage.value = projectModalBlockedMessage(projectModal.value) || '当前状态不可处理该动作。';
    return;
  }
  if (projectModal.value === 'bomRef' || projectModal.value === 'bomAdd' || projectModal.value === 'bomImport') {
    projectHasBom.value = true;
    projectBomLocked.value = false;
    detailMessage.value = projectModal.value === 'bomImport' ? 'BOM Excel 已导入项目物料清单' : '项目 BOM 已写入物料清单';
  } else if (projectModal.value === 'processRef' || projectModal.value === 'processAdd') {
    projectHasProcess.value = true;
    detailMessage.value = '项目工艺流程已写入';
  } else if (projectModal.value === 'quoteAdd') {
    projectQuoteItems.value = [...projectQuoteItems.value, ['项目管理费', '手动录入的项目成本项', '¥ 60,000.00']];
    detailMessage.value = '新增成本项已保存';
  } else if (projectModal.value === 'projectCostAdd') {
    if (!projectCompleted.value) {
      projectCostItems.value = [...projectCostItems.value, ['外协费', '项目执行过程中的外协加工费用', '¥ 3,000.00', '2026-06-20', projectOwnerName.value, '待审核']];
      detailMessage.value = '新增成本项目已保存';
    }
  }
  closeProjectModal();
}

function addProjectRouteOp(template: RdCraftTemplate) {
  const id = `pj-op-${Date.now()}`;
  const op: ProjectRouteOp = {
    id,
    code: `OP${1000 + projectRouteOps.value.length * 10}`,
    name: template.name,
    type: template.type,
    category: template.category,
    icon: template.icon,
    workCenter: template.type === 'out' ? '委外厂商待定' : '项目工作中心',
    setupTime: template.setupTime,
    runTime: template.runTime,
    qcRequired: template.category === '检验',
  };
  projectRouteOps.value = [...projectRouteOps.value, op];
  projectSelectedRouteOpId.value = id;
}

function removeProjectRouteOp(id: string) {
  if (projectRouteOps.value.length <= 1) return;
  projectRouteOps.value = projectRouteOps.value.filter((op) => op.id !== id);
  if (projectSelectedRouteOpId.value === id) projectSelectedRouteOpId.value = projectRouteOps.value[0]?.id || '';
}

function lockProjectBom() {
  if (!projectCanLockBom.value) {
    detailMessage.value = projectLockedHint.value;
    return;
  }
  projectBomLocked.value = true;
  detailMessage.value = 'BOM 已锁定为当前项目版本基准';
}

function lockProjectProcess() {
  if (!projectCanLockProcess.value) {
    detailMessage.value = projectLockedHint.value;
    return;
  }
  projectProcessLocked.value = true;
  detailMessage.value = '工艺已锁定为当前项目工艺基准';
}

function lockProjectQuote() {
  if (!projectCanLockQuote.value) {
    detailMessage.value = projectQuoteHint.value;
    return;
  }
  projectQuoteConfirmed.value = true;
  detailMessage.value = '报价已锁定，可继续发起采购或生产需求';
}

function startProjectPurchase() {
  if (!projectCanStartPurchase.value) {
    detailMessage.value = projectPurchaseHint.value || '当前状态不可发起采购。';
    return;
  }
  projectHasPurchase.value = true;
  detailMessage.value = '采购已从项目物料清单发起';
}

function startProjectProduction() {
  if (!projectCanStartProduction.value) {
    detailMessage.value = projectProductionHint.value || '当前状态不可下单生产需求。';
    return;
  }
  projectHasProduction.value = true;
  detailMessage.value = '生产需求已从项目报价确认下单';
}

function setColumnFilter(key: string, value: string) {
  columnFilters[key] = value;
}

function openCreate() {
  if (isSubstituteList.value) {
    router.push({ path: '/rd/bom', query: { tab: 'substitute', action: '新增代替' } });
    return;
  }
  router.push({ path: route.path, query: { action: 'new' } });
}

function goList() {
  router.push({ path: route.path });
}

function goSubstituteList() {
  router.push({ path: '/rd/bom', query: { tab: 'substitute' } });
}

function readonlyDetailNotice(row: AnyRow) {
  if (isSubstituteList.value) {
    notice.value = `${row.mainCode || row.mainMaterial || row.code || row.name} 的代替物料详情暂不实现，保持列表标题“未完成”。`;
    return;
  }
  router.push({ path: route.path, query: { action: 'detail', id: row.id } });
}

function goDetailBack() {
  router.push({ path: route.path });
}

async function refreshDetailView() {
  const currentTab = activeDetailTab.value;
  await load();
  await loadDetail();
  if (detailRecord.value?.tabs.some((tab) => tab.key === currentTab)) {
    activeDetailTab.value = currentTab;
  }
}

async function handleDetailAction(key: string) {
  if (!detailRecord.value) return;
  if (key === 'approve') {
    rdAuditModalOpen.value = true;
    return;
  }
  const id = detailRecord.value.id;
  let response: { message?: string } | unknown;
  if (key === 'copyToProject' && module.value === 'products') {
    response = await copyProductToProject(id);
    await router.push({ path: '/rd/projects' });
    notice.value = (response as { message?: string }).message || '已复制产品并生成新品研发';
    await load();
    return;
  }
  if (key === 'copyResource' && (module.value === 'crafts' || module.value === 'boms')) {
    response = await copyRdResource(module.value, id);
    const itemId = String((response as { item?: { id?: string } }).item?.id || '');
    detailMessage.value = (response as { message?: string }).message || `${activeConfig.value.title}已复制为新记录`;
    await load();
    if (itemId) {
      await router.push({ path: route.path, query: { action: 'detail', id: itemId } });
      return;
    }
    await refreshDetailView();
    return;
  }
  if (key === 'print' || key === 'export') {
    response = await printExportRdDetail(module.value, id, key);
  } else if (key === 'publish') {
    response = await publishRdDetail(module.value, id);
  } else if (key === 'version' || key === 'copyVersion') {
    response = await createRdVersion(module.value, id);
  } else if (key === 'change' || key === 'compare') {
    response = await changeRdDetail(module.value, id, { action: key });
  } else if (['submit', 'approve', 'reject', 'return', 'transfer'].includes(key)) {
    response = await approveRdDetail(module.value, id, { action: key });
  } else {
    response = await updateRdDetail(module.value, id, { action: key });
  }
  detailMessage.value = (response as { message?: string }).message || '操作已完成';
  await refreshDetailView();
}

async function confirmRdAuditAction(payload: AuditActionPayload) {
  if (!detailRecord.value) return;
  const response = await approveRdDetail(module.value, detailRecord.value.id, { ...payload });
  rdAuditModalOpen.value = false;
  detailMessage.value = (response as { message?: string }).message || '审核动作已提交';
  await refreshDetailView();
}

function statusTone(value: unknown) {
  const status = String(value || '');
  if (['已发布', '已完成', '在售', '启用', '已生效'].includes(status)) return 'green';
  if (['待审核', '待审批', '已审核待发布', '暂停', '筹备中', '停产', '禁止采购', '已退回'].includes(status)) return 'yellow';
  if (['草稿', '研发', '进行中'].includes(status)) return 'blue';
  return 'gray';
}

function allCreateSections(config: RdCreateConfig): RdCreateSection[] {
  return [
    ...config.sections,
    ...(config.tabs || []).flatMap((tab) => tab.sections || []),
  ];
}

function allCreateSubTables(config: RdCreateConfig) {
  return [
    ...(config.subTables || []),
    ...(config.tabs || []).flatMap((tab) => tab.subTables || []),
  ];
}

function processFieldsForTab(tabKey: string): RdField[] {
  const tab = createTabs.value.find((item) => item.key === tabKey);
  return (tab?.sections || []).flatMap((section) => section.fields);
}

function processTableColumns(tableKey: string): EditableColumn[] {
  return allCreateSubTables(createConfig.value).find((table) => table.key === tableKey)?.columns || [];
}

function processTableColspan(tableKey: string) {
  return processTableColumns(tableKey).length + 1;
}

function isSwitchOn(value: unknown) {
  return value === true || value === '是' || value === '启用' || value === 'true';
}

function processSwitchLabel(key: ProcessSwitchTab) {
  return processSwitchLabels[key];
}

function isProcessSwitchOpen(key: ProcessSwitchTab) {
  return processSwitches[key];
}

function toggleProcessSwitch(key: ProcessSwitchTab) {
  processSwitches[key] = !processSwitches[key];
}

function setProcessSwitchFromEvent(key: ProcessSwitchTab, event: Event) {
  processSwitches[key] = (event.target as HTMLInputElement).checked;
}

function processFieldUnit(key: string) {
  if (module.value !== 'processes') return '';
  const units: Record<string, string> = {
    standardHours: '分钟',
    assistHours: '分钟',
    coolingHours: '分钟',
    processCost: '元',
  };
  return units[key] || '';
}

function showGenericRemove(tableKey: string) {
  if (module.value === 'processes' && tableKey === 'params') return (genericSubTables[tableKey] || []).length > 1;
  return true;
}

function ensureGenericRows(key: string) {
  if (!genericSubTables[key]) genericSubTables[key] = [];
  return genericSubTables[key];
}

function addProcessParam() {
  addGenericRow('params', processTableColumns('params'));
}

function processPickerRowCode(row: AnyRow) {
  return String(row.code || row.id || row.name || '');
}

function processPickerCell(row: AnyRow, key: string) {
  return row[key] ?? '-';
}

function openProcessPicker(kind: ProcessPickerKind) {
  processPickerOpen.value = kind;
  processPickerKeyword.value = '';
  Object.keys(processPickerSelected).forEach((key) => delete processPickerSelected[key]);
  if (kind === 'qc') {
    (genericSubTables.qcPlans || []).forEach((row) => {
      processPickerSelected[processPickerRowCode(row)] = true;
    });
  }
}

function closeProcessPicker() {
  processPickerOpen.value = '';
  processPickerKeyword.value = '';
  Object.keys(processPickerSelected).forEach((key) => delete processPickerSelected[key]);
}

function toggleProcessPickerRow(row: AnyRow) {
  const code = processPickerRowCode(row);
  processPickerSelected[code] = !processPickerSelected[code];
}

function toggleProcessPickerAll() {
  const checked = processPickerAllChecked.value;
  processPickerRows.value.forEach((row) => {
    processPickerSelected[processPickerRowCode(row)] = !checked;
  });
}

function confirmProcessPicker() {
  if (!processPickerOpen.value) return;
  const picked = processPickerSourceRows.value
    .filter((row) => processPickerSelected[processPickerRowCode(row)])
    .map((row, index) => ({ id: `${processPickerRowCode(row)}-${Date.now()}-${index}`, ...row }));
  if (processPickerOpen.value === 'station') {
    ensureGenericRows('stations').push(...picked);
  } else if (processPickerOpen.value === 'byproduct') {
    ensureGenericRows('byproducts').push(...picked);
  } else if (processPickerOpen.value === 'qc') {
    genericSubTables.qcPlans = picked;
  }
  closeProcessPicker();
}

function categoryDisplayValue(field: RdField) {
  if (field.key !== 'category') return genericForm[field.key] || '';
  return genericForm.categoryPath || genericForm.category || '';
}

function openCategoryPicker(field: RdField) {
  if (field.categoryKind === 'project' || field.categoryKind === 'product' || field.categoryKind === 'material') {
    openBusinessCategoryPicker(field);
    return;
  }
  openDocCategoryPicker();
}

function openBusinessCategoryPicker(field: RdField) {
  businessCategoryField.value = field;
  businessCategoryPickerOpen.value = true;
}

function closeBusinessCategoryPicker() {
  businessCategoryPickerOpen.value = false;
}

function confirmBusinessCategoryPicker(payload: CategoryPickerConfirmPayload) {
  if (!businessCategoryField.value) return;
  genericForm.category = payload.parent.label;
  genericForm.categoryParent = payload.parent.label;
  genericForm.categoryParentKey = payload.parent.key;
  genericForm.subCategory = payload.child.label;
  genericForm.categoryCode = payload.child.key;
  genericForm.categoryPath = `${payload.parent.label} / ${payload.child.label}`;
  businessCategoryPickerOpen.value = false;
}

function openDocCategoryPicker() {
  const groups = docCategoryGroups.value;
  const currentParent = String(genericForm.categoryParent || '');
  const currentCategory = String(genericForm.category || '');
  const matchedGroup = groups.find((group) => group.name === currentParent || group.rows.some((row) => row.name === currentCategory)) || groups[0] || null;
  activeDocCategoryRoot.value = matchedGroup?.key || '';
  pickedDocCategory.value = matchedGroup?.rows.find((row) => row.name === currentCategory) || null;
  docCategoryPickerOpen.value = true;
}

function closeDocCategoryPicker() {
  docCategoryPickerOpen.value = false;
}

function selectDocCategoryRoot(key: string) {
  activeDocCategoryRoot.value = key;
  pickedDocCategory.value = null;
}

function confirmDocCategoryPicker() {
  if (!pickedDocCategory.value) return;
  const picked = pickedDocCategory.value;
  genericForm.category = picked.name;
  genericForm.categoryCode = picked.code;
  genericForm.categoryParent = picked.parentName;
  genericForm.categoryPath = `${picked.parentName} / ${picked.name}`;
  docCategoryPickerOpen.value = false;
}

function removeProcessRow(key: string, id: number | string) {
  if (key === 'params' && !showGenericRemove(key)) return;
  genericSubTables[key] = (genericSubTables[key] || []).filter((row) => row.id !== id);
}

function resetGenericForm() {
  Object.keys(genericForm).forEach((key) => delete genericForm[key]);
  activeCreateTabKey.value = createTabs.value[0]?.key || '';
  processSwitches.hours = false;
  processSwitches.byproduct = false;
  processSwitches.qc = false;
  allCreateSections(createConfig.value).forEach((section) => {
    section.fields.forEach((field) => {
      genericForm[field.key] = field.defaultValue ?? '';
    });
  });
  (createConfig.value.richTextFields || []).forEach((field) => {
    genericForm[field.key] = field.defaultValue ?? '';
  });
  Object.keys(genericSubTables).forEach((key) => delete genericSubTables[key]);
  allCreateSubTables(createConfig.value).forEach((table) => {
    genericSubTables[table.key] = clone(table.rows);
  });
  attachmentRows.value = [{ id: 1, name: '', type: rdAttachmentTypeOptions[1], date: today(), remark: '' }];
  genericDetail.value = '';
}

function resetSubstituteForm() {
  Object.assign(substituteForm, {
    mainMaterial: '',
    mainCode: '',
    subMaterial: '',
    subCode: '',
    ratio: '1:1',
    priority: 1,
    effectiveDate: today(),
    expiryDate: '长期',
    state: '启用',
    remark: '',
  });
}

function resetBomForm() {
  Object.assign(bomForm, {
    name: '',
    product: '',
    productCode: '',
    version: 'V1.0',
    type: '',
    author: '老夏',
    effectiveDate: today(),
    workflow: '',
  });
  bomTree.value = [];
  bomDetail.value = bomDetailText;
  bomSpec.model = bomModelOptions[0] || '';
  selectedBomNodeId.value = '';
  bomPropTab.value = 'basic';
  bomImportStep.value = 1;
  bomMaterialCategory.value = '全部';
  bomMaterialKeyword.value = '';
  pickedBomMaterials.value = [];
  bomBatchNotice.value = '';
  Object.keys(collapsedBomRows).forEach((key) => delete collapsedBomRows[key]);
  Object.keys(checkedBomRows).forEach((key) => delete checkedBomRows[key]);
  bomAttrs.value = clone(bomAttrPresets);
}

function addGenericRow(key: string, columns: EditableColumn[]) {
  const row: AnyRow = { id: Date.now() };
  columns.forEach((column) => { row[column.key] = ''; });
  if (!genericSubTables[key]) genericSubTables[key] = [];
  genericSubTables[key].push(row);
}

function removeGenericRow(key: string, id: number | string) {
  if ((genericSubTables[key] || []).length <= 1) return;
  genericSubTables[key] = genericSubTables[key].filter((row) => row.id !== id);
}

function addAttachment() {
  attachmentRows.value.push({ id: Date.now(), name: '', type: rdAttachmentTypeOptions[1], date: today(), remark: '' });
}

function uploadAttachment(row: AttachmentRow) {
  submitMessage.value = `${row.name || '附件'} 已触发上传。`;
}

function removeAttachment(row: AttachmentRow) {
  if (attachmentRows.value.length <= 1) return;
  attachmentRows.value = attachmentRows.value.filter((item) => item.id !== row.id);
}

async function handleGenericAction(key: string) {
  if (key === 'reset') {
    resetGenericForm();
    submitMessage.value = '已重置。';
    return;
  }
  if (module.value === 'docs' && (!genericForm.categoryParent || !genericForm.category)) {
    submitMessage.value = '请先选择所属分类。';
    return;
  }
  const action = key === 'submit' && createConfig.value.submitText === '保存' ? 'save' : key;
  const response = await createRdResource({
    module: module.value,
    action,
    form: { ...genericForm, detailText: genericDetail.value, attachments: attachmentRows.value },
    lines: Object.values(genericSubTables).flat(),
  }) as { message?: string };
  submitMessage.value = `${response.message || createConfig.value.title + '已保存'}，已通过新增接口调用。`;
  await load();
}

async function handleSubstituteAction(key: string) {
  if (key === 'reset') {
    resetSubstituteForm();
    submitMessage.value = '已重置。';
    return;
  }
  const response = await createSubstitute({ ...substituteForm, action: key }) as { message?: string };
  submitMessage.value = `${response.message || '代替物料已保存'}，已通过新增接口调用。`;
  await load();
}

async function handleBomAction(key: string) {
  if (key === 'import') {
    showImportModal.value = true;
    return;
  }
  if (key === 'compare') {
    showCompareModal.value = true;
    return;
  }
  if (key === 'preview') {
    showPreviewModal.value = true;
    return;
  }
  if (key === 'submit') {
    const missing = [];
    if (!bomForm.name) missing.push('BOM名称');
    if (!bomForm.product) missing.push('适用产品');
    if (!bomForm.type) missing.push('BOM类型');
    if (!bomForm.workflow) missing.push('审批流程');
    if (!bomRows.value.length) missing.push('物料清单');
    if (bomRows.value.some((row) => !row.node.code)) missing.push('完整物料信息');
    if (missing.length) {
      submitMessage.value = `请先补充：${missing.join('、')}`;
      return;
    }
  }
  const response = await createRdResource({
    module: 'boms',
    action: key,
    form: { ...bomForm, type: bomForm.type, stats: bomStats.value, detailText: bomDetail.value },
    lines: bomRows.value.map((row) => ({ no: row.no, ...row.node })),
  }) as { message?: string };
  submitMessage.value = `${response.message || 'BOM已保存'}，已通过新增接口调用。`;
  showPreviewModal.value = false;
  await load();
}

async function openGenericPicker(type: PickerKind, context: PickerContext, field?: RdField) {
  pickerType.value = type;
  pickerContext.value = context;
  pickerField.value = field || null;
  pickerPicked.value = null;
  pickerRows.value = await listRdPicker(type);
  activeSourceCategory.value = type === 'supplier' ? '全部供应商' : '全部客户';
  pickerOpen.value = true;
}

function closeGenericPicker() {
  pickerOpen.value = false;
  pickerPicked.value = null;
}

function confirmGenericPicker() {
  const picked = pickerPicked.value;
  if (!picked) return;
  if (pickerContext.value === 'generic' && pickerField.value) assignGenericField(pickerField.value, picked);
  if (pickerContext.value === 'subMain') {
    substituteForm.mainMaterial = picked.name;
    substituteForm.mainCode = picked.code;
  }
  if (pickerContext.value === 'subSub') {
    substituteForm.subMaterial = picked.name;
    substituteForm.subCode = picked.code;
  }
  if (pickerContext.value === 'bomProduct') {
    bomForm.product = picked.name;
    bomForm.productCode = picked.code;
  }
  closeGenericPicker();
}

function assignGenericField(field: RdField, picked: RdPickerRow) {
  genericForm[field.key] = picked.name;
  if (field.key === 'product' || field.key === 'craft') {
    genericForm.productCode = picked.code;
    genericForm.brand = picked.brand || genericForm.brand;
    genericForm.model = picked.model || genericForm.model;
    genericForm.unit = picked.unit || genericForm.unit;
  }
  if (field.key === 'supplier') genericForm.supplierCode = picked.code;
  if (field.key === 'source') genericForm.sourceCode = picked.code;
  if (field.key === 'qcPlan') genericForm.qcPlanCode = picked.code;
}

function openPersonPicker(field: RdField) {
  personField.value = field;
  personPickerMode.value = 'field';
  const pickedNames = String(genericForm[field.key] || '').split(/[、,，]/).map((name) => name.trim()).filter(Boolean);
  pickedPeople.value = allRdPeople.value.filter((person) => pickedNames.includes(person.name));
  personPickerOpen.value = true;
}

function openProjectMemberPicker() {
  if (!projectStageEditable.value) {
    detailMessage.value = projectLockedHint.value;
    return;
  }
  personField.value = null;
  personPickerMode.value = 'projectMember';
  pickedPeople.value = [];
  personPickerOpen.value = true;
}

function closePersonPicker() {
  personPickerOpen.value = false;
}

function confirmPeople(persons: PersonPickerPerson[]) {
  pickedPeople.value = persons;
  if (personPickerMode.value === 'projectMember') {
    if (!projectStageEditable.value) {
      detailMessage.value = projectLockedHint.value;
      personPickerOpen.value = false;
      return;
    }
    const existingNames = new Set(projectMemberRows.value.map((row) => row[0]));
    const addedRows = persons
      .filter((person) => !existingNames.has(person.name))
      .map((person) => [person.name, '参与者', today()]);
    projectExtraMembers.value = [...projectExtraMembers.value, ...addedRows];
    detailMessage.value = addedRows.length ? `已新增 ${addedRows.length} 名项目成员` : '所选成员已在项目成员中';
  } else if (personField.value) {
    genericForm[personField.value.key] = persons.map((person) => person.name).join('、');
  }
  personPickerOpen.value = false;
}

function draftBomNode(patch: Partial<BomNode> = {}): BomNode {
  return {
    id: `bom_node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    code: '',
    name: '请选择物料',
    spec: '',
    type: bomTypeOptions[1] || '',
    unit: bomUnitOptions[1] || '',
    qty: 1,
    loss: 0,
    price: 0,
    processOp: '',
    customAttrs: defaultBomAttrs(),
    variants: { model: [bomVariantOptions[0]] },
    alts: [],
    logs: [],
    children: [],
    ...patch,
  };
}

function defaultBomAttrs() {
  return Object.fromEntries(bomAttrs.value.map((attr) => [attr.key, attr.defaultValue || '']));
}

function normalizeBomNode(node: BomNode): BomNode {
  return {
    alts: [],
    logs: [],
    variants: { model: [bomVariantOptions[0]] },
    ...node,
    customAttrs: { ...defaultBomAttrs(), ...(node.customAttrs || {}) },
    children: (node.children || []).map(normalizeBomNode),
  };
}

function flattenBomRows(nodes: BomNode[], level = 0, prefix = ''): BomFlatRow[] {
  return nodes.flatMap((node, index) => {
    const no = prefix ? `${prefix}.${index + 1}` : String(index + 1);
    const active = isBomVariantActive(node);
    const row: BomFlatRow = { id: node.id, node, level, no, hasChildren: Boolean(node.children?.length), active };
    if (collapsedBomRows[node.id]) return [row];
    return [row, ...flattenBomRows(node.children || [], level + 1, no)];
  });
}

function flattenDetailBomRows(nodes: BomNode[], level = 0, prefix = ''): BomFlatRow[] {
  return nodes.flatMap((node, index) => {
    const no = prefix ? `${prefix}.${index + 1}` : String(index + 1);
    const row: BomFlatRow = { id: node.id, node, level, no, hasChildren: Boolean(node.children?.length), active: true };
    if (detailBomCollapsed[node.id]) return [row];
    return [row, ...flattenDetailBomRows(node.children || [], level + 1, no)];
  });
}

function toggleDetailBomCollapse(id: string) {
  detailBomCollapsed[id] = !detailBomCollapsed[id];
}

function bomVariantText(node: BomNode) {
  return Object.values(node.variants || {}).flat().join(' / ') || '全部型号';
}

function bomAltText(node: BomNode) {
  return node.alts?.length ? node.alts.map((alt) => `${alt.name}(P${alt.priority})`).join(' / ') : '无';
}

function findBomNode(nodes: BomNode[], id: string): BomNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findBomNode(node.children || [], id);
    if (child) return child;
  }
  return null;
}

function updateBomNodes(nodes: BomNode[], id: string, updater: (node: BomNode) => BomNode): BomNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    return { ...node, children: updateBomNodes(node.children || [], id, updater) };
  });
}

function insertBomSibling(nodes: BomNode[], targetId: string, nodeToInsert: BomNode): BomNode[] {
  const next: BomNode[] = [];
  nodes.forEach((node) => {
    next.push(node.id === targetId ? { ...node } : { ...node, children: insertBomSibling(node.children || [], targetId, nodeToInsert) });
    if (node.id === targetId) next.push(nodeToInsert);
  });
  return next;
}

function removeBomFrom(nodes: BomNode[], id: string): BomNode[] {
  return nodes.filter((node) => node.id !== id).map((node) => ({ ...node, children: removeBomFrom(node.children || [], id) }));
}

function addBomRoot() {
  const node = draftBomNode({ type: bomTypeOptions[0], unit: bomUnitOptions[0], name: bomForm.product || '请选择物料' });
  bomTree.value = [...bomTree.value, node];
  selectedBomNodeId.value = node.id;
}

function addBomChild(parentId?: string) {
  if (!parentId) {
    addBomRoot();
    return;
  }
  const node = draftBomNode();
  bomTree.value = updateBomNodes(bomTree.value, parentId, (parent) => ({ ...parent, children: [...(parent.children || []), node] }));
  collapsedBomRows[parentId] = false;
  selectedBomNodeId.value = node.id;
}

function addBomSibling(targetId?: string) {
  if (!targetId) {
    addBomRoot();
    return;
  }
  const node = draftBomNode();
  bomTree.value = insertBomSibling(bomTree.value, targetId, node);
  selectedBomNodeId.value = node.id;
}

function removeBomNode(id: string) {
  bomTree.value = removeBomFrom(bomTree.value, id);
  delete checkedBomRows[id];
  if (selectedBomNodeId.value === id) selectedBomNodeId.value = '';
}

function toggleBomCollapse(id: string) {
  collapsedBomRows[id] = !collapsedBomRows[id];
}

function openBomMaterialPicker(id: string) {
  bomMaterialPickerNodeId.value = id;
  bomMaterialCategory.value = '全部';
  bomMaterialKeyword.value = '';
  pickedBomMaterials.value = [];
  bomMaterialPickerOpen.value = true;
}

function closeBomMaterialPicker() {
  bomMaterialPickerOpen.value = false;
  pickedBomMaterials.value = [];
}

function isBomMaterialPicked(material: BomMaterialOption) {
  return pickedBomMaterials.value.some((item) => item.code === material.code);
}

function toggleBomMaterialPick(material: BomMaterialOption) {
  pickedBomMaterials.value = isBomMaterialPicked(material)
    ? pickedBomMaterials.value.filter((item) => item.code !== material.code)
    : [...pickedBomMaterials.value, material];
}

function materialToBomNode(material: BomMaterialOption) {
  return draftBomNode({
    code: material.code,
    name: material.name,
    spec: material.spec,
    type: material.type,
    unit: material.unit,
    price: material.price,
    customAttrs: defaultBomAttrs(),
  });
}

function confirmBomMaterial() {
  const picked = pickedBomMaterials.value;
  if (!picked.length) return;
  if (!bomMaterialPickerNodeId.value) {
    bomTree.value = [...bomTree.value, ...picked.map(materialToBomNode)];
    closeBomMaterialPicker();
    return;
  }
  const [first, ...rest] = picked;
  bomTree.value = updateBomNodes(bomTree.value, bomMaterialPickerNodeId.value, (node) => ({
    ...node,
    code: first.code,
    name: first.name,
    spec: first.spec,
    type: first.type,
    unit: first.unit,
    price: first.price,
    customAttrs: { ...defaultBomAttrs(), ...(node.customAttrs || {}) },
  }));
  rest.forEach((material) => {
    const sibling = materialToBomNode(material);
    bomTree.value = insertBomSibling(bomTree.value, bomMaterialPickerNodeId.value, sibling);
  });
  closeBomMaterialPicker();
}

function importBomTree() {
  const stamp = Date.now().toString(36);
  const imported = clone(bomImportTree).map((node) => withStampedIds(node, stamp));
  bomTree.value = [...bomTree.value, ...imported.map(normalizeBomNode)];
  selectedBomNodeId.value = imported[0]?.id || '';
  closeBomImport();
  showStructureModal.value = true;
}

function closeBomImport() {
  showImportModal.value = false;
  bomImportStep.value = 1;
}

function enableBomAttr(attr: BomAttrPreset) {
  if (bomAttrs.value.some((item) => item.key === attr.key)) return;
  bomAttrs.value = [...bomAttrs.value, clone(attr)];
  applyBomAttrToNodes(attr);
}

function disableBomAttr(key: string) {
  if (bomAttrs.value.length <= 1) return;
  bomAttrs.value = bomAttrs.value.filter((attr) => attr.key !== key);
}

function moveBomAttr(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= bomAttrs.value.length) return;
  const next = [...bomAttrs.value];
  const [current] = next.splice(index, 1);
  next.splice(target, 0, current);
  bomAttrs.value = next;
}

function addCustomBomAttr() {
  const label = customAttrDraft.label.trim();
  if (!label) return;
  const attr: BomAttrPreset = {
    key: `custom_${Date.now()}`,
    label,
    fieldType: customAttrDraft.fieldType,
    defaultValue: customAttrDraft.defaultValue,
    showInTable: true,
  };
  bomAttrs.value = [...bomAttrs.value, attr];
  applyBomAttrToNodes(attr);
  Object.assign(customAttrDraft, { label: '', fieldType: '文本', defaultValue: '' });
}

function applyBomAttrToNodes(attr: BomAttrPreset) {
  const walk = (nodes: BomNode[]) => {
    nodes.forEach((node) => {
      node.customAttrs = { ...defaultBomAttrs(), ...(node.customAttrs || {}), [attr.key]: node.customAttrs?.[attr.key] || attr.defaultValue || '' };
      walk(node.children || []);
    });
  };
  walk(bomTree.value);
}

function applyBomBatch(action: 'qty' | 'replace' | 'copy' | 'move' | 'delete') {
  const ids = Object.entries(checkedBomRows).filter(([, checked]) => checked).map(([id]) => id);
  if (!ids.length) return;
  if (action === 'delete') {
    ids.forEach((id) => { bomTree.value = removeBomFrom(bomTree.value, id); delete checkedBomRows[id]; });
    bomBatchNotice.value = `已批量删除 ${ids.length} 项。`;
    return;
  }
  if (action === 'qty') {
    ids.forEach((id) => {
      bomTree.value = updateBomNodes(bomTree.value, id, (node) => ({ ...node, qty: toNumber(node.qty) + 1 }));
    });
    bomBatchNotice.value = `已将 ${ids.length} 项用量各增加 1。`;
    return;
  }
  const actionLabels = { replace: '批量替换', copy: '批量复制', move: '批量移动' };
  bomBatchNotice.value = `已触发${actionLabels[action]} mock 反馈。`;
}

function withStampedIds(node: BomNode, stamp: string): BomNode {
  return { ...node, id: `${node.id}_${stamp}`, children: (node.children || []).map((child) => withStampedIds(child, stamp)) };
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function bomGross(node: BomNode) {
  return toNumber(node.qty) * (1 + toNumber(node.loss) / 100);
}

function bomNodeSubtotal(node: BomNode) {
  return bomGross(node) * toNumber(node.price);
}

function bomSubtotal(node: BomNode, multiplier = 1): number {
  if (!isBomVariantActive(node)) return 0;
  const currentQty = multiplier * bomGross(node);
  const own = currentQty * toNumber(node.price);
  return own + (node.children || []).reduce((sum, child) => sum + bomSubtotal(child, currentQty), 0);
}

function calcBomStats(nodes: BomNode[]) {
  let materials = 0;
  let self = 0;
  let buy = 0;
  let levels = 0;
  let hours = 0;
  const walk = (items: BomNode[], level = 1) => {
    items.forEach((node) => {
      if (isBomVariantActive(node)) {
        materials += 1;
        if (['自制', '子装配'].includes(node.type)) self += 1;
        if (['外购', '委外', '原材料', '包装'].includes(node.type)) buy += 1;
        levels = Math.max(levels, level);
        hours += toNumber(node.customAttrs?.workTime);
      }
      walk(node.children || [], level + 1);
    });
  };
  walk(nodes);
  return { materials, self, buy, levels, hours, cost: nodes.reduce((sum, node) => sum + bomSubtotal(node), 0) };
}

function isBomVariantActive(node: BomNode) {
  const allModel = bomVariantOptions[0];
  const picked = node.variants?.model || [allModel];
  return picked.includes(allModel) || picked.includes('任意') || picked.includes(bomSpec.model);
}

function isBomVariantOn(node: BomNode, model: string) {
  const picked = node.variants?.model || [bomVariantOptions[0]];
  return picked.includes(model);
}

function toggleBomVariant(node: BomNode, model: string) {
  const allModel = bomVariantOptions[0];
  const current = node.variants?.model || [allModel];
  if (model === allModel) {
    node.variants = { model: [allModel] };
    return;
  }
  const specific = current.filter((item) => item !== allModel && item !== '任意');
  const next = specific.includes(model) ? specific.filter((item) => item !== model) : [...specific, model];
  node.variants = { model: next.length ? next : [allModel] };
}

function addBomAlt() {
  if (!selectedBomNode.value) return;
  selectedBomNode.value.alts = [...(selectedBomNode.value.alts || []), { code: 'M-ALT', name: '新增替代料', priority: (selectedBomNode.value.alts || []).length + 2 }];
}

function removeBomAlt(index: number) {
  if (!selectedBomNode.value) return;
  selectedBomNode.value.alts = (selectedBomNode.value.alts || []).filter((_, idx) => idx !== index);
}
</script>

<style scoped>
.rd-thumb {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 28px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
}

.rd-textarea {
  min-height: 88px;
  resize: vertical;
}

.rd-tab-card {
  display: grid;
  gap: 14px;
}

.rd-tab-section {
  display: grid;
  gap: 12px;
}

.rd-process-config-card {
  padding: 18px 20px;
}

.rd-process-tabs {
  margin-bottom: 14px;
}

.rd-process-tabs .t {
  border: 0;
  background: transparent;
}

.rd-process-tab-panel {
  padding-top: 2px;
}

.rd-process-switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: var(--aw-fg-2);
  font-size: 13px;
}

.rd-process-switch-row .aw-switch {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--aw-success);
  border-radius: 999px;
  cursor: pointer;
  display: inline-block;
  flex: none;
  transition: background .15s;
}

.rd-process-switch-row .aw-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .15);
  transition: all .15s;
}

.rd-process-switch-row .aw-switch.off {
  background: #D1D5DB;
}

.rd-process-switch-row .aw-switch.off::after {
  left: 2px;
  right: auto;
}

.rd-process-switch-row em {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
}

.rd-process-hours-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.rd-process-config-card .aw-input,
.rd-process-config-card .aw-select {
  background: #F5F6FA;
  border-color: transparent;
}

.rd-process-config-card .aw-input:focus,
.rd-process-config-card .aw-select:focus {
  background: #fff;
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 3px rgba(86, 119, 252, .12);
}

.rd-unit-field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rd-unit-field .aw-input {
  flex: 1;
}

.rd-table-summary-row td {
  text-align: left;
  background: #FFF4F2;
}

.rd-table-summary-items {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 36px;
  color: var(--aw-fg-1);
  font-weight: 600;
}

.rd-table-summary-value {
  color: #D92D20;
  font-weight: 700;
  margin-left: 2px;
}

.aw-doc-tbl td.rd-purple-blue-cell {
  color: var(--aw-primary);
  font-weight: 600;
}

.rd-unit-field span {
  color: var(--aw-fg-3);
  font-size: 13px;
  white-space: nowrap;
}

.rd-process-table-wrap {
  border-radius: 6px;
  overflow: auto;
}

.rd-process-jsx-table {
  width: 100%;
}

.rd-process-jsx-table th,
.rd-process-jsx-table td {
  padding: 9px 12px;
}

.rd-process-jsx-table .aw-input {
  min-width: 160px;
}

.rd-process-action-row {
  margin-top: 12px;
}

.rd-process-action-row.is-top {
  margin: 0 0 12px;
}

.rd-process-action-row .aw-btn {
  width: auto;
}

.rd-project-detail {
  display: grid;
  gap: 14px;
}

.rd-project-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.rd-project-action-row.spread {
  justify-content: space-between;
}

.rd-project-empty {
  text-align: center;
  padding: 54px 24px;
  border: 1px dashed var(--aw-border-strong);
  border-radius: 6px;
  background: #fff;
}

.rd-project-empty strong,
.rd-project-empty span {
  display: block;
}

.rd-project-empty strong {
  color: var(--aw-fg-1);
  font-size: 16px;
  margin-bottom: 10px;
}

.rd-project-empty span {
  color: var(--aw-fg-3);
  font-size: 13px;
  margin-bottom: 18px;
}

.rd-project-empty div {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.rd-project-hint {
  margin-top: 10px;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-project-intro {
  color: var(--aw-fg-2);
  font-size: 13px;
  line-height: 1.8;
  margin-bottom: 14px;
}

.rd-project-intro b {
  color: var(--aw-primary);
}

.rd-project-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.rd-project-metrics > div {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  padding: 12px 14px;
  background: #fff;
}

.rd-project-metrics span {
  display: block;
  color: var(--aw-fg-3);
  font-size: 12px;
  margin-bottom: 6px;
}

.rd-project-metrics strong {
  color: var(--aw-fg-1);
  font-family: var(--aw-font-num);
  font-size: 18px;
}

.rd-project-metrics .primary strong {
  color: var(--aw-primary);
}

.rd-project-metrics .aw-input {
  max-width: 180px;
  height: 32px;
  padding: 4px 8px;
  color: var(--aw-fg-1);
  font-size: 18px;
  font-weight: 700;
}

.rd-project-modal .body {
  padding: 16px 18px;
}

.rd-project-modal .foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--aw-divider);
  background: var(--aw-surface-2);
}

.rd-project-route-modal {
  width: min(1520px, calc(100vw - 76px));
  height: min(900px, calc(100vh - 76px));
  max-height: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rd-project-route-modal .head,
.rd-project-route-modal .foot {
  flex: none;
}

.rd-project-route-modal .body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 14px;
  background: #f4f6fa;
  overflow: hidden;
}

.rd-project-route-modal .foot {
  height: 56px;
}

.rd-project-route-editor {
  flex: 1;
  min-height: 0;
  display: flex;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  overflow: hidden;
}

.rd-project-route-palette {
  width: 240px;
  flex: none;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--aw-divider);
  background: #fafbfc;
}

.rd-route-palette-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--aw-divider);
  color: var(--aw-fg-1);
  font-size: 13px;
  font-weight: 600;
}

.rd-route-palette-head span {
  padding: 1px 5px;
  border: 1px solid var(--aw-divider);
  border-radius: 3px;
  background: #fff;
  color: var(--aw-fg-4);
  font-size: 10px;
  font-weight: 400;
}

.rd-route-search {
  height: 49px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--aw-divider);
}

.rd-route-search span {
  color: var(--aw-fg-4);
  font-size: 14px;
}

.rd-route-search input {
  flex: 1;
  height: 28px;
  min-width: 0;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  padding: 0 9px;
  outline: 0;
  color: var(--aw-fg-1);
  font: inherit;
  font-size: 12px;
}

.rd-route-tabs {
  display: flex;
  gap: 4px;
  padding: 4px 12px;
  border-bottom: 1px solid var(--aw-divider);
}

.rd-route-tabs button {
  flex: 1;
  border: 0;
  border-radius: 4px;
  padding: 6px 0;
  background: transparent;
  color: var(--aw-fg-3);
  cursor: pointer;
  font-size: 12px;
}

.rd-route-tabs button.on {
  background: #fff;
  color: var(--aw-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(16, 24, 40, .04);
}

.rd-route-template-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 8px;
}

.rd-route-group + .rd-route-group {
  margin-top: 10px;
}

.rd-route-group-head {
  display: flex;
  justify-content: space-between;
  padding: 3px 6px 7px;
  color: var(--aw-fg-4);
  font-size: 12px;
}

.rd-route-group-head span {
  color: var(--aw-fg-4);
}

.rd-route-template-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 6px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  padding: 9px;
  background: #fff;
  color: var(--aw-fg-2);
  cursor: pointer;
  text-align: left;
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}

.rd-route-template-card:hover {
  border-color: var(--aw-primary);
  box-shadow: 0 4px 12px rgba(86, 119, 252, .12);
  transform: translateY(-1px);
}

.rd-route-template-card i {
  width: 28px;
  height: 28px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}

.rd-route-template-card i.in {
  background: var(--aw-tint-sky);
  color: #2e4a85;
}

.rd-route-template-card i.out {
  background: var(--aw-tint-peach);
  color: #b26a24;
}

.rd-route-template-card span {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.rd-route-template-card b {
  overflow: hidden;
  color: var(--aw-fg-1);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rd-route-template-card em {
  overflow: hidden;
  color: var(--aw-fg-4);
  font-size: 11px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rd-project-empty-text {
  padding: 18px 8px;
  color: var(--aw-fg-4);
  font-size: 12px;
  text-align: center;
}

.rd-project-route-canvas {
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: auto;
  padding: 28px 28px 60px;
  background: #f5f6fa;
  background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
  background-size: 16px 16px;
}

.rd-route-canvas-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  margin-bottom: 18px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(16, 24, 40, .04);
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-route-canvas-bar span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.rd-route-canvas-bar .sw {
  width: 12px;
  height: 12px;
  display: inline-block;
  border-radius: 3px;
}

.rd-route-canvas-bar .sw.in {
  border: 1.5px solid #5677fc;
  background: var(--aw-tint-sky);
}

.rd-route-canvas-bar .sw.out {
  border: 1.5px solid #d97706;
  background: var(--aw-tint-peach);
}

.rd-route-canvas-bar .sw.seq {
  width: 24px;
  height: 2px;
  background: #5677fc;
}

.rd-route-canvas-bar .sw.par {
  width: 24px;
  height: 8px;
  border: 1.5px dashed #10b981;
  background: #fff;
}

.rd-route-zoom {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rd-route-zoom button {
  height: 24px;
  min-width: 24px;
  border: 1px solid var(--aw-border);
  border-radius: 4px;
  background: #fff;
  color: var(--aw-fg-2);
  cursor: pointer;
  font-size: 12px;
}

.rd-route-zoom span {
  min-width: 36px;
  justify-content: center;
  color: var(--aw-fg-2);
}

.rd-route-flow {
  min-width: 760px;
  display: flex;
  align-items: center;
  padding: 28px 8px 12px;
}

.rd-route-start {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-route-start span {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #ecfdf5;
  color: #047857;
  font-weight: 600;
}

.rd-route-start i,
.rd-route-line i {
  display: block;
  width: 32px;
  height: 2px;
  background: #5677fc;
}

.rd-route-line {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.rd-route-op-card {
  width: 190px;
  min-height: 112px;
  position: relative;
  border: 1.5px solid #d9e0ff;
  border-radius: 8px;
  padding: 12px 12px 10px;
  background: #fff;
  color: var(--aw-fg-2);
  cursor: pointer;
  text-align: left;
  box-shadow: 0 6px 18px rgba(16, 24, 40, .06);
}

.rd-route-op-card.out {
  border-color: #fed7aa;
}

.rd-route-op-card.selected {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 3px rgba(86, 119, 252, .12), 0 10px 24px rgba(16, 24, 40, .08);
}

.rd-route-op-card .no {
  position: absolute;
  left: 10px;
  top: -12px;
  min-width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--aw-primary);
  color: #fff;
  font-family: var(--aw-font-num);
  font-size: 12px;
}

.rd-route-op-card .head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 6px;
  margin-bottom: 9px;
  border: 0;
  padding: 0;
}

.rd-route-op-card .head b,
.rd-route-op-card .head strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rd-route-op-card .head b {
  grid-column: 1;
  color: var(--aw-primary);
  font-family: var(--aw-font-num);
  font-size: 12px;
}

.rd-route-op-card .head strong {
  grid-column: 1;
  color: var(--aw-fg-1);
  font-size: 13px;
}

.rd-route-op-card .head em {
  grid-column: 2;
  grid-row: 1 / span 2;
  color: var(--aw-fg-4);
  font-size: 16px;
  font-style: normal;
  line-height: 1;
}

.rd-route-op-card p {
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--aw-fg-3);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rd-route-add {
  width: 150px;
  height: 80px;
  border: 1px dashed var(--aw-border-strong);
  border-radius: 8px;
  background: rgba(255, 255, 255, .68);
  color: var(--aw-fg-4);
  cursor: pointer;
  font-size: 12px;
}

.rd-project-route-props {
  width: 340px;
  flex: none;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--aw-divider);
  background: #fff;
}

.rd-route-props-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--aw-divider);
  color: var(--aw-fg-1);
  font-size: 13px;
  font-weight: 600;
}

.rd-route-props-head .type {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.6;
}

.rd-route-props-head .type.in {
  background: var(--aw-tint-sky);
  color: #2e4a85;
}

.rd-route-props-head .type.out {
  background: var(--aw-tint-peach);
  color: #b26a24;
}

.rd-route-props-head strong {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rd-route-props-head em {
  color: var(--aw-fg-4);
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
}

.rd-route-props-tabs {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid var(--aw-divider);
  padding: 0 8px;
}

.rd-route-props-tabs span {
  position: relative;
  padding: 9px 8px;
  color: var(--aw-fg-3);
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.rd-route-props-tabs span.on {
  color: var(--aw-primary);
  font-weight: 600;
}

.rd-route-props-tabs span.on::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: -1px;
  height: 2px;
  background: var(--aw-primary);
}

.rd-route-props-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px;
}

.rd-route-props-body label {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  color: var(--aw-fg-2);
  font-size: 12px;
}

.rd-route-props-body .aw-input,
.rd-route-props-body .aw-select {
  width: 100%;
}

.rd-route-props-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--aw-divider);
  background: var(--aw-surface-2);
}

.rd-project-route-summary {
  flex: none;
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
  color: var(--aw-fg-2);
  font-size: 12px;
}

.rd-project-route-summary span {
  font-family: var(--aw-font-num);
}

.rd-project-picker {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  min-height: 420px;
}

.rd-project-picker > .aw-doc-tree {
  width: auto;
  border-right: 1px solid var(--aw-border);
  border-radius: 0;
  background: var(--aw-surface-2);
}

.rd-project-picker-main {
  min-width: 0;
  padding-left: 14px;
}

.rd-project-search {
  margin-bottom: 12px;
}

.rd-project-modal-section + .rd-project-modal-section {
  margin-top: 18px;
}

.rd-project-modal .aw-form-grid.single {
  grid-template-columns: 1fr;
}

.rd-project-upload {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 180px;
  border: 1px dashed var(--aw-border-strong);
  border-radius: 6px;
  color: var(--aw-fg-3);
  text-align: center;
}

.rd-project-upload strong {
  color: var(--aw-fg-1);
  font-size: 14px;
}

.rd-danger-link {
  color: #F5222D;
  font-size: 12px;
}

.rd-process-empty-box {
  border: 1px dashed #D1D5DB;
  border-radius: 6px;
  padding: 24px;
  text-align: center;
  color: #6B7280;
  font-size: 13px;
}

.rd-process-empty-cell {
  text-align: center;
  color: var(--aw-fg-3);
  padding: 24px 12px !important;
  font-size: 13px;
}

.rd-process-help-text {
  margin-bottom: 12px;
  color: var(--aw-fg-3);
  font-size: 13px;
}

.rd-process-img-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #E5E7EB;
  color: #9CA3AF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.rd-process-picker-modal .body {
  padding: 0;
}

.rd-doc-category-modal {
  width: min(1040px, calc(100vw - 56px));
}

.rd-doc-category-modal .body {
  padding: 16px;
}

.rd-doc-category-picker {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;
  min-height: 380px;
}

.rd-source-picker {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 14px;
  min-height: 320px;
}

.rd-source-picker-side {
  min-height: 320px;
}

.rd-source-picker-main {
  min-width: 0;
}

.rd-doc-category-tree {
  width: auto;
  min-height: 380px;
}

.rd-doc-category-main {
  min-width: 0;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.rd-doc-category-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--aw-divider);
}

.rd-doc-category-head strong,
.rd-doc-category-head span {
  display: block;
}

.rd-doc-category-head strong {
  color: var(--aw-fg-1);
  font-size: 14px;
}

.rd-doc-category-head span {
  color: var(--aw-fg-3);
  font-size: 12px;
  margin-top: 3px;
}

.rd-doc-category-table-wrap {
  max-height: 318px;
}

.rd-process-picker-modal.is-qc {
  width: min(1240px, calc(100vw - 56px));
}

.rd-process-picker-modal .foot {
  padding: 12px 20px;
  border-top: 1px solid var(--aw-divider);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  background: var(--aw-surface-2);
  flex: none;
}

.rd-process-picker-layout {
  min-height: 360px;
}

.rd-process-picker-layout.with-tree {
  display: grid;
  grid-template-columns: 170px 1fr;
  gap: 14px;
  padding: 14px 18px;
}

.rd-process-picker-modal.is-qc .rd-process-picker-layout.with-tree {
  grid-template-columns: 170px minmax(0, 1fr);
}

.rd-process-picker-layout:not(.with-tree) {
  display: block;
}

.rd-process-picker-tree {
  border-radius: 6px;
}

.rd-process-picker-tree .aw-tree-row {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
}

.rd-process-picker-main {
  min-width: 0;
}

.rd-process-picker-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #F0F1F4;
}

.rd-process-picker-layout.with-tree .rd-process-picker-toolbar {
  padding: 0 0 12px;
  border-bottom: 0;
}

.rd-process-picker-toolbar > span {
  color: #5677FC;
  font-size: 13px;
  font-weight: 500;
}

.rd-process-picker-search {
  margin-left: auto;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 4px 8px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.rd-process-picker-search span {
  color: var(--aw-fg-4);
  font-size: 14px;
}

.rd-process-picker-search input {
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--aw-fg-1);
  width: 180px;
}

.rd-process-picker-layout.with-tree .rd-process-picker-search input {
  width: 240px;
}

.rd-process-picker-table-wrap {
  overflow-x: auto;
}

.rd-process-picker-modal.is-qc .rd-process-picker-table-wrap {
  max-width: 100%;
}

.rd-process-picker-layout:not(.with-tree) .rd-process-picker-table-wrap {
  max-height: 390px;
}

.rd-process-picker-table tbody tr {
  cursor: pointer;
}

.rd-center {
  text-align: center;
  justify-content: center;
}

.aw-chk {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #C9D0DA;
  border-radius: 3px;
  background: #fff;
  vertical-align: middle;
}

.aw-chk.on {
  border-color: var(--aw-primary);
  background: var(--aw-primary);
}

.aw-chk.on::after {
  content: "";
  width: 7px;
  height: 4px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg) translateY(-1px);
}

.aw-chk.indet {
  border-color: var(--aw-primary);
  background: var(--aw-primary);
}

.aw-chk.indet::after {
  content: "";
  width: 8px;
  height: 2px;
  border-radius: 2px;
  background: #fff;
}

.rd-process-config-card .aw-badge.g,
.rd-process-picker-modal .aw-badge.g {
  background: var(--aw-tint-mint);
  color: var(--aw-success);
}

.rd-process-config-card .aw-badge.y,
.rd-process-picker-modal .aw-badge.y {
  background: var(--aw-tint-peach);
  color: #B26A24;
}

.rd-rich-lead-grid {
  margin-bottom: 14px;
}

.rd-model-config,
.rd-structure-entry {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--aw-divider);
}

.rd-mini-title {
  font-weight: 600;
  color: var(--aw-fg-1);
}

.rd-muted {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-chip-list,
.rd-variant-card,
.rd-table-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rd-chip {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
  color: var(--aw-fg-2);
  padding: 4px 10px;
  font-size: 12px;
}

.rd-chip.on {
  border-color: var(--aw-primary);
  background: rgba(37, 99, 235, .08);
  color: var(--aw-primary);
}

.rd-chip.tiny {
  padding: 2px 6px;
  margin: 1px;
}

.rd-summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.rd-summary-card {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 12px 14px;
}

.rd-summary-card span {
  display: block;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-summary-card strong {
  display: block;
  margin-top: 4px;
  color: var(--aw-fg-1);
  font-size: 20px;
}

.rd-picker-body {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 14px;
}

.rd-picker-side {
  border-right: 1px solid var(--aw-divider);
  padding-right: 12px;
}

.rd-picker-tree-row {
  width: 100%;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  color: var(--aw-fg-2);
}

.rd-picker-tree-row.on {
  background: rgba(37, 99, 235, .08);
  color: var(--aw-primary);
}

.rd-picker-main {
  min-width: 0;
}

.rd-material-picker,
.rd-attr-layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 14px;
}

.aw-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 49;
  background: rgba(16, 24, 40, .32);
}

.aw-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 50;
  width: min(760px, calc(100vw - 52px));
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: -18px 0 46px rgba(16, 24, 40, .22);
}

.bn-drawer-h {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--aw-divider);
  flex: none;
}

.bn-drawer-mark {
  width: 4px;
  height: 14px;
  margin-top: 3px;
  border-radius: 2px;
  background: var(--aw-primary);
}

.bn-drawer-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--aw-fg-1);
  line-height: 1.3;
}

.bn-drawer-sub {
  margin-top: 3px;
  font-size: 12px;
  color: var(--aw-fg-3);
}

.bn-drawer-close {
  margin-left: auto;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--aw-fg-4);
  font-size: 18px;
}

.bn-drawer-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 20px;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
}

.bn-drawer-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--aw-divider);
  background: var(--aw-surface-2);
}

.rd-material-cats,
.rd-attr-library {
  border-right: 1px solid var(--aw-divider);
  padding-right: 12px;
}

.rd-material-main,
.rd-attr-enabled {
  min-width: 0;
}

.rd-picker-search {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rd-picker-search .aw-input {
  max-width: 360px;
}

.rd-attr-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 9px;
  margin-top: 8px;
  background: #fff;
}

.rd-attr-card span {
  display: block;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-custom-attr {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.rd-sort-btn {
  min-width: 28px;
  padding: 0 6px;
}

:global(.aw-modal.rd-structure-wide) {
  width: min(1480px, calc(100vw - 44px));
  height: min(900px, calc(100vh - 44px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:global(.aw-modal.rd-structure-wide .body) {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 20px;
  background: var(--aw-bg);
}

:global(.aw-modal.rd-material-modal) {
  width: min(960px, calc(100vw - 44px));
}

.bn-create-steps {
  display: flex;
  align-items: stretch;
  gap: 14px;
  margin-bottom: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
}

.bn-step-track {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.bn-step {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  color: var(--aw-fg-2);
}

.bn-step.current {
  border-color: var(--aw-primary);
  background: rgba(37, 99, 235, .06);
}

.bn-step.done {
  border-color: rgba(37, 99, 235, .2);
}

.bn-step .dot {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--aw-border);
  color: var(--aw-fg-3);
  font-size: 12px;
  flex: none;
}

.bn-step.current .dot,
.bn-step.done .dot {
  background: var(--aw-primary);
  border-color: var(--aw-primary);
  color: #fff;
}

.bn-step .name {
  font-size: 13px;
  font-weight: 600;
  color: var(--aw-fg-1);
  white-space: nowrap;
}

.bn-variant-card {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
}

.bn-variant-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}

.bn-variant-label {
  font-size: 13px;
  color: var(--aw-fg-2);
  font-weight: 500;
}

.rd-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.rd-ios-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: #d1d5db;
  cursor: pointer;
  vertical-align: middle;
  transition: background .18s ease;
}

.rd-ios-switch input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

.rd-ios-switch span {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, .24);
  transition: transform .18s ease;
}

.rd-ios-switch:has(input:checked) {
  background: #34c759;
}

.rd-ios-switch:has(input:checked) span {
  transform: translateX(18px);
}

.bn-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: min(620px, calc(100vh - 360px));
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  overflow: hidden;
  transition: grid-template-columns .2s;
}

.bn-editor.with-panel {
  grid-template-columns: minmax(0, 65%) minmax(340px, 35%);
}

.bn-table-wrap {
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid transparent;
}

.bn-editor.with-panel .bn-table-wrap {
  border-right-color: var(--aw-divider);
}

.bn-editor-h {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--aw-divider);
  background: #fff;
}

.bn-table-scroll {
  overflow: auto;
  height: calc(100% - 65px);
}

.bn-table {
  width: 100%;
  min-width: 1580px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  color: var(--aw-fg-1);
  font-variant-numeric: tabular-nums;
}

.bn-table th {
  position: sticky;
  top: 0;
  z-index: 3;
  height: 38px;
  padding: 0 10px;
  border-bottom: 1px solid var(--aw-border);
  background: var(--aw-surface-2);
  color: var(--aw-fg-2);
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
}

.bn-table td {
  height: 42px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--aw-divider);
  background: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.bn-table tbody tr:hover td {
  background: var(--aw-bg);
}

.bn-table tr.selected td {
  background: rgba(37, 99, 235, .06);
}

.bn-table tr.inactive td {
  opacity: .45;
}

.bn-table th:first-child,
.bn-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 2;
  background: inherit;
}

.bn-table th:last-child,
.bn-table td:last-child {
  position: sticky;
  right: 0;
  z-index: 2;
  background: inherit;
  box-shadow: -8px 0 12px -12px rgba(16, 24, 40, .32);
}

.bn-table thead th:first-child,
.bn-table thead th:last-child {
  z-index: 4;
  background: var(--aw-surface-2);
}

.rd-row-no {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.rd-caret {
  width: 18px;
  border: 0;
  background: transparent;
  color: var(--aw-fg-2);
}

.rd-caret.empty {
  display: inline-block;
}

.rd-material-btn {
  display: grid;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  color: var(--aw-fg-1);
}

.rd-material-btn span {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-num-input {
  width: 74px;
}

.rd-small-select {
  width: 76px;
}

.rd-process-select {
  width: 126px;
}

.rd-attr-input {
  width: 98px;
}

.rd-alt {
  color: var(--aw-primary);
  font-size: 12px;
}

.bn-empty-builder {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--aw-fg-3);
}

.bn-empty-title {
  color: var(--aw-fg-1);
  font-weight: 700;
  font-size: 15px;
}

.bn-empty-text {
  font-size: 13px;
}

.bn-empty-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bn-props {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #fff;
  overflow: hidden;
}

.bn-props-h {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--aw-divider);
  font-size: 13px;
  font-weight: 600;
}

.bn-props-h .code {
  font-size: 11px;
  color: var(--aw-fg-4);
  font-weight: 400;
}

.bn-props-h .close {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  font-size: 16px;
  color: var(--aw-fg-3);
}

.bn-props-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px;
}

.bn-props-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid var(--aw-divider);
  background: var(--aw-surface-2);
}

.rd-prop-grid {
  display: grid;
  gap: 10px;
}

.rd-prop-grid label {
  display: grid;
  gap: 5px;
  color: var(--aw-fg-2);
  font-size: 12px;
}

.rd-alt-list,
.rd-change-list {
  display: grid;
  gap: 10px;
}

.rd-alt-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 70px 38px;
  gap: 8px;
  align-items: center;
}

.rd-import-box,
.rd-preview-text {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 14px;
  background: var(--aw-surface-2);
  color: var(--aw-fg-2);
  line-height: 1.7;
}

.rd-import-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}

.rd-import-steps span {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 10px;
  color: var(--aw-fg-3);
  background: #fff;
}

.rd-import-steps span.on {
  border-color: var(--aw-primary);
  background: rgba(37, 99, 235, .08);
  color: var(--aw-primary);
}

.rd-import-steps span.done {
  border-color: rgba(22, 163, 74, .3);
  background: rgba(22, 163, 74, .08);
  color: #15803d;
}

.rd-import-textarea {
  min-height: 150px;
  margin-top: 10px;
  font-family: Consolas, monospace;
}

.rd-bom-batch {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
}

.rd-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.rd-preview-grid {
  margin-bottom: 14px;
}

.rd-detail-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.rd-detail-metric {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 12px 14px;
}

.rd-detail-metric span {
  display: block;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-detail-metric strong {
  display: block;
  margin-top: 5px;
  color: var(--aw-fg-1);
  font-size: 20px;
}

.rd-detail-metric.primary strong {
  color: var(--aw-primary);
}

.rd-detail-metric.green strong {
  color: #15803d;
}

.rd-detail-metric.yellow strong {
  color: #b45309;
}

.rd-detail-section {
  margin-top: 16px;
}

.rd-detail-rich {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-surface-2);
  padding: 14px;
  color: var(--aw-fg-2);
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.rd-attach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.rd-attach-card {
  display: grid;
  gap: 5px;
  border: 1px dashed var(--aw-border-strong);
  border-radius: 8px;
  background: #fff;
  padding: 12px 14px;
  font-size: 12px;
  color: var(--aw-fg-3);
}

.rd-attach-card strong {
  color: var(--aw-fg-1);
  font-size: 13px;
}

.rd-attach-card div {
  display: flex;
  gap: 14px;
  margin-top: 6px;
}

.rd-timeline {
  display: grid;
  gap: 0;
}

.rd-timeline-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  padding: 10px 0;
}

.rd-timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--aw-primary);
  margin-top: 5px;
}

.rd-timeline-row div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--aw-fg-2);
  font-size: 13px;
}

.rd-timeline-row em {
  flex-basis: 100%;
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
}

.rd-bom-detail-table {
  min-width: 1480px;
}

.rd-bom-rowno {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.rd-caret.ghost {
  display: inline-block;
}

.rd-craft-detail {
  display: grid;
  gap: 14px;
}

.rd-craft-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-craft-legend i {
  display: inline-block;
  width: 18px;
  height: 8px;
  border-radius: 4px;
  margin-right: 5px;
  vertical-align: middle;
}

.rd-craft-legend .in {
  background: #22c55e;
}

.rd-craft-legend .out {
  background: #f59e0b;
}

.rd-craft-legend .seq {
  height: 2px;
  background: var(--aw-primary);
}

.rd-craft-legend .par {
  border: 1px dashed #10b981;
  background: #fff;
}

.rd-craft-flow {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 12px 2px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
}

.rd-craft-stage {
  position: relative;
  display: grid;
  gap: 8px;
  min-width: 172px;
  padding: 24px 10px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
}

.rd-craft-stage.par {
  border-color: #a7f3d0;
  border-style: dashed;
}

.rd-stage-no {
  position: absolute;
  top: 6px;
  left: 10px;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-craft-op {
  display: grid;
  gap: 6px;
  min-width: 150px;
  border: 1px solid #22c55e;
  border-radius: 8px;
  background: #f0fdf4;
  padding: 10px;
  cursor: pointer;
}

.rd-craft-op.out {
  border-color: #f59e0b;
  background: #fffbeb;
}

.rd-craft-op.selected {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .16);
}

.rd-craft-op div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--aw-fg-1);
}

.rd-craft-op p {
  margin: 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.rd-craft-panel {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}

.rd-craft-subtables {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

tr.picked td {
  background: rgba(37, 99, 235, .08);
}

@media (max-width: 1100px) {
  .rd-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rd-bom-editor,
  .rd-picker-body,
  .rd-material-picker,
  .rd-attr-layout,
  .rd-compare,
  .rd-craft-subtables {
    grid-template-columns: 1fr;
  }

  .rd-material-cats,
  .rd-attr-library {
    border-right: 0;
    border-bottom: 1px solid var(--aw-divider);
    padding-right: 0;
    padding-bottom: 12px;
  }

  .rd-import-steps {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
