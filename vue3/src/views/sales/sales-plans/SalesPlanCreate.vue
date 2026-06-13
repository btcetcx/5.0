<template>
  <aw-form-page :actions="formActions" back-text="返回计划列表" @back="emit('back')" @action="handleFormAction">
    <section class="aw-form-card">
      <div class="aw-detail-section-title">基础信息</div>
      <div class="aw-form-grid">
        <div class="aw-field"><label class="req">计划名称</label><input v-model="form.name" class="aw-input" placeholder="请输入销售计划名称" /></div>
        <div class="aw-field"><label>计划编号</label><input class="aw-input" value="自动生成" disabled /></div>
        <div class="aw-field"><label class="req">计划开始日期</label><input v-model="form.cycleStart" class="aw-input" type="date" /></div>
        <div class="aw-field"><label class="req">计划结束日期</label><input v-model="form.cycleEnd" class="aw-input" type="date" /></div>
        <div class="aw-field">
          <label>统计口径</label>
          <select v-model="statMethod" class="aw-select">
            <option>按发货</option>
            <option>按回款</option>
          </select>
        </div>
        <div class="aw-field">
          <label class="req">指定方式</label>
          <select v-model="assignMode" class="aw-select">
            <option>销售部门</option>
          </select>
        </div>
        <div class="aw-field">
          <label>销售部门</label>
          <select v-model="form.department" class="aw-select">
            <option>销售一部</option>
            <option>销售二部</option>
            <option>渠道组</option>
            <option>华南大区</option>
          </select>
        </div>
        <div class="aw-field">
          <label>客户范围</label>
          <select v-model="form.customerRange" class="aw-select">
            <option>全部客户</option>
            <option>重点客户</option>
            <option>战略客户</option>
            <option>渠道客户</option>
          </select>
        </div>
      </div>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">计划产品</div>
      <aw-editable-sub-table :columns="productColumns" :rows="products" add-text="新增明细" :action-width="90" @add="showProductPicker = true">
        <template #cell="{ column, row }">
          <input v-if="column.key === 'productCode'" v-model="row.productCode" class="aw-input" />
          <input v-else-if="column.key === 'productName'" v-model="row.productName" class="aw-input" />
          <input v-else-if="column.key === 'model'" v-model="row.model" class="aw-input" />
          <input v-else-if="column.key === 'unit'" v-model="row.unit" class="aw-input" />
          <input v-else-if="column.key === 'targetQuantity'" v-model="row.targetQuantity" class="aw-input" placeholder="0" @input="recalc(row)" />
          <input v-else-if="column.key === 'unitPrice'" v-model="row.unitPrice" class="aw-input" placeholder="¥ 0:00" @input="recalc(row)" />
          <input v-else-if="column.key === 'targetAmount'" :value="row.targetAmount ? money(row.targetAmount) : ''" class="aw-input" readonly />
          <input v-else-if="column.key === 'planMonth'" v-model="row.planMonth" class="aw-input" placeholder="如 2026-06" />
        </template>
        <template #actions="{ row }">
          <span class="aw-link" style="color:var(--aw-danger)" @click="removeProduct(row.id)">删除</span>
        </template>
      </aw-editable-sub-table>
      <div class="aw-form-summary">
        目标数量：<strong>{{ totalQuantity }}</strong>
        <span>目标金额：<strong>{{ money(totalAmount) }}</strong></span>
      </div>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">计划详情</div>
      <aw-rich-text-editor v-model="detail" placeholder="请输入计划背景、目标拆解、执行策略、风险说明等信息" />
      <div v-if="submitMessage" class="aw-form-note">{{ submitMessage }}</div>
    </section>

    <div v-if="showProductPicker" class="aw-mask" @click="showProductPicker = false">
      <div class="aw-modal lg" @click.stop>
        <div class="head"><strong>选择产品</strong><button class="aw-modal-close" type="button" @click="showProductPicker = false">×</button></div>
        <div class="body product-picker-body">
          <aside class="product-picker-categories">
            <button
              v-for="category in productCategories"
              :key="category"
              class="product-picker-category"
              :class="{ on: activeProductCategory === category }"
              type="button"
              @click="activeProductCategory = category"
            >
              {{ category }}
            </button>
          </aside>
          <div class="product-picker-list">
            <div class="product-picker-count">已勾选 {{ pickedProducts.length }} 项</div>
            <table class="aw-table">
              <thead><tr><th>选择</th><th>产品编号</th><th>产品名称</th><th>规格型号</th><th>产品分类</th><th>单位</th><th>计划单价</th></tr></thead>
              <tbody>
                <tr v-for="row in filteredProductPickerRows" :key="row.productCode" @click="togglePickedProduct(row)">
                  <td><label class="aw-check"><input type="checkbox" :checked="pickedProducts.some((item) => item.productCode === row.productCode)" /><span /></label></td>
                  <td class="aw-num">{{ row.productCode }}</td><td>{{ row.productName }}</td><td>{{ row.model }}</td><td>{{ row.category }}</td><td>{{ row.unit }}</td><td class="aw-num">{{ money(row.unitPrice) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-tool-btn" type="button" @click="showProductPicker = false">取消</button>
          <button class="aw-btn primary" type="button" @click="confirmProducts">确定</button>
        </div>
      </div>
    </div>
  </aw-form-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { createSalesPlan } from '@/app/api/sales/resources';
import { formatMoney, parseMoneyValue } from '@/app/utils/money';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import type { EditableColumn, FormAction } from '@/components/form-page/types';

type ProductRow = {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  model: string;
  unit: string;
  targetQuantity: string;
  unitPrice: string;
  targetAmount: string;
  planMonth: string;
};

const emit = defineEmits<{ back: [] }>();
const statMethod = ref('按发货');
const assignMode = ref('销售部门');
const form = ref({
  name: '',
  cycleStart: '',
  cycleEnd: '',
  department: '销售一部',
  customerRange: '全部客户',
});
const detail = ref('');
const showProductPicker = ref(false);
const products = ref<ProductRow[]>([]);
const pickedProducts = ref<ProductRow[]>([]);
const productCategories = ['全部产品', '成品', '半成品', '原材料'];
const activeProductCategory = ref('全部产品');
const submitMessage = ref('');
const submitting = ref(false);
const formActions: FormAction[] = [
  { key: 'draft', label: '保存草稿' },
  { key: 'reset', label: '重置' },
  { key: 'submit', label: '提交审批', primary: true },
];
const productColumns: EditableColumn[] = [
  { key: 'productCode', title: '产品编号', width: 130 },
  { key: 'productName', title: '产品名称', width: 150 },
  { key: 'model', title: '规格型号', width: 120 },
  { key: 'unit', title: '单位', width: 80 },
  { key: 'targetQuantity', title: '目标数量', width: 110 },
  { key: 'unitPrice', title: '计划单价', width: 110 },
  { key: 'targetAmount', title: '目标金额', width: 120 },
  { key: 'planMonth', title: '计划交付月', width: 120 },
];
const productPickerRows: ProductRow[] = [
  { id: 'p1', productCode: 'P-HM-450', productName: '高精度伺服电机', category: '成品', model: 'HM-450', unit: '台', targetQuantity: '', unitPrice: '6000.00', targetAmount: '', planMonth: '' },
  { id: 'p2', productCode: 'P-SEMI-001', productName: '半成品物料', category: '半成品', model: 'HM-451', unit: 'KG', targetQuantity: '', unitPrice: '50.00', targetAmount: '', planMonth: '' },
  { id: 'p3', productCode: 'P-AL-6061', productName: '铝合金型材', category: '原材料', model: 'AL-6061', unit: 'KG', targetQuantity: '', unitPrice: '32.00', targetAmount: '', planMonth: '' },
];
const filteredProductPickerRows = computed(() => (
  activeProductCategory.value === '全部产品'
    ? productPickerRows
    : productPickerRows.filter((row) => row.category === activeProductCategory.value)
));
const totalQuantity = computed(() => products.value.reduce((sum, row) => sum + toNumber(row.targetQuantity), 0));
const totalAmount = computed(() => products.value.reduce((sum, row) => sum + toNumber(row.targetAmount), 0));

function toNumber(value: string) {
  return parseMoneyValue(value);
}

function recalc(row: Record<string, any>) {
  const amount = toNumber(row.targetQuantity) * toNumber(row.unitPrice);
  row.targetAmount = amount ? amount.toFixed(2) : '';
}

function togglePickedProduct(row: ProductRow) {
  pickedProducts.value = pickedProducts.value.some((item) => item.productCode === row.productCode)
    ? pickedProducts.value.filter((item) => item.productCode !== row.productCode)
    : [...pickedProducts.value, row];
}

function confirmProducts() {
  products.value.push(...pickedProducts.value.map((row) => ({ ...row, id: `plan-${Date.now()}-${row.productCode}` })));
  pickedProducts.value = [];
  showProductPicker.value = false;
}

function removeProduct(id: string) {
  if (confirmRemove('计划产品')) products.value = products.value.filter((row) => row.id !== id);
}

function money(value: unknown) {
  return formatMoney(value);
}

async function handleFormAction(key: string) {
  if (key === 'reset') {
    if (!confirmClear('当前销售计划草稿')) return;
    form.value = { name: '', cycleStart: '', cycleEnd: '', department: '销售一部', customerRange: '全部客户' };
    products.value = [];
    detail.value = '';
    submitMessage.value = '已重置。';
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  await createSalesPlan({
    name: form.value.name || '新增销售计划',
    code: '自动生成',
    ownerType: assignMode.value,
    ownerName: `${assignMode.value} / ${form.value.department}`,
    cycleStart: form.value.cycleStart,
    cycleEnd: form.value.cycleEnd,
    productSummary: products.value.map((row) => row.productName).join('、') || '未选择产品',
    targetQuantity: totalQuantity.value,
    targetAmount: totalAmount.value,
    doneQuantity: 0,
    doneAmount: 0,
    achievementRate: 0,
    status: key === 'draft' ? 'draft' : 'pendingApproval',
    statusName: key === 'draft' ? '草稿' : '待审批',
    statisticMethod: statMethod.value,
    customerRange: form.value.customerRange,
    detail: detail.value,
    lines: products.value.map((row) => ({
      ...row,
      targetQuantity: toNumber(row.targetQuantity),
      unitPrice: toNumber(row.unitPrice),
      targetAmount: toNumber(row.targetAmount),
    })),
  });
  submitMessage.value = key === 'draft' ? '草稿已通过新增接口保存。' : '销售计划已通过新增接口提交审批。';
  submitting.value = false;
}
function confirmRemove(label = '该记录') {
  return window.confirm(`确认删除${label}吗？删除后当前表格会立即移除。`);
}
function confirmClear(label = '当前内容') {
  return window.confirm(`确认清空${label}吗？清空后当前未提交内容会被移除。`);
}
</script>

<style scoped>
.aw-form-summary {
  display: flex;
  gap: 24px;
  margin-top: 10px;
  color: var(--aw-fg-2);
  font-size: 13px;
}

.aw-form-summary strong {
  color: var(--aw-danger);
}

.aw-help-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  border-radius: 50%;
  background: var(--aw-fill-2);
  color: var(--aw-fg-3);
  font-size: 12px;
  font-weight: 600;
  cursor: help;
}

.product-picker-body {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  gap: 12px;
  min-height: 260px;
}

.product-picker-categories {
  border-right: 1px solid var(--aw-border);
  padding-right: 12px;
}

.product-picker-category {
  width: 100%;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--aw-fg-2);
  text-align: left;
  padding: 0 12px;
  cursor: pointer;
}

.product-picker-category.on {
  background: var(--aw-primary-weak);
  color: var(--aw-primary);
  font-weight: 600;
}

.product-picker-list {
  min-width: 0;
  overflow-x: auto;
}

.product-picker-count {
  margin-bottom: 8px;
  color: var(--aw-fg-2);
  font-size: 13px;
}
</style>
