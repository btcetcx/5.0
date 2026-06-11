<template>
  <section class="aw-page">
    <div class="sales-kpis">
      <article v-for="item in kpis" :key="item.label" class="aw-card sales-kpi">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <em>{{ item.sub }}</em>
      </article>
    </div>

    <div class="sales-dashboard-grid">
      <section class="aw-card sales-panel">
        <header>
          <strong>销售中心模块</strong>
          <span>当前先完成销售中心转化</span>
        </header>
        <div class="sales-module-list">
          <router-link v-for="item in modules" :key="item.path" :to="item.path">
            <strong>{{ item.name }}</strong>
            <span>{{ item.desc }}</span>
          </router-link>
        </div>
      </section>

      <section class="aw-card sales-panel">
        <header>
          <strong>框架能力</strong>
          <span>参考后台模板重建</span>
        </header>
        <ul class="sales-capability-list">
          <li>应用壳：顶部栏、侧边菜单、标签页</li>
          <li>路由：销售中心模块化路由</li>
          <li>状态：Pinia 管理菜单折叠、API 模式、访问标签</li>
          <li>请求：Axios 统一响应壳与异常处理</li>
          <li>数据：mock / remote 可切换</li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
const kpis = [
  { label: '本月报价额', value: '¥196,000', sub: '2 单报价' },
  { label: '合同金额', value: '¥196,000', sub: '履约中 1 单' },
  { label: '订单金额', value: '¥67,200', sub: '执行中 1 单' },
  { label: '客户数', value: '3', sub: '重点客户 1 家' },
];

const modules = [
  { name: '客户管理', path: '/sales/customers', desc: '客户档案、信用额度、联系人与负责人' },
  { name: '销售计划', path: '/sales/sales-plans', desc: '计划周期、目标金额、达成进度' },
  { name: '报价管理', path: '/sales/sales-quotes', desc: '报价主题、价格版本、转化状态' },
  { name: '合同管理', path: '/sales/sales-contracts', desc: '合同金额、履约与回款跟踪' },
  { name: '订单管理', path: '/sales/sales-orders', desc: '信用校验、交付日期、执行进度' },
];
</script>

<style scoped>
.sales-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.sales-kpi {
  padding: 16px;
}

.sales-kpi span,
.sales-kpi em {
  display: block;
  color: var(--aw-muted);
  font-style: normal;
  font-size: 13px;
}

.sales-kpi strong {
  display: block;
  margin: 10px 0 6px;
  font-size: 24px;
}

.sales-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
  gap: 14px;
}

.sales-panel {
  padding: 16px;
}

.sales-panel header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.sales-panel header span {
  color: var(--aw-muted);
  font-size: 13px;
}

.sales-module-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sales-module-list a {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
}

.sales-module-list a:hover {
  border-color: var(--aw-primary);
  background: var(--aw-primary-soft);
}

.sales-module-list span,
.sales-capability-list {
  color: var(--aw-muted);
  font-size: 13px;
  line-height: 1.8;
}
</style>
