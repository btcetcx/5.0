<template>
  <div class="prd-center">
    <aside class="prd-tree-panel">
      <div class="prd-tree-head">
        <strong>PRD 分类树</strong>
        <span>{{ financePrdDocuments.length }} 份文档</span>
      </div>
      <div class="prd-tree-source">一级：财务中心；二级：模块；三级：页面；四级：PRD 章节。</div>
      <div class="prd-tree-list">
        <button
          v-for="node in flatTree"
          :key="node.id"
          :class="['prd-tree-node', `level-${node.level}`, { active: isNodeActive(node) }]"
          type="button"
          @click="selectNode(node)"
        >
          <span>{{ node.label }}</span>
          <em v-if="node.level < 4">L{{ node.level }}</em>
        </button>
      </div>
    </aside>

    <main v-if="selectedDocument" ref="documentRef" class="prd-document">
      <header class="prd-doc-head">
        <div>
          <span class="prd-doc-module">{{ selectedDocument.module }}</span>
          <h2>{{ selectedDocument.title }}</h2>
          <p>{{ selectedDocument.objective }}</p>
        </div>
        <dl>
          <div>
            <dt>页面类型</dt>
            <dd>{{ selectedDocument.pageType }}</dd>
          </div>
          <div>
            <dt>页面路径</dt>
            <dd>{{ selectedDocument.route }}</dd>
          </div>
          <div>
            <dt>版本日期</dt>
            <dd>2026-05-31</dd>
          </div>
        </dl>
      </header>

      <section :class="sectionClass('sources')" class="prd-section" data-prd-section="sources">
        <h3>列表内容与数据来源</h3>
        <p>页面内容必须来自以下业务对象或财务对象，前端只展示和发起动作，不反向创造业务事实。</p>
        <ul>
          <li v-for="item in selectedDocument.dataSources" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section :class="sectionClass('fields')" class="prd-section" data-prd-section="fields">
        <h3>字段说明</h3>
        <div class="prd-table-wrap">
          <table>
            <thead>
              <tr>
                <th>字段</th>
                <th>来源</th>
                <th>解释</th>
                <th>规则</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="field in selectedDocument.fields" :key="`${selectedDocument.id}-${field.name}`">
                <td>{{ field.name }}</td>
                <td>{{ field.source }}</td>
                <td>{{ field.description }}</td>
                <td>{{ field.rules }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section :class="sectionClass('states')" class="prd-section" data-prd-section="states">
        <h3>状态机链路</h3>
        <p>状态机必须完整覆盖当前状态解释、触发条件和下一步可流转状态，不允许页面手工跳过关键节点。</p>
        <div class="prd-table-wrap">
          <table>
            <thead>
              <tr>
                <th>状态</th>
                <th>当前状态解释</th>
                <th>触发条件</th>
                <th>可流转到</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="state in selectedDocument.states" :key="`${selectedDocument.id}-${state.name}`">
                <td>{{ state.name }}</td>
                <td>{{ state.meaning }}</td>
                <td>{{ state.trigger }}</td>
                <td>{{ state.next }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section :class="sectionClass('flows')" class="prd-section" data-prd-section="flows">
        <h3>业务流程</h3>
        <div class="prd-flow-list">
          <article v-for="flow in selectedDocument.flows" :key="`${selectedDocument.id}-${flow.step}`">
            <strong>{{ flow.step }}</strong>
            <div>
              <span>{{ flow.role }}</span>
              <p>{{ flow.action }}</p>
              <em>{{ flow.output }}</em>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { financePrdDocuments, financePrdTree, prdSections, type PrdTreeNode } from './financePrd';

const route = useRoute();
const router = useRouter();
const defaultDocId = financePrdDocuments[0]?.id || '';
const defaultSectionId = 'sources';
const validSectionIds = new Set(prdSections.map((section) => section.id));
const documentRef = ref<HTMLElement | null>(null);
const selectedDocId = computed(() => String(route.query.doc || defaultDocId));
const activeSectionId = computed(() => {
  const sectionId = String(route.query.section || defaultSectionId);
  return validSectionIds.has(sectionId) ? sectionId : defaultSectionId;
});
const selectedDocument = computed(() => financePrdDocuments.find((doc) => doc.id === selectedDocId.value) || financePrdDocuments[0]);
const flatTree = computed(() => flattenTree(financePrdTree));

function flattenTree(nodes: PrdTreeNode[]): PrdTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children || [])]);
}

function firstDoc(node: PrdTreeNode): string {
  if (node.docId) return node.docId;
  for (const child of node.children || []) {
    const docId = firstDoc(child);
    if (docId) return docId;
  }
  return defaultDocId;
}

function selectNode(node: PrdTreeNode) {
  const sectionId = node.sectionId || defaultSectionId;
  router.replace({
    path: '/prd',
    query: {
      doc: firstDoc(node),
      section: sectionId,
    },
  }).then(() => scrollToSection(sectionId));
}

function isNodeActive(node: PrdTreeNode) {
  if (node.level === 4) return node.docId === selectedDocId.value && node.sectionId === activeSectionId.value;
  if (node.docId) return node.docId === selectedDocId.value;
  return hasActiveChild(node);
}

function sectionClass(sectionId: string) {
  return { active: activeSectionId.value === sectionId };
}

function hasActiveChild(node: PrdTreeNode): boolean {
  return Boolean(node.children?.some((child) => child.docId === selectedDocId.value || hasActiveChild(child)));
}

async function scrollToSection(sectionId: string) {
  await nextTick();
  const container = documentRef.value;
  if (!container) return;
  const section = container.querySelector<HTMLElement>(`[data-prd-section="${sectionId}"]`);
  if (!section) {
    container.scrollTop = 0;
    return;
  }
  container.scrollTo({
    top: Math.max(section.offsetTop - container.offsetTop - 8, 0),
    behavior: 'smooth',
  });
}

watch([selectedDocId, activeSectionId], ([, sectionId]) => {
  scrollToSection(sectionId || defaultSectionId);
});

onMounted(() => {
  scrollToSection(activeSectionId.value || defaultSectionId);
});
</script>

<style scoped>
.prd-center {
  display: grid;
  gap: 16px;
  grid-template-columns: 320px minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.prd-tree-panel,
.prd-document {
  background: var(--aw-bg);
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  min-height: 0;
}

.prd-tree-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.prd-tree-head {
  align-items: center;
  border-bottom: 1px solid var(--aw-divider);
  display: flex;
  justify-content: space-between;
  padding: 14px 14px 10px;
}

.prd-tree-head strong {
  color: var(--aw-fg);
  font-size: 15px;
}

.prd-tree-head span,
.prd-tree-source {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.prd-tree-source {
  line-height: 1.5;
  padding: 10px 14px 4px;
}

.prd-tree-list {
  display: grid;
  flex: 1;
  gap: 2px;
  min-height: 0;
  overflow: auto;
  padding: 8px 10px 14px;
}

.prd-tree-node {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--aw-fg-1);
  cursor: pointer;
  display: flex;
  gap: 8px;
  height: 30px;
  justify-content: space-between;
  min-width: 0;
  padding: 0 8px;
  text-align: left;
}

.prd-tree-node span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prd-tree-node em {
  color: var(--aw-fg-3);
  font-size: 11px;
  font-style: normal;
}

.prd-tree-node:hover,
.prd-tree-node.active {
  background: rgba(86, 119, 252, 0.1);
  color: var(--aw-primary);
}

.prd-tree-node.level-1 {
  font-weight: 700;
}

.prd-tree-node.level-2 {
  font-weight: 600;
  padding-left: 22px;
}

.prd-tree-node.level-3 {
  padding-left: 38px;
}

.prd-tree-node.level-4 {
  color: var(--aw-fg-2);
  font-size: 12px;
  height: 26px;
  padding-left: 58px;
}

.prd-document {
  min-width: 0;
  overflow: auto;
  padding: 18px;
}

.prd-doc-head {
  align-items: flex-start;
  border-bottom: 1px solid var(--aw-divider);
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr) 360px;
  padding-bottom: 16px;
}

.prd-doc-module {
  color: var(--aw-primary);
  font-size: 13px;
  font-weight: 600;
}

.prd-doc-head h2 {
  color: var(--aw-fg);
  font-size: 24px;
  line-height: 1.25;
  margin: 6px 0 8px;
}

.prd-doc-head p {
  color: var(--aw-fg-2);
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

.prd-doc-head dl {
  background: var(--aw-surface-2);
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 12px;
}

.prd-doc-head dl div {
  display: grid;
  gap: 4px;
  grid-template-columns: 80px minmax(0, 1fr);
}

.prd-doc-head dt {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.prd-doc-head dd {
  color: var(--aw-fg-1);
  font-size: 12px;
  margin: 0;
  overflow-wrap: anywhere;
}

.prd-section {
  border-bottom: 1px solid var(--aw-divider);
  padding: 18px 0;
  scroll-margin-top: 12px;
}

.prd-section.active {
  background: linear-gradient(90deg, rgba(86, 119, 252, 0.08), transparent 42%);
  margin-left: -18px;
  margin-right: -18px;
  padding-left: 18px;
  padding-right: 18px;
}

.prd-section h3 {
  color: var(--aw-fg);
  font-size: 17px;
  margin: 0 0 12px;
}

.prd-section p,
.prd-section li {
  color: var(--aw-fg-2);
  font-size: 13px;
  line-height: 1.7;
}

.prd-section ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
}

.prd-table-wrap {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  overflow: auto;
}

.prd-table-wrap table {
  border-collapse: collapse;
  min-width: 880px;
  width: 100%;
}

.prd-table-wrap th,
.prd-table-wrap td {
  border-bottom: 1px solid var(--aw-divider);
  color: var(--aw-fg-1);
  font-size: 12px;
  line-height: 1.6;
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}

.prd-table-wrap th {
  background: var(--aw-surface-2);
  color: var(--aw-fg-2);
  font-weight: 600;
  white-space: nowrap;
}

.prd-flow-list {
  display: grid;
  gap: 10px;
}

.prd-flow-list article {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  grid-template-columns: 34px minmax(0, 1fr);
  padding: 12px;
}

.prd-flow-list strong {
  align-items: center;
  background: rgba(86, 119, 252, 0.12);
  border-radius: 999px;
  color: var(--aw-primary);
  display: flex;
  font-size: 13px;
  height: 28px;
  justify-content: center;
  width: 28px;
}

.prd-flow-list span {
  color: var(--aw-fg);
  font-size: 13px;
  font-weight: 600;
}

.prd-flow-list p {
  margin: 4px 0;
}

.prd-flow-list em {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
}

@media (max-width: 1100px) {
  .prd-center {
    grid-template-columns: 1fr;
  }

  .prd-tree-panel {
    max-height: 360px;
  }

  .prd-doc-head {
    grid-template-columns: 1fr;
  }
}
</style>
