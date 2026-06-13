<template>
  <aw-setting-page>
    <template #toolbar>
      <aw-setting-toolbar
        back-text="返回客户列表"
        :add-text="current.addText"
        :editor-mode="currentKey === 'approvals' && showApprovalEditor"
        :show-add="currentKey !== 'strategies'"
        @add="addRow"
        @back="router.push('/sales/customers')"
        @cancel="closeApprovalEditor"
        @save="saveApprovalRule"
      />
    </template>

    <aw-setting-split-page v-if="currentKey === 'groups'">
      <template #tree>
        <aw-setting-tree
          add-title="新增客户分类"
          :active-key="activeRootId"
          :items="groupTreeItems"
          show-add
          title="客户分类"
          @add="showRootModal = true"
          @select="selectRoot"
        />
      </template>
      <aw-setting-list-card
        v-model:keyword="keyword"
        :description="activeRoot?.remark || '暂无分类备注'"
        search-placeholder="搜索下级分类名称/编号"
        :title="activeRoot?.name || '客户分组设置'"
      >
        <div class="aw-doc-tbl-wrap">
          <div class="aw-doc-tbl-inner">
            <table class="aw-doc-tbl">
              <thead>
                <tr>
                  <th style="width:70px">序号</th>
                  <th>分组名称</th>
                  <th>上级分组</th>
                  <th>分组编号</th>
                  <th style="width:100px">客户数量</th>
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
                  <td>{{ categoryCustomerCount(row.name) }}</td>
                  <td><label class="aw-switch-line mini"><input v-model="row.enabled" type="checkbox" /><i></i></label></td>
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
        description="配置要显示在当前区域内的客户自定义字段。"
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
                  <td><label class="aw-switch-line mini"><input v-model="row.enabled" type="checkbox" /><i></i></label></td>
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
      :description="customerPolicyDescription"
      :tabs="customerStrategyTabs"
      :title="customerPolicyDefaults.title"
      @reset="resetCustomerStrategies"
      @save="saveCustomerStrategies"
      @update-rule="updateCustomerStrategyRule"
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
                  <label v-else-if="column.key === 'enabled'" class="aw-switch-line mini"><input v-model="row.enabled" type="checkbox" /><i></i></label>
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
          <strong>新增客户分类</strong>
          <button type="button" class="aw-modal-close" @click="showRootModal = false">×</button>
        </div>
        <div class="aw-modal-body">
          <label class="aw-field">
            <span>分类名称</span>
            <input v-model="rootForm.name" placeholder="请输入分类名称" />
          </label>
          <label class="aw-field">
            <span>分类编号</span>
            <input v-model="rootForm.code" placeholder="请输入分类编号" />
          </label>
          <label class="aw-field aw-field-full">
            <span>分类备注</span>
            <textarea v-model="rootForm.remark" placeholder="请输入分类备注"></textarea>
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
          <strong>新增下级分类</strong>
          <button type="button" class="aw-modal-close" @click="closeChildModal">×</button>
        </div>
        <div class="aw-modal-body">
          <label class="aw-field">
            <span>分类名称</span>
            <input v-model="childForm.name" placeholder="请输入分类名称" />
          </label>
          <label class="aw-field">
            <span>分类编号</span>
            <input v-model="childForm.code" placeholder="请输入分类编号" />
          </label>
          <label class="aw-field aw-field-full">
            <span>分类备注</span>
            <textarea v-model="childForm.remark" placeholder="请输入分类备注"></textarea>
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

interface CustomerPolicyRule {
  title: string;
  sub: string;
  type?: string;
  value?: string;
  options?: string[];
  on?: boolean;
  children?: CustomerPolicyRule[];
}

interface CustomerPolicyTab {
  k: string;
  label: string;
  rows: CustomerPolicyRule[];
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
  销售部: [
    { id: '400001', name: '陈志强', role: '销售经理', phone: '13800001111' },
    { id: '400002', name: '刘芳', role: '销售代表', phone: '13800002222' },
  ],
};
const pickerDepartments = ['傲为智慧有限公司', '采购部', '采购一部', '采购二部', '设计部', '产品部', '销售部'];
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
const numberPrefix = ref('AA');
const numberSeparator = ref('-');
const numberSearchFlags = ref<Record<string, boolean>>({});
const numberCodeValues = ref<Record<string, string>>({ cc1: 'C1', cc2: 'C2' });
const numberLabelValues = ref<Record<string, string>>({ cc1: '自定义代码1', cc2: '自定义代码2' });
const numberDragIndex = ref<number | null>(null);

const settingMap: Record<string, SettingConfig> = {
  groups: {
    title: '客户分组设置',
    desc: '维护客户分组、默认等级、默认状态和信用政策，支持后续作为其他模块分组设置模板。',
    search: '搜索分组名称/编号',
    addText: '新增下级分类',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '分组名称', width: '180px' },
      { key: 'parent', label: '上级分组', width: '140px' },
      { key: 'code', label: '分组编号', width: '170px' },
      { key: 'count', label: '客户数量', width: '100px' },
      { key: 'enabled', label: '状态', width: '90px' },
    ],
    rows: [
      { id: 1, name: '重点客户', parent: '无', code: 'CUST_GRP_KEY', policy: 'A级 | 已审核 | 月结30天', remark: '重点维护高价值客户，默认执行A级授信和月结30天策略。', count: 86, enabled: true },
      { id: 2, name: '战略客户', parent: '无', code: 'CUST_GRP_STRATEGIC', policy: 'A级 | 跟进中 | 授信额度', remark: '用于长期合作、年度框架及重点项目客户，支持独立授信策略。', count: 42, enabled: true },
      { id: 3, name: '普通客户', parent: '无', code: 'CUST_GRP_NORMAL', policy: 'B级 | 已审核 | 现结', remark: '标准交易客户分类，默认按常规审核和现结规则执行。', count: 95, enabled: true },
      { id: 4, name: '渠道客户', parent: '无', code: 'CUST_GRP_CHANNEL', policy: 'B级 | 已审核 | 月结15天', remark: '经销商、代理商等渠道客户，默认使用渠道账期和分销策略。', count: 15, enabled: true },
      { id: 5, name: '华南重点客户', parent: '重点客户', code: 'CUST_GRP_KEY_SC', policy: 'A级 | 已审核 | 月结30天', count: 28, enabled: true },
      { id: 6, name: '海南重点客户', parent: '重点客户', code: 'CUST_GRP_KEY_HN', policy: 'A级 | 已审核 | 授信额度', count: 18, enabled: true },
      { id: 7, name: '年度框架客户', parent: '战略客户', code: 'CUST_GRP_STR_FRAME', policy: 'A级 | 跟进中 | 授信额度', count: 12, enabled: true },
      { id: 8, name: '临时交易客户', parent: '普通客户', code: 'CUST_GRP_NORMAL_TEMP', policy: 'C级 | 待审核 | 现结', count: 23, enabled: true },
      { id: 9, name: '经销商客户', parent: '渠道客户', code: 'CUST_GRP_CHANNEL_DEALER', policy: 'B级 | 已审核 | 月结15天', count: 9, enabled: true },
    ],
  },
  fields: {
    title: '客户自定义字段',
    desc: '配置客户档案中的扩展字段，包含字段类型、必填、启用和排序。',
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
      { id: 1, name: '客户来源', code: 'customer_source', type: '下拉', required: '否', scope: '客户信息', enabled: true },
      { id: 2, name: '合作偏好', code: 'cooperation_preference', type: '文本', required: '否', scope: '客户详情', enabled: true },
      { id: 3, name: '风险等级', code: 'risk_level', type: '下拉', required: '是', scope: '基础信息', enabled: true },
      { id: 4, name: '开户地址', code: 'invoice_address', type: '文本', required: '否', scope: '财务信息', enabled: true },
      { id: 5, name: '收货偏好', code: 'delivery_preference', type: '文本', required: '否', scope: '地址信息', enabled: true },
    ],
  },
  numbers: {
    title: '客户自定义编号',
    desc: '维护客户编号规则，支持前缀、日期段、流水号和预览。',
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
      { id: 1, module: '销售中心', form: '客户表单', object: '客户', prefix: 'CUS', sample: 'CUS-202605-001', status: '启用', owner: '销售管理员', updated: '2026-05-15', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 2, module: '销售中心', form: '报价单', object: '报价', prefix: 'QT', sample: 'QT-202605-001', status: '启用', owner: '销售管理员', updated: '2026-05-15', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 3, module: '销售中心', form: '销售订单', object: '订单', prefix: 'SO', sample: 'SO-202605-001', status: '启用', owner: '销售管理员', updated: '2026-05-15', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 4, module: '采购中心', form: '供应商表单', object: '供应商', prefix: 'SUP', sample: 'SUP-202605-001', status: '启用', owner: '采购管理员', updated: '2026-05-16', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 5, module: '仓储中心', form: '入库单', object: '入库', prefix: 'IN', sample: 'IN-202605-001', status: '启用', owner: '仓储管理员', updated: '2026-05-14', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 6, module: '仓储中心', form: '调拨单', object: '调拨', prefix: 'TR', sample: 'TR-202605-001', status: '停用', owner: '仓储管理员', updated: '2026-05-12', dateRule: '年月', serial: '3位', separator: '-' },
      { id: 7, module: '生产中心', form: '生产工单', object: '生产工单', prefix: 'WO', sample: 'WO-202605-001', status: '启用', owner: '生产管理员', updated: '2026-05-13', dateRule: '年月', serial: '3位', separator: '-' },
    ],
  },
  levels: {
    title: '客户等级设置',
    desc: '维护客户等级和启用状态。',
    search: '搜索等级名称',
    addText: '新增等级',
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '等级名称', width: '150px' },
      { key: 'remark', label: '备注' },
      { key: 'enabled', label: '是否启用', width: '110px' },
    ],
    rows: [
      { id: 1, name: 'A级', remark: '高价值客户等级', enabled: true },
      { id: 2, name: 'B级', remark: '稳定交易客户等级', enabled: true },
      { id: 3, name: 'C级', remark: '新客户或待评估客户等级', enabled: true },
    ],
  },
  approvals: {
    title: '客户审批设置',
    desc: '配置客户新增、资料变更、授信调整等审批流程。',
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
      { id: 1, name: '客户建档审批流程', category: '客户管理', nodes: [{ name: '销售主管审批', approvers: '老夏', method: '顺签' }, { name: '财务审批', approvers: '陈思源', method: '或签' }], creator: '老夏', updatedAt: '2026-05-17 14:30', enabled: true },
      { id: 2, name: '客户授信调整审批流程', category: '授信管理', nodes: [{ name: '销售主管审批', approvers: '老夏', method: '顺签' }, { name: '财务经理审批', approvers: '陈思源', method: '会签' }], creator: '陈思源', updatedAt: '2026-05-18 09:15', enabled: true },
    ],
  },
  strategies: {
    title: '客户策略设置',
    desc: '维护客户信用、账期、停用和风险控制策略。',
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
      { id: 1, name: '超额拦截', type: '信用策略', rule: '超过可用额度需审批或提前收款', scope: '授信客户', enabled: true },
      { id: 2, name: '逾期提醒', type: '账期策略', rule: '逾期未回款自动提醒销售负责人', scope: '月结客户', enabled: true },
    ],
  },
};

const customerGroupApprovalOptions = ['客户分组变更审批流', '通用单级审批流', '销售总监审批流'];
const customerManagerApprovalOptions = ['客户经理变更审批流', '通用单级审批流', '销售总监审批流'];
const customerInfoApprovalOptions = ['通用单级审批流', '客户信息变更审批流'];
const customerDirectorApprovalOptions = ['销售总监审批流', '通用单级审批流'];
const customerPolicyDescription = '用于配置审批流、操作权限、数据校验和自动化动作策略。';
const customerPolicyDefaults: { title: string; tabs: CustomerPolicyTab[] } = {
  title: '客户策略设置',
  tabs: [
    {
      k: 'approvalFlow',
      label: '审批流策略',
      rows: [
        {
          title: '更换所属客户分组',
          sub: '客户移入不同分组时是否触发审批流。',
          on: false,
          children: [
            { title: '审批流程', sub: '客户移入不同分组时选择已配置的审批流模板。', type: 'select', value: '客户分组变更审批流', options: customerGroupApprovalOptions },
            { title: '审批期间原分组数据可见性', sub: '审批进行中，控制原分组的数据是否继续可见。', type: 'select', value: '保持原分组可见', options: ['保持原分组可见', '隐藏至审批通过'] },
          ],
        },
        {
          title: '更换客户经理',
          sub: '客户负责人发生变更时是否触发审批。',
          on: false,
          children: [
            { title: '审批流程', sub: '客户负责人发生变更时选择已配置的审批流模板。', type: 'select', value: '客户经理变更审批流', options: customerManagerApprovalOptions },
            { title: '同部门内互转豁免审批', sub: '同部门成员之间的客户转移无需审批。', on: false },
          ],
        },
        {
          title: '更换默认联系人',
          sub: '修改客户主联系人时是否需要审批。',
          on: false,
          children: [
            { title: '审批流程', sub: '修改客户主联系人时选择已配置的审批流模板。', type: 'select', value: '通用单级审批流', options: customerInfoApprovalOptions },
          ],
        },
        {
          title: '更换默认收货/开票地址',
          sub: '默认收货地址或开票地址变更时是否触发审批。',
          on: false,
          children: [
            { title: '适用客户等级', sub: '限定哪些等级的客户变更地址需要审批。', type: 'select', value: '全部等级', options: ['全部等级', 'VIP·战略客户', 'A 级及以上'] },
            { title: '审批流程', sub: '默认收货地址或开票地址变更时选择已配置的审批流模板。', type: 'select', value: '通用单级审批流', options: customerInfoApprovalOptions },
          ],
        },
        {
          title: '删除客户',
          sub: '删除操作不可逆，建议始终开启审批。',
          on: false,
          children: [
            { title: '审批流程', sub: '删除客户时选择已配置的审批流模板。', type: 'select', value: '销售总监审批流', options: customerDirectorApprovalOptions },
            { title: '有未完结单据时处理方式', sub: '客户存在未结订单或合同时的处理策略。', type: 'select', value: '直接阻断，不允许删除', options: ['直接阻断，不允许删除', '警告提示，允许强制删除'] },
          ],
        },
      ],
    },
    {
      k: 'permissions',
      label: '操作权限策略',
      rows: [
        {
          title: '客户信息查看范围',
          sub: '控制销售人员和公海客户的默认可见范围。',
          on: false,
          children: [
            { title: '普通销售人员默认可见范围', sub: '控制销售人员默认能看到哪些客户记录。', type: 'select', value: '仅本人负责的客户', options: ['仅本人负责的客户', '本部门所有客户', '全公司所有客户'] },
            { title: '公海客户对全员可见', sub: '公海池中的客户是否所有人都能查看。', on: false },
          ],
        },
        {
          title: '敏感字段访问控制',
          sub: '控制信用额度、历史交易金额等敏感字段的查看权限。',
          on: false,
          children: [
            { title: '信用额度字段可见角色', sub: '能查看客户信用额度的最低角色。', type: 'select', value: '销售经理及以上', options: ['销售经理及以上', '销售总监及以上', '全员可见'] },
            { title: '历史交易金额可见角色', sub: '能查看历史交易金额的最低角色。', type: 'select', value: '销售经理及以上', options: ['销售经理及以上', '本人负责客户可见', '全员可见'] },
          ],
        },
        {
          title: '客户导出权限',
          sub: '控制客户资料导出的角色门槛、脱敏和日志记录。',
          on: false,
          children: [
            { title: '允许导出的最低角色', sub: '能将客户列表导出为文件的最低角色。', type: 'select', value: '销售经理及以上', options: ['销售经理及以上', '销售总监及以上', '所有角色'] },
            { title: '导出时脱敏手机号/邮箱', sub: '导出文件中隐藏联系方式中间位。', on: false },
            { title: '导出操作记录日志', sub: '每次导出生成操作日志记录。', on: false },
          ],
        },
        {
          title: '公海池规则',
          sub: '控制客户公海池启用、自动释放和每日认领上限。',
          on: false,
          children: [
            { title: '无跟进超期自动释放天数', sub: '超过指定天数无跟进记录，自动释放到公海。', type: 'select', value: '90 天', options: ['30 天', '60 天', '90 天', '不自动释放'] },
            { title: '每人每天最多认领数量', sub: '单个销售人员每天从公海认领客户的上限。', type: 'select', value: '10 个', options: ['5 个', '10 个', '20 个', '不限制'] },
          ],
        },
      ],
    },
    {
      k: 'validation',
      label: '数据校验策略',
      rows: [
        {
          title: '重复客户检测',
          sub: '新建客户时自动检测是否存在相似记录。',
          on: false,
          children: [
            { title: '检测依据字段', sub: '用于判断重复客户的字段组合。', type: 'select', value: '手机号 + 公司名称', options: ['手机号 + 公司名称', '仅手机号', '仅公司名称', '统一社会信用代码'] },
            { title: '检测到重复时处理方式', sub: '发现重复客户后的系统行为。', type: 'select', value: '警告提示，允许继续创建', options: ['警告提示，允许继续创建', '阻断，不允许创建', '需管理员确认后创建'] },
          ],
        },
        {
          title: '信用额度校验',
          sub: '控制单客户信用额度上限和超限后的处理方式。',
          on: false,
          children: [
            { title: '单客户信用额度上限', sub: '设置或修改信用额度的最高值限制。', type: 'select', value: '不限制', options: ['不限制', '100 万元', '500 万元', '自定义'] },
            { title: '超过信用额度上限时处理方式', sub: '信用额度超出上限时的系统行为。', type: 'select', value: '阻断保存，必须审批', options: ['阻断保存，必须审批', '警告提示，允许保存'] },
          ],
        },
        {
          title: '必填字段校验',
          sub: '控制新建客户和转正式客户时必须填写的字段。',
          on: false,
          children: [
            { title: '新建客户时必填字段', sub: '创建客户时强制要求填写的字段组合。', type: 'select', value: '客户名称 + 联系人 + 手机号', options: ['客户名称 + 联系人 + 手机号', '客户名称 + 手机号', '仅客户名称'] },
            { title: '转正式客户时额外必填', sub: '客户从潜在升为正式时的额外必填项。', type: 'select', value: '统一社会信用代码 + 地址', options: ['统一社会信用代码 + 地址', '地址即可', '不做限制'] },
          ],
        },
      ],
    },
    {
      k: 'automation',
      label: '自动化动作策略',
      rows: [
        {
          title: '跟进超时自动提醒',
          sub: '客户长时间无跟进记录时自动通知客户经理。',
          on: false,
          children: [
            { title: '触发天数阈值', sub: '超过多少天无跟进触发提醒。', type: 'select', value: '14 天', options: ['7 天', '14 天', '30 天'] },
            { title: '通知方式', sub: '提醒消息的发送渠道。', type: 'select', value: '系统站内通知', options: ['系统站内通知', '站内通知 + 邮件', '站内通知 + 短信'] },
            { title: '同时抄送客户经理上级', sub: '提醒时是否同步通知直属上级。', on: false },
          ],
        },
        {
          title: '客户生日/重要日期提醒',
          sub: '在客户生日或关键纪念日前提醒客户经理。',
          on: false,
          children: [
            { title: '提前提醒天数', sub: '距日期提前多少天发送提醒。', type: 'select', value: '提前 3 天', options: ['提前 1 天', '提前 3 天', '提前 7 天'] },
          ],
        },
        {
          title: '客户等级自动升降级',
          sub: '根据交易额或频率自动调整客户等级。',
          on: false,
          children: [
            { title: '评定依据', sub: '用于计算客户等级的指标。', type: 'select', value: '近 12 个月累计交易额', options: ['近 12 个月累计交易额', '近 12 个月订单数量', '综合评分（金额 + 频次）'] },
            { title: '等级变动时通知客户经理', sub: '等级变化后自动通知对应客户经理。', on: false },
          ],
        },
      ],
    },
  ],
};
const customerStrategyTabs = ref<StrategyTab[]>(createCustomerStrategyTabs());

const currentKey = computed(() => String(route.params.setting || 'groups'));
const current = computed(() => settingMap[currentKey.value] || settingMap.groups);
const rootGroups = computed(() => rows.value.filter((row) => row.parent === '无'));
const activeRootId = ref<number | undefined>();
const activeRoot = computed(() => rootGroups.value.find((row) => row.id === activeRootId.value) || rootGroups.value[0]);
const groupChildren = computed(() => rows.value.filter((row) => row.parent === activeRoot.value?.name));
const fieldScopes = ['基础信息', '客户信息', '财务信息', '地址信息', '附件信息', '客户详情'];
const activeFieldScope = ref(fieldScopes[0]);
const customerGroupCounts: Record<string, number> = {
  重点客户: 1,
  战略客户: 1,
  普通客户: 1,
  渠道客户: 1,
};
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
  return customerGroupCounts[String(name)] || 0;
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

function createCustomerStrategyTabs(): StrategyTab[] {
  return customerPolicyDefaults.tabs.map((tab) => ({
    key: tab.k,
    label: tab.label,
    rows: normalizeCustomerStrategyRows(tab.rows, tab.k),
  }));
}

function normalizeCustomerStrategyRows(policyRows: CustomerPolicyRule[], prefix: string): StrategyRule[] {
  return policyRows.map((row, index) => {
    const key = `${prefix}-${index}-${row.title.replace(/[^\w\u4e00-\u9fa5]/g, '')}`;
    return {
      key,
      title: row.title,
      sub: row.sub,
      type: row.type === 'select' ? 'select' : 'switch',
      value: row.value,
      options: row.options ? [...row.options] : undefined,
      enabled: row.type === 'select' ? row.on : row.on !== false,
      children: row.children ? normalizeCustomerStrategyRows(row.children, key) : undefined,
    };
  });
}

function cloneCustomerStrategyRows(strategyRows: StrategyRule[]): StrategyRule[] {
  return strategyRows.map((row) => ({
    ...row,
    options: row.options ? [...row.options] : undefined,
    children: row.children ? cloneCustomerStrategyRows(row.children) : undefined,
  }));
}

function updateCustomerStrategyRule(tabKey: string, nextRule: StrategyRule) {
  const tab = customerStrategyTabs.value.find((item) => item.key === tabKey);
  if (!tab) return;
  tab.rows = updateCustomerStrategyRows(tab.rows, nextRule);
}

function updateCustomerStrategyRows(strategyRows: StrategyRule[], nextRule: StrategyRule): StrategyRule[] {
  return strategyRows.map((row) => {
    if (row.key === nextRule.key) return { ...row, ...nextRule };
    if (!row.children?.length) return row;
    return { ...row, children: updateCustomerStrategyRows(row.children, nextRule) };
  });
}

function resetCustomerStrategies() {
  if (!confirmClear('客户策略设置')) return;
  customerStrategyTabs.value = createCustomerStrategyTabs();
}

function saveCustomerStrategies() {
  customerStrategyTabs.value = customerStrategyTabs.value.map((tab) => ({
    ...tab,
    rows: cloneCustomerStrategyRows(tab.rows),
  }));
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
  row.status = row.status === '启用' ? '停用' : '启用';
}

function numberPreviewValue(key: string) {
  if (key === 'cc1' || key === 'cc2') return numberCodeValues.value[key] || '';
  return numberCandidateMap[key]?.preview || '';
}

function confirmRemove(label = '该配置') {
  return window.confirm(`确认删除${label}吗？删除后当前配置会立即移除。`);
}

function confirmClear(label = '当前配置') {
  return window.confirm(`确认重置${label}吗？重置后当前未保存内容会被覆盖。`);
}

function toggleNumberItem(key: string) {
  const item = numberCandidateMap[key];
  if (!item) return;
  if (selectedNumberItems.value.includes(key)) {
    if (!confirmRemove(item.label || '该编号项')) return;
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
  if (!confirmRemove(numberCandidateMap[key]?.label || '该编号项')) return;
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
  if (!confirmClear('编号规则')) return;
  selectedNumberItems.value = [];
  numberPrefix.value = 'AA';
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
  if (!confirmRemove(approvalForm.value.nodes[index]?.name || '该审批节点')) return;
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
  if (!confirmRemove(`审批人「${name}」`)) return;
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
    code: fieldForm.value.code.trim() || 'custom_field',
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
    code: rootForm.value.code.trim() || 'CUST_GRP_ROOT',
    policy: '未设置',
    remark: rootForm.value.remark.trim() || '暂无分类备注',
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
    code: childForm.value.code.trim() || 'CUST_GRP_CHILD',
    policy: '未设置',
    remark: childForm.value.remark.trim(),
    count: 0,
    enabled: true,
  });
  closeChildModal();
}

function removeRow(id: number) {
  if (rows.value.length <= 1) return;
  const target = rows.value.find((row) => row.id === id);
  if (!confirmRemove(String(target?.name || target?.object || '该配置'))) return;
  rows.value = rows.value.filter((row) => row.id !== id);
}

function toggleRow(row: SettingRow) {
  row.enabled = !row.enabled;
}
</script>
