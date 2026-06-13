<template>
  <aw-setting-page>
    <template #toolbar>
      <aw-setting-toolbar
        back-text="返回质检设置"
        :add-text="current.addText"
        :editor-mode="currentKey === 'approvals' && showApprovalEditor"
        :show-add="currentKey !== 'strategies'"
        @add="addRow"
        @back="router.push('/qc/standards')"
        @cancel="closeApprovalEditor"
        @save="saveApprovalRule"
      />
    </template>

    <aw-setting-split-page v-if="currentKey === 'groups'">
      <template #tree>
        <aw-setting-tree
          add-title="新增质检方案分组"
          :active-key="activeRootId"
          :items="groupTreeItems"
          show-add
          title="质检方案分组"
          @add="showRootModal = true"
          @select="selectRoot"
        />
      </template>
      <aw-setting-list-card
        v-model:keyword="keyword"
        :description="activeRoot?.remark || '暂无分组备注'"
        search-placeholder="搜索二级分类名称/编号"
        :title="activeRoot?.name || '质检方案分组'"
      >
        <div class="aw-doc-tbl-wrap">
          <div class="aw-doc-tbl-inner">
            <table class="aw-doc-tbl">
              <thead>
                <tr>
                  <th style="width:70px">序号</th>
                  <th>二级分类名称</th>
                  <th>上级分组</th>
                  <th>分类编号</th>
                  <th style="width:110px">方案数量</th>
                  <th style="width:90px">状态</th>
                  <th style="width:150px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in filteredGroupRows" :key="row.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.parent }}</td>
                  <td>{{ row.code }}</td>
                  <td>{{ row.schemeCount || 0 }}</td>
                  <td><label class="aw-switch-line mini"><input :checked="row.enabled" type="checkbox" @change="toggleEnabled(row, $event, '质检方案分类')" /><i></i></label></td>
                  <td>
                    <span class="aw-link">编辑</span><span class="aw-action-split">|</span>
                    <span class="aw-link" style="color:var(--aw-danger)" @click="removeRow(row.id)">删除</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </aw-setting-list-card>
    </aw-setting-split-page>

    <aw-setting-split-page v-else-if="currentKey === 'fields'">
      <template #tree>
        <aw-setting-tree
          :active-key="activeFieldScope"
          :items="fieldTreeItems"
          title="字段位置"
          @select="selectFieldScope"
        />
      </template>
      <aw-setting-list-card
        v-model:keyword="keyword"
        description="配置要显示在当前区域内的质检自定义字段。"
        search-placeholder="搜索字段名称/编码"
        :title="activeFieldScope"
      >
        <div class="aw-doc-tbl-wrap">
          <div class="aw-doc-tbl-inner">
            <table class="aw-doc-tbl">
              <thead>
                <tr>
                  <th style="width:70px">序号</th>
                  <th>字段名称</th>
                  <th>字段编码</th>
                  <th>字段类型</th>
                  <th style="width:110px">是否必填</th>
                  <th style="width:110px">是否启用</th>
                  <th style="width:150px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in filteredFieldRows" :key="row.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.code }}</td>
                  <td>{{ row.type }}</td>
                  <td><label class="aw-switch-line mini"><input v-model="row.required" type="checkbox" true-value="是" false-value="否" /><i></i></label></td>
                  <td><label class="aw-switch-line mini"><input :checked="row.enabled" type="checkbox" @change="toggleEnabled(row, $event, '质检自定义字段')" /><i></i></label></td>
                  <td>
                    <span class="aw-link">编辑</span><span class="aw-action-split">|</span>
                    <span class="aw-link" style="color:var(--aw-danger)" @click="removeRow(row.id)">删除</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </aw-setting-list-card>
    </aw-setting-split-page>

    <section v-else-if="currentKey === 'numbers'" class="aw-code-builder">
      <section class="aw-form-card aw-code-preview-card">
        <div class="aw-code-preview-hero">
          <div class="aw-barcode" aria-hidden="true"></div>
          <div>
            <span>当前样式：</span>
            <strong>
              <span class="aw-code-preview-prefix">{{ numberPrefix }}{{ numberRestPreview ? numberSeparator : '' }}</span><span v-if="numberRestPreview" class="aw-code-preview-items">{{ numberRestPreview }}</span>
            </strong>
          </div>
        </div>
        <div class="aw-code-picked-head">
          <strong>已选编号项</strong>
          <span>{{ selectedNumberItems.length + 1 }} / 5</span>
        </div>
        <div class="aw-code-picked fixed">
          <span class="aw-line-icon line-lock"></span>
          <strong>前缀</strong>
          <input v-model="numberPrefix" />
          <label class="aw-switch-line mini"><em>搜索项</em><input v-model="numberSearchFlags.prefix" type="checkbox" /><i></i></label>
        </div>
        <div v-if="!selectedNumberItems.length" class="aw-code-empty">暂未选择编号项</div>
        <div
          v-for="(key, index) in selectedNumberItems"
          :key="key"
          class="aw-code-picked"
          draggable="true"
          @dragstart="numberDragIndex = index"
          @dragover.prevent
          @drop="dropNumberItem(index)"
          @dragend="numberDragIndex = null"
        >
          <span class="aw-code-drag">⠿</span>
          <strong>{{ numberCandidateMap[key]?.label }}</strong>
          <template v-if="key === 'cc1' || key === 'cc2'">
            <input v-model="numberLabelValues[key]" />
            <input v-model="numberCodeValues[key]" />
          </template>
          <label class="aw-switch-line mini"><em>搜索项</em><input v-model="numberSearchFlags[key]" type="checkbox" /><i></i></label>
          <button type="button" @click="removeNumberItem(key)">×</button>
        </div>
      </section>
      <section class="aw-form-card aw-code-config-card">
        <div class="aw-code-rule-grid">
          <label class="aw-field"><span><b>*</b>规则名称</span><input placeholder="填写编号规则名称" /></label>
          <label class="aw-field"><span><b>*</b>规则编码</span><input placeholder="填写编号规则编码" /></label>
          <label class="aw-field"><span>间隔符</span><input v-model="numberSeparator" /></label>
        </div>
        <div class="aw-divider-line"></div>
        <div class="aw-detail-section-title">编号项</div>
        <p class="aw-setting-note">前缀固定占 1 个名额，其余最多选择 4 项</p>
        <div class="aw-code-candidates">
          <button class="aw-code-card fixed" type="button">
            <em>1</em><strong>前缀</strong><span>预览值：{{ numberPrefix }}</span><i class="aw-line-icon line-lock"></i>
          </button>
          <button
            v-for="item in numberCandidates.slice(0, 6)"
            :key="item.k"
            :class="['aw-code-card', { on: selectedNumberItems.includes(item.k) }]"
            :disabled="selectedNumberItems.length >= 4 && !selectedNumberItems.includes(item.k)"
            type="button"
            @click="toggleNumberItem(item.k)"
          >
            <em v-if="selectedNumberItems.includes(item.k)">{{ selectedNumberItems.indexOf(item.k) + 2 }}</em>
            <strong>{{ item.label }}</strong>
            <span>{{ item.preview }}</span>
          </button>
        </div>
        <div class="aw-divider-line"></div>
        <div class="aw-setting-note">扩展项</div>
        <div class="aw-code-candidates">
          <button
            v-for="item in numberCandidates.slice(6)"
            :key="item.k"
            :class="['aw-code-card', { on: selectedNumberItems.includes(item.k) }]"
            :disabled="selectedNumberItems.length >= 4 && !selectedNumberItems.includes(item.k)"
            type="button"
            @click="toggleNumberItem(item.k)"
          >
            <em v-if="selectedNumberItems.includes(item.k)">{{ selectedNumberItems.indexOf(item.k) + 2 }}</em>
            <strong>{{ item.label }}</strong>
            <span>{{ item.preview }}</span>
          </button>
        </div>
      </section>
      <div class="aw-code-footer">
        <button class="aw-tool-btn" type="button" @click="resetNumberRule">重置</button>
        <button class="aw-btn primary" type="button">保存</button>
      </div>
    </section>

    <aw-approval-rule-editor
      v-else-if="currentKey === 'approvals' && showApprovalEditor"
      v-model:name="approvalForm.name"
      :active-index="activeApprovalNode"
      :methods="approvalMethods"
      :nodes="approvalForm.nodes"
      :person-depts="approvalPersonDepts"
      @add-node="addApprovalNode"
      @pick-person="openApprovalPersonPicker"
      @remove-node="removeApprovalNode"
      @remove-person="removeApprovalApprover"
      @select-node="activeApprovalNode = $event"
      @update-node="updateApprovalNode"
    />

    <aw-strategy-setting-page
      v-else-if="currentKey === 'strategies'"
      title="质检策略设置"
      description="按质检管理、异常处理和质检设置页面真实动作配置检验判定、来源回写、隔离复检、让步放行和方案发布策略。"
      :tabs="qcPolicyConfig"
      @reset="resetQcStrategies"
      @save="saveQcStrategies"
      @update-rule="updateQcStrategyRule"
    />

    <aw-setting-list-card
      v-else
      v-model:keyword="keyword"
      :description="current.desc"
      :search-placeholder="current.search"
      :title="current.title"
    >
      <div class="aw-doc-tbl-wrap">
        <div class="aw-doc-tbl-inner">
          <table class="aw-doc-tbl">
            <thead>
              <tr>
                <th v-for="column in current.columns" :key="column.key" :style="{ width: column.width }">{{ column.label }}</th>
                <th style="width:150px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in filteredRows" :key="row.id">
                <td v-for="column in current.columns" :key="column.key">
                  <span v-if="column.key === 'index'">{{ index + 1 }}</span>
                  <label v-else-if="column.key === 'enabled'" class="aw-switch-line mini"><input :checked="row.enabled" type="checkbox" @change="toggleEnabled(row, $event, current.title)" /><i></i></label>
                  <span v-else-if="column.key === 'nodeCount'">{{ row.nodes?.length || 0 }}</span>
                  <span v-else>{{ row[column.key] }}</span>
                </td>
                <td>
                  <span class="aw-link" @click="currentKey === 'approvals' ? openApprovalEditor(row) : undefined">编辑</span>
                  <span class="aw-action-split">|</span>
                  <span class="aw-link" style="color:var(--aw-danger)" @click="removeRow(row.id)">删除</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </aw-setting-list-card>

    <div v-if="showRootModal" class="aw-modal-mask">
      <div class="aw-modal aw-category-modal">
        <div class="aw-modal-head">
          <strong>新增质检方案分组</strong>
          <button type="button" class="aw-modal-close" @click="showRootModal = false">×</button>
        </div>
        <div class="aw-modal-body">
          <label class="aw-field">
            <span>分组名称</span>
            <input v-model="rootForm.name" placeholder="请输入质检方案分组名称" />
          </label>
          <label class="aw-field">
            <span>分组编号</span>
            <input v-model="rootForm.code" placeholder="请输入质检方案分组编号" />
          </label>
          <label class="aw-field aw-field-full">
            <span>分组备注</span>
            <textarea v-model="rootForm.remark" placeholder="请输入质检方案分组备注"></textarea>
          </label>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-tool-btn" type="button" @click="showRootModal = false">取消</button>
          <button class="aw-btn primary" type="button" @click="addRootGroup">确定</button>
        </div>
      </div>
    </div>

    <div v-if="showChildModal" class="aw-modal-mask">
      <div class="aw-modal aw-category-modal">
        <div class="aw-modal-head">
          <strong>新增二级分类</strong>
          <button type="button" class="aw-modal-close" @click="closeChildModal">×</button>
        </div>
        <div class="aw-modal-body">
          <label class="aw-field">
            <span>二级分类名称</span>
            <input v-model="childForm.name" placeholder="请输入二级分类名称" />
          </label>
          <label class="aw-field">
            <span>分类编号</span>
            <input v-model="childForm.code" placeholder="请输入二级分类编号" />
          </label>
          <label class="aw-field aw-field-full">
            <span>分类备注</span>
            <textarea v-model="childForm.remark" placeholder="请输入二级分类备注"></textarea>
          </label>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-tool-btn" type="button" @click="closeChildModal">取消</button>
          <button class="aw-btn primary" type="button" @click="addChildGroup">确定</button>
        </div>
      </div>
    </div>

    <div v-if="showFieldModal" class="aw-modal-mask">
      <div class="aw-modal aw-field-modal">
        <div class="aw-modal-head">
          <strong>新增字段</strong>
          <button type="button" class="aw-modal-close" @click="showFieldModal = false">×</button>
        </div>
        <div class="aw-modal-body aw-field-config-body">
          <label class="aw-field">
            <span><b>*</b>字段名称</span>
            <input v-model="fieldForm.name" placeholder="请输入字段名称" />
          </label>
          <label class="aw-field">
            <span><b>*</b>字段编码</span>
            <input v-model="fieldForm.code" placeholder="请输入字段编码" />
          </label>
          <label class="aw-field">
            <span>字段类型</span>
            <select v-model="fieldForm.type">
              <option>文本</option>
              <option>数字</option>
              <option>日期</option>
              <option>下拉</option>
              <option>多选</option>
              <option>附件</option>
            </select>
          </label>
          <label class="aw-field aw-field-full">
            <span>是否必填</span>
            <label class="aw-switch-line">
              <input v-model="fieldForm.required" type="checkbox" true-value="是" false-value="否" />
              <i></i>
              <em>是否必填</em>
            </label>
          </label>
          <label class="aw-field">
            <span>默认值</span>
            <input v-model="fieldForm.defaultValue" placeholder="请输入默认值" />
          </label>
          <label class="aw-field">
            <span>提示文字</span>
            <input v-model="fieldForm.placeholder" placeholder="请输入提示文字" />
          </label>
          <div class="aw-field aw-field-full">
            <div class="aw-form-sub-title">权限设置</div>
            <div class="aw-permission-count">已设置权限人员（{{ fieldForm.permissions.length }}）</div>
            <div class="aw-permission-box aw-permission-table-box">
              <div v-if="fieldForm.permissions.length === 0" class="aw-permission-empty">暂未添加权限人员，点击下方按钮添加</div>
              <table v-else class="aw-permission-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>部门</th>
                    <th>职位</th>
                    <th style="width:110px">是否可见</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="person in fieldForm.permissions" :key="person.name">
                    <td>{{ person.name }}</td>
                    <td>{{ person.dept }}</td>
                    <td>{{ person.role }}</td>
                    <td><label class="aw-switch-line mini"><input v-model="person.visible" type="checkbox" /><i></i></label></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button class="aw-btn primary aw-permission-add" type="button" @click="showPersonPicker = true">添加负责人</button>
          </div>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-tool-btn" type="button" @click="showFieldModal = false">取消</button>
          <button class="aw-btn primary" type="button" @click="addFieldFromModal">确定</button>
        </div>
      </div>
    </div>

    <div v-if="showLevelModal" class="aw-modal-mask">
      <div class="aw-modal aw-category-modal">
        <div class="aw-modal-head">
          <strong>新增等级</strong>
          <button type="button" class="aw-modal-close" @click="showLevelModal = false">×</button>
        </div>
        <div class="aw-modal-body">
          <label class="aw-field">
            <span><b>*</b>等级名称</span>
            <input v-model="levelForm.name" placeholder="请输入等级名称" />
          </label>
          <label class="aw-field">
            <span>是否启用</span>
            <label class="aw-switch-line">
              <input v-model="levelForm.enabled" type="checkbox" />
              <i></i>
              <em>是否启用</em>
            </label>
          </label>
          <label class="aw-field aw-field-full">
            <span>备注</span>
            <textarea v-model="levelForm.remark" placeholder="请输入备注"></textarea>
          </label>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-tool-btn" type="button" @click="showLevelModal = false">取消</button>
          <button class="aw-btn primary" type="button" @click="addLevelFromModal">确定</button>
        </div>
      </div>
    </div>

    <div v-if="showCodeModal && codeForm" class="aw-modal-mask">
      <div class="aw-modal aw-category-modal">
        <div class="aw-modal-head">
          <strong>设置编码规则</strong>
          <button type="button" class="aw-modal-close" @click="showCodeModal = false">×</button>
        </div>
        <div class="aw-modal-body">
          <label class="aw-field"><span>编码对象</span><input v-model="codeForm.object" /></label>
          <label class="aw-field"><span><b>*</b>编码前缀</span><input v-model="codeForm.prefix" /></label>
          <label class="aw-field"><span>日期规则</span><select v-model="codeForm.dateRule"><option>年月</option><option>年月日</option><option>年</option></select></label>
          <label class="aw-field"><span>流水号位数</span><select v-model="codeForm.serial"><option>3位</option><option>4位</option><option>5位</option></select></label>
          <label class="aw-field"><span>分隔符</span><select v-model="codeForm.separator"><option>-</option><option>无</option><option>_</option></select></label>
          <label class="aw-field"><span>状态</span><select v-model="codeForm.status"><option>启用</option><option>停用</option></select></label>
          <div class="aw-code-preview aw-field-full">
            <span>编码预览</span>
            <strong>{{ codePreviewText(codeForm) }}</strong>
          </div>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-tool-btn" type="button" @click="showCodeModal = false">取消</button>
          <button class="aw-btn primary" type="button" @click="saveCodeRule">保存规则</button>
        </div>
      </div>
    </div>

    <div v-if="showCodePreview" class="aw-modal-mask">
      <div class="aw-modal aw-field-modal">
        <div class="aw-modal-head">
          <strong>编码预览</strong>
          <button type="button" class="aw-modal-close" @click="showCodePreview = false">×</button>
        </div>
        <div class="aw-modal-body aw-field-full">
          <table class="aw-doc-tbl">
            <thead><tr><th>模块</th><th>表单</th><th>规则</th><th>下一编号</th></tr></thead>
            <tbody><tr v-for="row in filteredCodeRows.slice(0, 8)" :key="row.id"><td>{{ row.module }}</td><td>{{ row.form }}</td><td>{{ row.prefix }} + 年月 + 3位流水</td><td>{{ row.sample }}</td></tr></tbody>
          </table>
        </div>
        <div class="aw-modal-foot"><button class="aw-btn primary" type="button" @click="showCodePreview = false">关闭</button></div>
      </div>
    </div>

    <div v-if="showPersonPicker" class="aw-modal-mask">
      <div class="aw-modal aw-person-picker-modal">
        <div class="aw-modal-head">
          <strong>选择负责人</strong>
          <button type="button" class="aw-modal-close" @click="closePersonPicker">×</button>
        </div>
        <div class="aw-picker-body">
          <aside class="aw-picker-side">
            <div class="aw-picker-search"><span class="aw-line-icon line-search"></span><input placeholder="搜索" /></div>
            <button
              v-for="dept in pickerDepartments"
              :key="dept"
              type="button"
              :class="['aw-picker-tree-row', { on: pickerDept === dept }]"
              @click="pickerDept = dept"
            >
              <span>{{ dept === '傲为智慧有限公司' || dept === '采购部' ? '▼' : '' }}</span>{{ dept }}
            </button>
          </aside>
          <section class="aw-picker-main">
            <div class="aw-picker-title"><strong>{{ pickerDept }}</strong><span>共 {{ pickerPersons.length }} 人</span></div>
            <table class="aw-doc-tbl">
              <thead>
                <tr>
                  <th style="width:44px"><input type="checkbox" :checked="allPickerChecked" @change="togglePickerAll" /></th>
                  <th>姓名</th>
                  <th>编号</th>
                  <th>角色</th>
                  <th>联系电话</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="person in pickerPersons" :key="person.id" @click="togglePickerPerson(person)">
                  <td><input type="checkbox" :checked="pickedPersons.some((item) => item.id === person.id)" @click.stop @change="togglePickerPerson(person)" /></td>
                  <td>{{ person.name }}</td>
                  <td>{{ person.id }}</td>
                  <td>{{ person.role }}</td>
                  <td>{{ person.phone }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-tool-btn" type="button" @click="closePersonPicker">取消</button>
          <button class="aw-btn primary" type="button" @click="confirmPickedPersons">确认</button>
        </div>
      </div>
    </div>
  </aw-setting-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwApprovalRuleEditor from '@/components/setting-page/AwApprovalRuleEditor.vue';
import AwSettingListCard from '@/components/setting-page/AwSettingListCard.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingSplitPage from '@/components/setting-page/AwSettingSplitPage.vue';
import AwSettingToolbar from '@/components/setting-page/AwSettingToolbar.vue';
import AwSettingTree from '@/components/setting-page/AwSettingTree.vue';
import AwStrategySettingPage from '@/components/setting-page/AwStrategySettingPage.vue';
import type { ApprovalNode, PersonPickerDept, StrategyRule, StrategyTab } from '@/components/setting-page/types';

interface SettingRow {
  id: number;
  enabled?: boolean;
  [key: string]: any;
}

interface PermissionPerson {
  name: string;
  dept: string;
  role: string;
  visible: boolean;
}

interface SettingColumn {
  key: string;
  label: string;
  width?: string;
}

interface SettingConfig {
  title: string;
  desc: string;
  search: string;
  addText: string;
  columns: SettingColumn[];
  rows: SettingRow[];
}

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const rows = ref<SettingRow[]>([]);
const showRootModal = ref(false);
const rootForm = ref({ name: '', code: '', remark: '' });
const showChildModal = ref(false);
const childForm = ref({ name: '', code: '', remark: '' });
const showFieldModal = ref(false);
const showLevelModal = ref(false);
const showApprovalEditor = ref(false);
const editingApprovalId = ref<number | null>(null);
const activeApprovalNode = ref(1);
const showCodeModal = ref(false);
const showCodePreview = ref(false);
const codeForm = ref<SettingRow | null>(null);
const showPersonPicker = ref(false);
const activeApprovalPickerIndex = ref<number | null>(null);
const pickerDept = ref('采购部');
const pickedPersons = ref<Array<{ id: string; name: string; role: string; phone: string }>>([]);
const fieldForm = ref({
  name: '',
  code: '',
  type: '文本',
  required: '否',
  defaultValue: '',
  placeholder: '',
  permissions: [] as PermissionPerson[],
});
const levelForm = ref({ name: '', remark: '', enabled: true });
const approvalForm = ref({
  name: '',
  category: '文档库',
  creator: '老夏',
  updatedAt: '2026-05-26 10:00',
  nodes: [{ name: '', approvers: [], method: '依次审批' }] as ApprovalNode[],
});
const approvalMethods = [
  { value: '依次审批', desc: '按先后顺序，一人同意才流转到下一人' },
  { value: '会签', desc: '所选人员必须全部审批后进入下一节点' },
  { value: '或签', desc: '选中的人里只要有一人同意即可' },
];

const deptPersons: Record<string, Array<{ id: string; name: string; role: string; phone: string }>> = {
  傲为智慧有限公司: [],
  采购部: [
    { id: '100001', name: '丁昌容', role: '采购人员', phone: '13500001111' },
    { id: '100002', name: '纪广', role: '采购人员', phone: '13500002222' },
    { id: '100003', name: '庞慧', role: '采购人员', phone: '13500003333' },
    { id: '100004', name: '顾伦', role: '采购人员', phone: '13500004444' },
  ],
  采购一部: [
    { id: '100001', name: '丁昌容', role: '采购人员', phone: '13500001111' },
    { id: '100002', name: '纪广', role: '采购人员', phone: '13500002222' },
  ],
  采购二部: [
    { id: '100003', name: '庞慧', role: '采购人员', phone: '13500003333' },
    { id: '100004', name: '顾伦', role: '采购人员', phone: '13500004444' },
  ],
  设计部: [
    { id: '200001', name: '林悦', role: 'UI设计师', phone: '13600001111' },
    { id: '200002', name: '何志远', role: '平面设计师', phone: '13600002222' },
  ],
  产品部: [
    { id: '300001', name: '苏婉清', role: '产品经理', phone: '13700001111' },
    { id: '300002', name: '赵一鸣', role: '产品经理', phone: '13700002222' },
  ],
  质检中心: [
    { id: 'QC001', name: '老夏', role: 'IQC检验员', phone: '13800001111' },
    { id: 'QC002', name: '王质检', role: 'IPQC检验员', phone: '13800002222' },
    { id: 'QC003', name: '陈质检', role: 'OQC检验员', phone: '13800003333' },
    { id: 'QC004', name: '质量经理', role: '质量经理', phone: '13800004444' },
  ],
  生产中心: [
    { id: 'SC001', name: '三红', role: '生产主管', phone: '13900001111' },
    { id: 'SC002', name: '李工', role: '工艺工程师', phone: '13900002222' },
  ],
  仓储中心: [
    { id: 'CK001', name: '陈仓', role: '仓库主管', phone: '13700003333' },
    { id: 'CK002', name: '李库', role: '收货员', phone: '13700004444' },
  ],
};
const pickerDepartments = ['傲为智慧有限公司', '质检中心', '采购部', '生产中心', '仓储中心', '产品部'];
const approvalPersonDepts = computed<PersonPickerDept[]>(() => pickerDepartments.map((dept) => ({
  key: dept,
  label: dept,
  persons: deptPersons[dept] || [],
})));
const numberCandidates = [
  { k: 'y4', label: '年（4位）', preview: '2025', group: 'year' },
  { k: 'y2', label: '年（2位）', preview: '25', group: 'year' },
  { k: 'm', label: '月（2位）', preview: '05' },
  { k: 'd', label: '日（2位）', preview: '15' },
  { k: 's3', label: '流水号（3位）', preview: '001', group: 'seq' },
  { k: 's1', label: '流水号（1位）', preview: '1', group: 'seq' },
  { k: 'cc1', label: '自定义代码1', preview: 'C1' },
  { k: 'cc2', label: '自定义代码2', preview: 'C2' },
];
const numberCandidateMap = Object.fromEntries(numberCandidates.map((item) => [item.k, item]));
const selectedNumberItems = ref<string[]>([]);
const numberPrefix = ref('QC');
const numberSeparator = ref('-');
const numberSearchFlags = ref<Record<string, boolean>>({});
const numberCodeValues = ref<Record<string, string>>({ cc1: 'C1', cc2: 'C2' });
const numberLabelValues = ref<Record<string, string>>({ cc1: '自定义代码1', cc2: '自定义代码2' });
const numberDragIndex = ref<number | null>(null);

const settingMap: Record<string, SettingConfig> = {
  groups: {
    title: '质检方案分组',
    desc: '维护检验方案分组，左侧选择一级分组，右侧维护该分组下的二级分类。',
    search: '搜索二级分类名称/编号',
    addText: '新增二级分类',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '二级分类名称', width: '180px' },
      { key: 'parent', label: '上级分组', width: '160px' },
      { key: 'code', label: '分类编号', width: '170px' },
      { key: 'schemeCount', label: '方案数量', width: '100px' },
      { key: 'enabled', label: '状态', width: '90px' },
    ],
    rows: [
      { id: 1, name: '来料检验方案组', parent: '无', code: 'QCPG-IQC', remark: '采购到货、委外收货、供应商来料等 IQC 检验方案分组。', enabled: true },
      { id: 2, name: '过程检验方案组', parent: '无', code: 'QCPG-IPQC', remark: '首件检验、巡检、停线处置和工序返工复检方案分组。', enabled: true },
      { id: 3, name: '成品检验方案组', parent: '无', code: 'QCPG-FQC', remark: '完工检验、功能测试、成品入库放行方案分组。', enabled: true },
      { id: 4, name: '出货检验方案组', parent: '无', code: 'QCPG-OQC', remark: '销售出库、客户验货、让步放行和拒收重检方案分组。', enabled: true },
      { id: 101, name: '采购到货检验', parent: '来料检验方案组', code: 'QCPG-IQC-GRN', schemeCount: 3, policy: 'IQC | AQL 1.0', remark: '采购收货入库前检验分类，关联轴承、型材等来料方案。', enabled: true },
      { id: 102, name: '委外收货检验', parent: '来料检验方案组', code: 'QCPG-IQC-OUTS', schemeCount: 2, policy: 'IQC | 加严抽样', remark: '委外加工收货和退料复核分类。', enabled: true },
      { id: 103, name: '供应商来料复核', parent: '来料检验方案组', code: 'QCPG-IQC-SQE', schemeCount: 2, policy: 'IQC | 材质复核', remark: '材质证明、批号一致性和供应商8D验证分类。', enabled: true },
      { id: 201, name: '首件检验', parent: '过程检验方案组', code: 'QCPG-IPQC-FIRST', schemeCount: 2, policy: 'IPQC | 首件全检', remark: '工序首件确认和设备参数首检分类。', enabled: true },
      { id: 202, name: '巡检执行', parent: '过程检验方案组', code: 'QCPG-IPQC-PATROL', schemeCount: 3, policy: 'IPQC | 巡检频次', remark: '按产线、工序和时间频次执行巡检分类。', enabled: true },
      { id: 203, name: '返工复检', parent: '过程检验方案组', code: 'QCPG-IPQC-RCK', schemeCount: 2, policy: 'IPQC | 加严复检', remark: '返工完成后的加严抽样和放行复核分类。', enabled: true },
      { id: 301, name: '完工待检', parent: '成品检验方案组', code: 'QCPG-FQC-FINISH', schemeCount: 2, policy: 'FQC | 完工抽检', remark: '完工报工后、成品入库前的检验分类。', enabled: true },
      { id: 302, name: '功能测试', parent: '成品检验方案组', code: 'QCPG-FQC-FUNC', schemeCount: 2, policy: 'FQC | 功能全检', remark: '老化、安规、性能和铭牌核对分类。', enabled: true },
      { id: 401, name: '待出货检验', parent: '出货检验方案组', code: 'QCPG-OQC-SHIP', schemeCount: 2, policy: 'OQC | AQL 0.65', remark: '销售出库前包装、外观和装箱检验分类。', enabled: true },
      { id: 402, name: '客户验货', parent: '出货检验方案组', code: 'QCPG-OQC-CUST', schemeCount: 1, policy: 'OQC | 客户确认', remark: '客户验货、让步确认和拒收重检分类。', enabled: true },
    ],
  },
  fields: {
    title: '质检自定义字段',
    desc: '配置质检档案中的扩展字段，包含字段类型、必填、启用和排序。',
    search: '搜索字段名称/编码',
    addText: '新增字段',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '字段名称', width: '170px' },
      { key: 'code', label: '字段编码', width: '160px' },
      { key: 'type', label: '字段类型', width: '120px' },
      { key: 'required', label: '是否必填', width: '100px' },
      { key: 'scope', label: '所属分组' },
      { key: 'enabled', label: '状态', width: '90px' },
    ],
    rows: [
      { id: 1, name: '质检来源', code: 'qc_source', type: '下拉', required: '否', scope: '来源记录', enabled: true },
      { id: 2, name: '抽样偏差', code: 'sampling_deviation', type: '文本', required: '否', scope: '抽样记录', enabled: true },
      { id: 3, name: '缺陷等级', code: 'defect_level', type: '下拉', required: '是', scope: '基础信息', enabled: true },
      { id: 4, name: '复检要求', code: 'recheck_requirement', type: '文本', required: '否', scope: '不良处置', enabled: true },
      { id: 5, name: '放行条件', code: 'release_condition', type: '文本', required: '否', scope: '质检报告', enabled: true },
    ],
  },
  numbers: {
    title: '质检自定义编号',
    desc: '维护质检编号规则，支持前缀、日期段、流水号和预览。',
    search: '搜索规则名称/前缀',
    addText: '保存',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '规则名称', width: '170px' },
      { key: 'prefix', label: '前缀', width: '110px' },
      { key: 'dateRule', label: '日期规则', width: '130px' },
      { key: 'serial', label: '流水位数', width: '100px' },
      { key: 'preview', label: '编号预览' },
      { key: 'enabled', label: '状态', width: '90px' },
    ],
    rows: [
      { id: 1, module: '质检中心', form: '质检任务', object: '质检', prefix: 'QC', sample: 'QC-202605-001', status: '启用', owner: '质量管理员', updated: '2026-05-15', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 2, module: '质检中心', form: '来料检验', object: 'IQC', prefix: 'IQC', sample: 'IQC-202605-001', status: '启用', owner: '质量管理员', updated: '2026-05-15', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 3, module: '质检中心', form: '过程检验', object: 'IPQC', prefix: 'IPQC', sample: 'IPQC-202605-001', status: '启用', owner: '质量管理员', updated: '2026-05-15', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 4, module: '质检中心', form: '成品检验', object: 'FQC', prefix: 'FQC', sample: 'FQC-202605-001', status: '启用', owner: '质量管理员', updated: '2026-05-16', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 5, module: '质检中心', form: '出货检验', object: 'OQC', prefix: 'OQC', sample: 'OQC-202605-001', status: '启用', owner: '质量管理员', updated: '2026-05-14', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 6, module: '质检中心', form: '不合格记录', object: 'NCR', prefix: 'NCR', sample: 'NCR-202605-001', status: '启用', owner: '质量管理员', updated: '2026-05-12', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 7, module: '质检中心', form: 'CAPA/8D', object: 'CAPA', prefix: 'CAPA', sample: 'CAPA-202605-001', status: '启用', owner: '质量管理员', updated: '2026-05-13', dateRule: '年月', serial: '3位', separator: '-' },
    ],
  },
  levels: {
    title: '质检等级设置',
    desc: '维护质检等级和启用状态。',
    search: '搜索等级名称',
    addText: '新增等级',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '等级名称', width: '150px' },
      { key: 'remark', label: '备注' },
      { key: 'enabled', label: '是否启用', width: '110px' },
    ],
    rows: [
      { id: 1, name: 'A级', remark: '重大缺陷/关键放行等级', enabled: true },
      { id: 2, name: 'B级', remark: '主要缺陷/复检处置等级', enabled: true },
      { id: 3, name: 'C级', remark: '一般缺陷/记录跟踪等级', enabled: true },
    ],
  },
  approvals: {
    title: '质检审批设置',
    desc: '配置检验方案发布、让步放行、拒收隔离和 CAPA 关闭等审批流程。',
    search: '搜索流程名称/适用分类',
    addText: '新增审批规则',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '流程名称', width: '220px' },
      { key: 'category', label: '适用分类', width: '140px' },
      { key: 'nodeCount', label: '节点数', width: '90px' },
      { key: 'creator', label: '创建人', width: '120px' },
      { key: 'updatedAt', label: '更新时间', width: '170px' },
    ],
    rows: [
      { id: 1, name: '检验方案发布审批流程', category: '方案配置', nodes: [{ name: '质检主管复核', approvers: '老夏', method: '顺签' }, { name: '质量经理批准', approvers: '质量经理', method: '或签' }], creator: '老夏', updatedAt: '2026-05-17 14:30', enabled: true },
      { id: 2, name: '让步放行审批流程', category: '让步放行', nodes: [{ name: '质检主管复核', approvers: '王质检', method: '顺签' }, { name: '生产/仓储负责人会签', approvers: '三红，陈仓', method: '会签' }], creator: '质量经理', updatedAt: '2026-05-18 09:15', enabled: true },
    ],
  },
  strategies: {
    title: '质检策略设置',
    desc: '维护检验执行、异常处置、复检放行和跨模块回写策略。',
    search: '搜索策略名称',
    addText: '新增策略',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '策略名称', width: '180px' },
      { key: 'type', label: '策略类型', width: '130px' },
      { key: 'rule', label: '策略规则' },
      { key: 'scope', label: '适用范围', width: '140px' },
      { key: 'enabled', label: '状态', width: '90px' },
    ],
    rows: [
      { id: 1, name: '不合格自动隔离', type: '异常策略', rule: '判定不合格后同步冻结库存或工序批次', scope: '不合格记录', enabled: true },
      { id: 2, name: '返工后强制复检', type: '复检策略', rule: '返工完成后必须复检合格才允许放行', scope: '返工复检', enabled: true },
    ],
  },
  print: {
    title: '设置质检打印模板',
    desc: '维护质检报告、放行单、拒收单和 CAPA/8D 打印模板。',
    search: '搜索模板名称/适用场景',
    addText: '新增打印模板',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '模板名称', width: '220px' },
      { key: 'scene', label: '适用场景', width: '140px' },
      { key: 'paper', label: '纸张', width: '90px' },
      { key: 'creator', label: '维护人', width: '120px' },
      { key: 'updatedAt', label: '更新时间', width: '170px' },
      { key: 'enabled', label: '是否启用', width: '110px' },
    ],
    rows: [
      { id: 1, name: 'IQC来料检验报告', scene: '来料检验', paper: 'A4', creator: '老夏', updatedAt: '2026-05-20 09:30', enabled: true },
      { id: 2, name: 'OQC出货放行单', scene: '出货检验', paper: 'A4', creator: '陈质检', updatedAt: '2026-05-21 10:00', enabled: true },
    ],
  },
};

const qcPolicyConfig = ref<StrategyTab[]>([
  {
    key: 'inspection',
    label: '检验执行策略',
    rows: [
      {
        key: 'inspectionSubmit',
        title: '检验结果提交',
        sub: '质检任务完成判定后，是否校验抽样数量、检验明细和最终结论。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'resultRequiredItems',
            title: '提交必填项',
            sub: '提交检验结果前必须填写的执行信息。',
            type: 'select',
            value: '检验明细 + 最终结论',
            options: ['检验明细 + 最终结论', '抽样记录 + 检验明细 + 最终结论'],
          },
          {
            key: 'inspectorRule',
            title: '检验员校验',
            sub: '检验员是否必须来自质检中心人员。',
            type: 'select',
            value: '必须为质检中心人员',
            options: ['必须为质检中心人员', '允许来源部门协检人员'],
          },
        ],
      },
      {
        key: 'inspectionResultAction',
        title: '结果处置动作',
        sub: '放行、拒收、让步接收、返工复检是否受检验结论限制。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'qualifiedAction',
            title: '合格结果动作',
            sub: '合格判定后允许执行的动作。',
            type: 'select',
            value: '允许放行',
            options: ['允许放行', '允许放行并生成报告'],
          },
          {
            key: 'defectAction',
            title: '不合格结果动作',
            sub: '不合格判定后默认进入异常处理还是直接拒收。',
            type: 'select',
            value: '进入异常处理',
            options: ['进入异常处理', '允许直接拒收'],
          },
        ],
      },
      {
        key: 'inspectionWriteback',
        title: '来源单据回写',
        sub: '检验结果提交后是否回写采购、生产、仓储或销售来源单据。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'writebackTiming',
            title: '回写时点',
            sub: '控制检验结果在提交、审批或放行后回写来源。',
            type: 'select',
            value: '提交结果后回写',
            options: ['提交结果后回写', '放行/拒收后回写'],
          },
          {
            key: 'writebackScope',
            title: '回写范围',
            sub: '控制回写来源状态、合格数量、不合格数量和批次信息。',
            type: 'select',
            value: '状态 + 数量 + 批次',
            options: ['仅状态', '状态 + 数量 + 批次'],
          },
        ],
      },
    ],
  },
  {
    key: 'exception',
    label: '异常处置策略',
    rows: [
      {
        key: 'defectIsolation',
        title: '不合格隔离',
        sub: '质检判定不合格后，是否触发库存冻结、工序隔离或出货拦截。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'isolationScope',
            title: '隔离范围',
            sub: '按来源类型决定隔离库存、工序批次或出货批次。',
            type: 'select',
            value: '按来源类型隔离',
            options: ['按来源类型隔离', '仅隔离当前批次'],
          },
          {
            key: 'isolationApproval',
            title: '隔离审批',
            sub: '隔离或拒收动作是否需要审批。',
            type: 'select',
            value: '不合格隔离直接执行',
            options: ['不合格隔离直接执行', '隔离/拒收需质量经理确认'],
          },
        ],
      },
      {
        key: 'recheckControl',
        title: '返工复检',
        sub: '返工完成后是否必须复检合格才允许来源单据继续流转。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'recheckSampling',
            title: '复检抽样',
            sub: '返工复检使用原抽样方案还是加严抽样。',
            type: 'select',
            value: '加严抽样',
            options: ['原抽样方案', '加严抽样'],
          },
          {
            key: 'recheckRelease',
            title: '复检放行',
            sub: '复检合格后是否自动放行来源单据。',
            type: 'select',
            value: '复检合格后人工放行',
            options: ['复检合格后人工放行', '复检合格后自动放行'],
          },
        ],
      },
      {
        key: 'concessionRelease',
        title: '让步放行',
        sub: '不合格品需要让步放行时是否触发审批和客户/内部确认。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'concessionFlow',
            title: '审批流程',
            sub: '选择让步放行使用的审批流程。',
            type: 'select',
            value: '让步放行审批流程',
            options: ['让步放行审批流程', '质量经理单级审批'],
          },
          {
            key: 'concessionWriteback',
            title: '放行回写',
            sub: '审批通过后如何回写来源单据。',
            type: 'select',
            value: '回写让步放行状态',
            options: ['回写让步放行状态', '回写放行状态并保留让步标识'],
          },
        ],
      },
    ],
  },
  {
    key: 'standard',
    label: '标准/方案策略',
    rows: [
      {
        key: 'standardPublish',
        title: '检验方案发布',
        sub: '质检方案或标准从草稿启用前是否需要审批。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'standardPublishFlow',
            title: '审批流程',
            sub: '选择检验方案发布使用的审批流程。',
            type: 'select',
            value: '检验方案发布审批流程',
            options: ['检验方案发布审批流程', '质量主管复核流程'],
          },
          {
            key: 'standardVersion',
            title: '版本控制',
            sub: '启用新版方案时旧版本如何处理。',
            type: 'select',
            value: '旧版本保留追溯',
            options: ['旧版本保留追溯', '旧版本自动停用'],
          },
        ],
      },
      {
        key: 'standardDisable',
        title: '质检方案停用',
        sub: '方案停用后是否禁止新增检验任务继续选择该方案。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'disableEffect',
            title: '停用影响',
            sub: '停用方案对新任务和历史任务的影响。',
            type: 'select',
            value: '禁止新任务选择',
            options: ['禁止新任务选择', '禁止新任务选择但历史可复检'],
          },
          {
            key: 'disableApproval',
            title: '停用审批',
            sub: '停用已启用方案是否需要质量经理确认。',
            type: 'select',
            value: '停用需确认',
            options: ['停用需确认', '停用直接生效'],
          },
        ],
      },
      {
        key: 'capaClose',
        title: 'CAPA/8D 关闭',
        sub: '异常整改、CAPA 或 8D 验证关闭时是否校验整改证据。',
        type: 'switch',
        enabled: false,
        children: [
          {
            key: 'capaEvidence',
            title: '关闭依据',
            sub: '关闭前必须具备的整改和验证信息。',
            type: 'select',
            value: '必须有验证记录',
            options: ['必须有验证记录', '验证记录 + 责任人确认'],
          },
          {
            key: 'capaCloseFlow',
            title: '关闭审批',
            sub: 'CAPA/8D 关闭是否进入审批。',
            type: 'select',
            value: '让步放行审批流程',
            options: ['让步放行审批流程', '质量经理单级审批'],
          },
        ],
      },
    ],
  },
]);
const defaultQcPolicyConfig = qcPolicyConfig.value.map((tab) => ({
  ...tab,
  rows: cloneStrategyRows(tab.rows),
}));

const actionSettingMap: Record<string, string> = {
  质检方案分组: 'groups',
  方案分组: 'groups',
  质检自定义字段: 'fields',
  质检自定义编号: 'numbers',
  质检审批设置: 'approvals',
  质检策略设置: 'strategies',
  设置质检打印模板: 'print',
};
const currentKey = computed(() => String(route.query.setting || route.params.setting || actionSettingMap[String(route.query.action || '')] || 'fields'));
const current = computed(() => settingMap[currentKey.value] || settingMap.fields);
const rootGroups = computed(() => rows.value.filter((row) => row.parent === '无'));
const activeRootId = ref<number | undefined>();
const activeRoot = computed(() => rootGroups.value.find((row) => row.id === activeRootId.value) || rootGroups.value[0]);
const groupChildren = computed(() => rows.value.filter((row) => row.parent === activeRoot.value?.name));
const fieldScopes = ['基础信息', '来源记录', '抽样记录', '检验明细', '不良处置', '质检报告'];
const activeFieldScope = ref(fieldScopes[0]);
const groupTreeItems = computed(() => rootGroups.value.map((group) => ({
  key: group.id,
  label: String(group.name),
  count: categoryCustomerCount(String(group.name)),
  icon: 'line-users',
})));
const fieldTreeItems = computed(() => fieldScopes.map((scope) => ({
  key: scope,
  label: scope,
  count: fieldScopeCount(scope),
  icon: 'line-doc',
})));
const activeCodeModule = ref('全部模块');
const codeModules = computed(() => ['全部模块', ...Array.from(new Set(rows.value.map((row) => String(row.module)).filter(Boolean)))]);
const pickerPersons = computed(() => deptPersons[pickerDept.value] || []);
const allPickerChecked = computed(() => pickerPersons.value.length > 0 && pickerPersons.value.every((person) => pickedPersons.value.some((item) => item.id === person.id)));
const filteredRows = computed(() => {
  const text = keyword.value.trim();
  if (!text) return rows.value;
  return rows.value.filter((row) => Object.values(row).some((value) => String(value).includes(text)));
});
const filteredGroupRows = computed(() => {
  const text = keyword.value.trim();
  if (!text) return groupChildren.value;
  return groupChildren.value.filter((row) => Object.values(row).some((value) => String(value).includes(text)));
});
const filteredFieldRows = computed(() => {
  const text = keyword.value.trim();
  const scopedRows = rows.value.filter((row) => row.scope === activeFieldScope.value);
  if (!text) return scopedRows;
  return scopedRows.filter((row) => Object.values(row).some((value) => String(value).includes(text)));
});
const filteredCodeRows = computed(() => {
  const text = keyword.value.trim();
  return rows.value.filter((row) => {
    const moduleOk = activeCodeModule.value === '全部模块' || row.module === activeCodeModule.value;
    const textOk = !text || [row.module, row.form, row.object, row.prefix, row.sample, row.owner].some((value) => String(value || '').includes(text));
    return moduleOk && textOk;
  });
});
const numberRestPreview = computed(() => selectedNumberItems.value.map(numberPreviewValue).join(numberSeparator.value));
const numberFullPreview = computed(() => numberRestPreview.value ? `${numberPrefix.value}${numberSeparator.value}${numberRestPreview.value}` : numberPrefix.value);

watch(currentKey, () => {
  rows.value = current.value.rows.map((row) => ({ ...row }));
  activeRootId.value = rows.value.find((row) => row.parent === '无')?.id as number | undefined;
  activeFieldScope.value = fieldScopes[0];
  activeCodeModule.value = '全部模块';
  keyword.value = '';
}, { immediate: true });

function childGroups(rootId: number) {
  const root = rootGroups.value.find((row) => row.id === rootId);
  return rows.value.filter((row) => row.parent === root?.name);
}

function categoryCustomerCount(name: unknown) {
  return rows.value.filter((row) => row.parent === String(name)).length;
}

function selectRoot(id: string | number | boolean) {
  activeRootId.value = Number(id);
  keyword.value = '';
}

function selectFieldScope(scope: string | number) {
  activeFieldScope.value = String(scope);
  keyword.value = '';
}

function fieldScopeCount(scope: string) {
  return rows.value.filter((row) => row.scope === scope).length;
}

function selectCodeModule(module: string) {
  activeCodeModule.value = module;
  keyword.value = '';
}

function codeModuleCount(module: string) {
  return module === '全部模块' ? rows.value.length : rows.value.filter((row) => row.module === module).length;
}

function openCodeRule(row?: SettingRow) {
  if (!row) return;
  codeForm.value = { ...row };
  showCodeModal.value = true;
}

function codePreviewText(row: SettingRow) {
  const prefix = String(row.prefix || 'CODE').toUpperCase();
  const sep = row.separator === '无' ? '' : String(row.separator || '-');
  const serial = row.serial === '5位' ? '00001' : row.serial === '4位' ? '0001' : '001';
  return `${prefix}${sep}202605${sep}${serial}`;
}

function saveCodeRule() {
  if (!codeForm.value) return;
  const prefix = String(codeForm.value.prefix || '').trim().toUpperCase();
  if (!prefix) return;
  const next = { ...codeForm.value, prefix, sample: codePreviewText({ ...codeForm.value, prefix }), updated: '2026-05-26' };
  rows.value = rows.value.map((row) => row.id === next.id ? next : row);
  showCodeModal.value = false;
}

function toggleCodeRule(row: SettingRow) {
  const nextStatus = row.status === '启用' ? '停用' : '启用';
  if (!window.confirm(`确认${nextStatus}编码规则「${row.object || row.form || row.prefix}」吗？该规则会影响后续质检单号生成。`)) return;
  row.status = nextStatus;
}

function numberPreviewValue(key: string) {
  if (key === 'cc1' || key === 'cc2') return numberCodeValues.value[key] || '';
  return numberCandidateMap[key]?.preview || '';
}

function toggleNumberItem(key: string) {
  const item = numberCandidateMap[key];
  if (!item) return;
  if (selectedNumberItems.value.includes(key)) {
    selectedNumberItems.value = selectedNumberItems.value.filter((itemKey) => itemKey !== key);
    delete numberSearchFlags.value[key];
    return;
  }
  if (selectedNumberItems.value.length >= 4) return;
  if (item.group) {
    selectedNumberItems.value = selectedNumberItems.value.filter((itemKey) => numberCandidateMap[itemKey]?.group !== item.group);
  }
  selectedNumberItems.value.push(key);
}

function removeNumberItem(key: string) {
  if (!window.confirm(`确认删除编号项「${numberCandidateMap[key]?.label || key}」吗？删除后当前编号预览会立即变化。`)) return;
  selectedNumberItems.value = selectedNumberItems.value.filter((itemKey) => itemKey !== key);
  delete numberSearchFlags.value[key];
  if (key === 'cc1' || key === 'cc2') {
    numberCodeValues.value[key] = key === 'cc1' ? 'C1' : 'C2';
    numberLabelValues.value[key] = key === 'cc1' ? '自定义代码1' : '自定义代码2';
  }
}

function dropNumberItem(index: number) {
  if (numberDragIndex.value === null || numberDragIndex.value === index) return;
  const next = [...selectedNumberItems.value];
  const [moved] = next.splice(numberDragIndex.value, 1);
  next.splice(index, 0, moved);
  selectedNumberItems.value = next;
  numberDragIndex.value = null;
}

function resetNumberRule() {
  if (!window.confirm('确认重置当前质检编号规则吗？重置后已选编号项会被清空。')) return;
  selectedNumberItems.value = [];
  numberPrefix.value = 'QC';
  numberSeparator.value = '-';
  numberSearchFlags.value = {};
  numberCodeValues.value = { cc1: 'C1', cc2: 'C2' };
  numberLabelValues.value = { cc1: '自定义代码1', cc2: '自定义代码2' };
}

function addRow() {
  if (currentKey.value === 'groups') {
    showChildModal.value = true;
    return;
  }
  if (currentKey.value === 'fields') {
    showFieldModal.value = true;
    return;
  }
  if (currentKey.value === 'numbers') {
    return;
  }
  if (currentKey.value === 'levels') {
    showLevelModal.value = true;
    return;
  }
  if (currentKey.value === 'approvals') {
    openApprovalEditor();
    return;
  }
  if (currentKey.value === 'print') {
    rows.value.push({ id: Date.now(), enabled: true, name: '新增质检打印模板', scene: '通用质检', paper: 'A4', creator: '老夏', updatedAt: '2026-05-30' });
    return;
  }
  rows.value.push({ id: Date.now(), enabled: true, name: '新配置项', code: 'AUTO_CODE', scene: '新审批场景', rule: '待配置', type: '文本' });
}

function addLevelFromModal() {
  const name = levelForm.value.name.trim();
  if (!name) return;
  rows.value.push({
    id: Date.now(),
    name,
    remark: levelForm.value.remark.trim(),
    enabled: levelForm.value.enabled,
  });
  levelForm.value = { name: '', remark: '', enabled: true };
  showLevelModal.value = false;
}

function openApprovalEditor(row?: SettingRow) {
  editingApprovalId.value = row?.id || null;
  approvalForm.value = {
    name: String(row?.name || ''),
    category: String(row?.category || '文档库'),
    creator: String(row?.creator || '老夏'),
    updatedAt: String(row?.updatedAt || '2026-05-26 10:00'),
    nodes: row?.nodes?.length ? row.nodes.map((node: any) => ({
      ...node,
      approvers: approvalApproverNames(node),
      method: node.method === '顺签' ? '依次审批' : node.method,
    })) : [
      { name: '', approvers: [], method: '依次审批' },
      { name: '', approvers: [], method: '依次审批' },
      { name: '', approvers: [], method: '依次审批' },
    ],
  };
  activeApprovalNode.value = Math.min(1, approvalForm.value.nodes.length - 1);
  showApprovalEditor.value = true;
}

function addApprovalNode() {
  approvalForm.value.nodes.push({ name: '', approvers: [], method: '依次审批' });
  activeApprovalNode.value = approvalForm.value.nodes.length - 1;
}

function updateApprovalNode(index: number, node: ApprovalNode) {
  approvalForm.value.nodes[index] = node;
}

function removeApprovalNode(index: number) {
  if (approvalForm.value.nodes.length <= 1) return;
  if (!window.confirm(`确认删除审批节点 ${index + 1} 吗？删除后当前审批流会立即少一个节点。`)) return;
  approvalForm.value.nodes.splice(index, 1);
  activeApprovalNode.value = Math.max(0, Math.min(activeApprovalNode.value, approvalForm.value.nodes.length - 1));
}

function approvalApproverNames(node: { approvers?: string | string[] }) {
  if (Array.isArray(node.approvers)) return node.approvers.map((name) => String(name).trim()).filter(Boolean);
  return String(node.approvers || '').split(/[，,]/).map((name) => name.trim()).filter(Boolean);
}

function removeApprovalApprover(index: number, name: string) {
  const node = approvalForm.value.nodes[index];
  if (!node) return;
  if (!window.confirm(`确认移除审批人「${name}」吗？`)) return;
  node.approvers = approvalApproverNames(node).filter((item) => item !== name);
}

function openApprovalPersonPicker(index: number) {
  activeApprovalPickerIndex.value = index;
  pickedPersons.value = [];
  showPersonPicker.value = true;
}

function saveApprovalRule() {
  const name = approvalForm.value.name.trim();
  if (!name) return;
  const next = {
    id: editingApprovalId.value || Date.now(),
    name,
    category: approvalForm.value.category,
    nodes: approvalForm.value.nodes.filter((node) => node.name || node.approvers.length).map((node) => ({ ...node, approvers: [...node.approvers] })),
    creator: approvalForm.value.creator.trim() || '老夏',
    updatedAt: approvalForm.value.updatedAt.trim() || '2026-05-26 10:00',
    enabled: true,
  };
  rows.value = editingApprovalId.value ? rows.value.map((row) => row.id === editingApprovalId.value ? next : row) : [...rows.value, next];
  showApprovalEditor.value = false;
}

function closeApprovalEditor() {
  showApprovalEditor.value = false;
}

function addFieldFromModal() {
  const name = fieldForm.value.name.trim();
  if (!name) return;
  rows.value.push({
    id: Date.now(),
    name,
    code: fieldForm.value.code.trim() || 'qcom_field',
    type: fieldForm.value.type,
    required: fieldForm.value.required,
    defaultValue: fieldForm.value.defaultValue.trim(),
    placeholder: fieldForm.value.placeholder.trim(),
    permissions: fieldForm.value.permissions.map((item) => ({ ...item })),
    scope: activeFieldScope.value,
    enabled: true,
  });
  fieldForm.value = {
    name: '',
    code: '',
    type: '文本',
    required: '否',
    defaultValue: '',
    placeholder: '',
    permissions: [],
  };
  showFieldModal.value = false;
}

function togglePickerPerson(person: { id: string; name: string; role: string; phone: string }) {
  pickedPersons.value = pickedPersons.value.some((item) => item.id === person.id)
    ? pickedPersons.value.filter((item) => item.id !== person.id)
    : [...pickedPersons.value, person];
}

function togglePickerAll() {
  pickedPersons.value = allPickerChecked.value ? [] : [...pickerPersons.value];
}

function closePersonPicker() {
  activeApprovalPickerIndex.value = null;
  pickedPersons.value = [];
  showPersonPicker.value = false;
}

function confirmPickedPersons() {
  if (activeApprovalPickerIndex.value !== null) {
    const node = approvalForm.value.nodes[activeApprovalPickerIndex.value];
    if (node) {
      const existingNames = approvalApproverNames(node);
      const nextNames = [...existingNames];
      pickedPersons.value.forEach((person) => {
        if (!nextNames.includes(person.name)) nextNames.push(person.name);
      });
      node.approvers = nextNames;
    }
    closePersonPicker();
    return;
  }

  pickedPersons.value.forEach((person) => {
    if (!fieldForm.value.permissions.some((item) => item.name === person.name)) {
      fieldForm.value.permissions.push({ name: person.name, dept: pickerDept.value, role: person.role, visible: true });
    }
  });
  closePersonPicker();
}

function addRootGroup() {
  const name = rootForm.value.name.trim();
  if (!name) return;
  const id = Date.now();
  rows.value.push({
    id,
    name,
    parent: '无',
    code: rootForm.value.code.trim() || 'QCPG-ROOT',
    policy: '未设置',
    remark: rootForm.value.remark.trim() || '暂无分组备注',
    count: 0,
    enabled: true,
  });
  activeRootId.value = id;
  rootForm.value = { name: '', code: '', remark: '' };
  showRootModal.value = false;
}

function closeChildModal() {
  childForm.value = { name: '', code: '', remark: '' };
  showChildModal.value = false;
}

function addChildGroup() {
  const name = childForm.value.name.trim();
  if (!name) return;
  const parent = activeRoot.value || rootGroups.value[0];
  rows.value.push({
    id: Date.now(),
    name,
    parent: String(parent?.name || '无'),
    code: childForm.value.code.trim() || 'QCPG-CHILD',
    schemeCount: 0,
    policy: '未关联方案',
    remark: childForm.value.remark.trim(),
    enabled: true,
  });
  closeChildModal();
}

function removeRow(id: number) {
  if (rows.value.length <= 1) return;
  const row = rows.value.find((item) => item.id === id);
  if (!window.confirm(`确认删除${current.value.title}「${row?.name || row?.code || row?.prefix || id}」吗？删除后当前配置列表会立即移除。`)) return;
  rows.value = rows.value.filter((row) => row.id !== id);
}

function toggleRow(row: SettingRow) {
  toggleEnabled(row, undefined, current.value.title);
}

function toggleEnabled(row: SettingRow, event?: Event, label = '质检配置') {
  const target = event?.target as HTMLInputElement | undefined;
  const nextEnabled = target ? target.checked : !row.enabled;
  const nextText = nextEnabled ? '启用' : '停用';
  if (!window.confirm(`确认${nextText}${label}「${row.name || row.code || row.prefix || row.id}」吗？`)) {
    if (target) target.checked = Boolean(row.enabled);
    return;
  }
  row.enabled = nextEnabled;
}

function updateQcStrategyRule(tabKey: string, nextRule: StrategyRule) {
  const tab = qcPolicyConfig.value.find((item) => item.key === tabKey);
  if (!tab) return;
  tab.rows = updateStrategyRows(tab.rows, nextRule);
}

function cloneStrategyRows(strategyRows: StrategyRule[]): StrategyRule[] {
  return strategyRows.map((row) => ({
    ...row,
    options: row.options ? [...row.options] : undefined,
    children: row.children ? cloneStrategyRows(row.children) : undefined,
  }));
}

function updateStrategyRows(strategyRows: StrategyRule[], nextRule: StrategyRule): StrategyRule[] {
  return strategyRows.map((row) => {
    if (row.key === nextRule.key) return { ...row, ...nextRule };
    if (!row.children?.length) return row;
    return {
      ...row,
      children: updateStrategyRows(row.children, nextRule),
    };
  });
}

function resetQcStrategies() {
  if (!window.confirm('确认重置质检策略设置吗？重置后当前未保存内容会被覆盖。')) return;
  qcPolicyConfig.value = defaultQcPolicyConfig.map((tab) => ({
    ...tab,
    rows: cloneStrategyRows(tab.rows),
  }));
}

function saveQcStrategies() {
  qcPolicyConfig.value = qcPolicyConfig.value.map((tab) => ({
    ...tab,
    rows: cloneStrategyRows(tab.rows),
  }));
}
</script>


