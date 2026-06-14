<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getAccountInfo, listRecharges, listExpenses, doRecharge, toneByStatus } from "@/app/api/bid/resources";
import AwDataTable from "@/components/list-page/AwDataTable.vue";
import type { AwTableColumn } from "@/components/list-page/types";

const account = ref<Record<string, unknown>>({});
const rechargeRows = ref<Record<string, unknown>[]>([]);
const expenseRows = ref<Record<string, unknown>[]>([]);
const showRechargeModal = ref(false);
const rechargeForm = ref({ amount: 0, method: "微信支付", remark: "" });
const toastText = ref("");
const activeTab = ref("recharges");

const balanceDisplay = computed(() => Number(account.value.balance || 0).toLocaleString("zh-CN"));
const frozenDisplay = computed(() => Number(account.value.frozen || 0).toLocaleString("zh-CN"));
const availableDisplay = computed(() => Number(account.value.available || 0).toLocaleString("zh-CN"));
const totalRecharge2 = computed(() => Number(account.value.totalRecharge || 0).toLocaleString("zh-CN"));
const totalExpense2 = computed(() => Number(account.value.totalExpense || 0).toLocaleString("zh-CN"));

const rechargeColumns: AwTableColumn[] = [
  { key: "orderNo", title: "订单号", width: 160 },
  { key: "amount", title: "金额(元)", width: 110 },
  { key: "method", title: "支付方式", width: 100 },
  { key: "status", title: "状态", width: 80 },
  { key: "createTime", title: "充值时间", width: 160 },
  { key: "arriveTime", title: "到账时间", width: 160 },
  { key: "remark", title: "备注", width: 180 },
];

const expenseColumns: AwTableColumn[] = [
  { key: "orderNo", title: "流水号", width: 160 },
  { key: "item", title: "项目", width: 140 },
  { key: "amount", title: "金额(元)", width: 100 },
  { key: "type", title: "类型", width: 80 },
  { key: "projectName", title: "关联项目", width: 200 },
  { key: "status", title: "状态", width: 80 },
  { key: "createTime", title: "时间", width: 160 },
];

const rechargeMethods = ["微信支付", "支付宝", "银行转账"];

function loadData() {
  getAccountInfo().then((data) => { account.value = data as Record<string, unknown>; });
  listRecharges().then((data) => { rechargeRows.value = data.rows; });
  listExpenses().then((data) => { expenseRows.value = data.rows; });
}

function openRecharge() {
  rechargeForm.value = { amount: 0, method: "微信支付", remark: "" };
  showRechargeModal.value = true;
}

function submitRecharge() {
  if (rechargeForm.value.amount <= 0) return;
  doRecharge(rechargeForm.value).then(() => {
    showRechargeModal.value = false;
    toastText.value = "充值成功";
    setTimeout(() => { toastText.value = ""; }, 2000);
    loadData();
  });
}

onMounted(loadData);
</script>

<template>
  <div class="account-page">
    <div class="account-page-head">
      <div>
        <h1>账户余额</h1>
        <p>管理投标平台账户余额、充值记录和消费明细。</p>
      </div>
      <button class="aw-btn primary" type="button" @click="openRecharge">立即充值</button>
    </div>

    <section class="account-cards">
      <div class="account-card account-card-main">
        <span>账户余额</span>
        <strong>&yen; {{ balanceDisplay }}</strong>
        <small>{{ account.status }}</small>
      </div>
      <div class="account-card">
        <span>可用余额</span>
        <strong>&yen; {{ availableDisplay }}</strong>
      </div>
      <div class="account-card">
        <span>冻结金额</span>
        <strong>&yen; {{ frozenDisplay }}</strong>
      </div>
      <div class="account-card">
        <span>累计充值</span>
        <strong>&yen; {{ totalRecharge2 }}</strong>
      </div>
      <div class="account-card">
        <span>累计消费</span>
        <strong>&yen; {{ totalExpense2 }}</strong>
      </div>
      <div class="account-card">
        <span>最后充值</span>
        <strong style="font-size:14px">{{ account.lastRecharge || '-' }}</strong>
      </div>
    </section>

    <section class="aw-form-card">
      <div class="account-tabs">
        <button :class="['account-tab', activeTab === 'recharges' ? 'active' : '']" type="button" @click="activeTab = 'recharges'">充值记录</button>
        <button :class="['account-tab', activeTab === 'expenses' ? 'active' : '']" type="button" @click="activeTab = 'expenses'">消费明细</button>
      </div>
      <aw-data-table v-if="activeTab === 'recharges'" :columns="rechargeColumns" :rows="rechargeRows" :total="rechargeRows.length">
        <template #cell="{ column, value }">
          <span v-if="column.key === 'amount'" :class="Number(value) > 0 ? 'aw-fg-green' : ''">&yen; {{ Number(value).toLocaleString('zh-CN') }}</span>
          <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
          <span v-else>{{ value ?? '-' }}</span>
        </template>
      </aw-data-table>
      <aw-data-table v-else :columns="expenseColumns" :rows="expenseRows" :total="expenseRows.length">
        <template #cell="{ column, value }">
          <span v-if="column.key === 'amount'" :class="Number(value) < 0 ? 'aw-fg-red' : ''">&yen; {{ Number(value).toLocaleString('zh-CN') }}</span>
          <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
          <span v-else>{{ value ?? '-' }}</span>
        </template>
      </aw-data-table>
    </section>

    <!-- 充值弹窗 -->
    <div v-if="showRechargeModal" class="aw-modal-mask" @click.self="showRechargeModal = false">
      <section class="aw-modal aw-modal-sm">
        <div class="aw-modal-head"><h2>账户充值</h2><button class="aw-modal-close" type="button" @click="showRechargeModal = false">&times;</button></div>
        <div class="aw-modal-body">
          <div class="account-form-grid">
            <label><span>充值金额(元)</span><input v-model.number="rechargeForm.amount" type="number" min="1" placeholder="请输入充值金额" style="background:#fff;border:1px solid var(--aw-border);border-radius:6px;min-height:34px;padding:0 10px;width:100%;box-sizing:border-box" /></label>
            <label><span>支付方式</span><select v-model="rechargeForm.method" style="background:#fff;border:1px solid var(--aw-border);border-radius:6px;min-height:34px;padding:0 10px;width:100%;box-sizing:border-box"><option v-for="m in rechargeMethods" :key="m" :value="m">{{ m }}</option></select></label>
            <label><span>备注</span><input v-model="rechargeForm.remark" type="text" placeholder="可选" style="background:#fff;border:1px solid var(--aw-border);border-radius:6px;min-height:34px;padding:0 10px;width:100%;box-sizing:border-box" /></label>
          </div>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-btn" type="button" @click="showRechargeModal = false">取消</button>
          <button class="aw-btn primary" type="button" @click="submitRecharge">确认充值</button>
        </div>
      </section>
    </div>

    <div v-if="toastText" class="aw-toast">{{ toastText }}</div>
  </div>
</template>

<style scoped>
.account-page { display: grid; gap: 20px; padding: 20px; }
.account-page-head { align-items: center; display: flex; justify-content: space-between; }
.account-page-head h1 { margin: 0; }
.account-page-head p { color: var(--aw-fg-3); margin: 6px 0 0; }
.account-cards { display: grid; gap: 12px; grid-template-columns: repeat(6, minmax(0, 1fr)); }
.account-card { background: #fff; border: 1px solid var(--aw-border); border-radius: 8px; cursor: pointer; display: grid; gap: 4px; padding: 16px; text-align: left; }
.account-card span { color: var(--aw-fg-3); font-size: 13px; }
.account-card strong { font-size: 20px; }
.account-card small { color: var(--aw-fg-3); font-size: 12px; }
.account-card-main { background: linear-gradient(135deg, #1677ff, #36cfc9); border-color: transparent; }
.account-card-main span { color: rgba(255,255,255,0.8); }
.account-card-main strong { color: #fff; font-size: 28px; }
.account-card-main small { color: rgba(255,255,255,0.7); }
.account-tabs { display: flex; gap: 0; padding: 16px 16px 0; }
.account-tab { background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 14px; padding: 8px 20px; }
.account-tab.active { border-bottom-color: var(--aw-primary, #1677ff); color: var(--aw-primary, #1677ff); font-weight: 600; }
.account-form-grid { display: grid; gap: 14px; }
.account-form-grid label { display: grid; gap: 6px; }
.account-form-grid label span { color: var(--aw-fg-2); font-size: 13px; }
.aw-fg-green { color: #52c41a; font-weight: 500; }
.aw-fg-red { color: #ff4d4f; font-weight: 500; }
@media (max-width: 1200px) { .account-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 768px) { .account-cards { grid-template-columns: 1fr 1fr; } }
</style>
