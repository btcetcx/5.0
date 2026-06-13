<template>
  <div class="prd-center">
    <aside class="prd-tree-panel">
      <div class="prd-tree-head">
        <strong>PRD 分类树</strong>
        <span>{{ prdDocuments.length }} 份文档</span>
      </div>
      <div class="prd-tree-source">一级：全局流程或业务中心；二级：导航分组或页面；三级：页面；四级：页面 PRD 章节。点击箭头可折叠子项。</div>
      <div ref="treeListRef" class="prd-tree-list">
        <div
          v-for="node in visibleTree"
          :key="node.id"
          :class="['prd-tree-row', `level-${node.level}`]"
        >
          <button
            v-if="isNodeCollapsible(node)"
            :aria-expanded="isNodeExpanded(node)"
            :aria-label="`${isNodeExpanded(node) ? '收起' : '展开'}${node.label}`"
            :class="['prd-tree-toggle', { open: isNodeExpanded(node) }]"
            type="button"
            @click.stop="toggleNode(node)"
          >
            <span>›</span>
          </button>
          <span v-else class="prd-tree-toggle placeholder" />
          <button
            :class="['prd-tree-node', `level-${node.level}`, { active: isNodeActive(node) }]"
            type="button"
            @click="selectNode(node)"
          >
            <span>{{ node.label }}</span>
            <em v-if="node.level < 4">L{{ node.level }}</em>
          </button>
        </div>
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
            <dd>2026-06-06</dd>
          </div>
        </dl>
      </header>

      <section v-if="hasSection('details')" :class="sectionClass('details')" class="prd-section" data-prd-section="details">
        <h3>详情</h3>
        <p>{{ selectedDocument.objective }}</p>
        <div class="prd-detail-grid">
          <article>
            <h4>页面范围</h4>
            <ul>
              <li v-for="item in selectedDocument.scope" :key="`scope-${item}`">{{ item }}</li>
            </ul>
          </article>
          <article>
            <h4>数据来源</h4>
            <ul>
              <li v-for="item in selectedDocument.dataSources" :key="`source-${item}`">{{ item }}</li>
            </ul>
          </article>
          <article>
            <h4>页面约束</h4>
            <ul>
              <li v-for="item in selectedDocument.interactions" :key="`interaction-${item}`">交互：{{ item }}</li>
              <li v-for="item in selectedDocument.validations" :key="`validation-${item}`">校验：{{ item }}</li>
              <li v-for="item in selectedDocument.writeBacks" :key="`writeback-${item}`">回写：{{ item }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section v-if="hasSection('fields')" :class="sectionClass('fields')" class="prd-section" data-prd-section="fields">
        <h3>字段解释</h3>
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

      <section v-if="hasSection('states')" :class="sectionClass('states')" class="prd-section" data-prd-section="states">
        <h3>状态机</h3>
        <p>状态机说明当前状态解释、触发条件和下一步可流转状态，关键节点保持可追溯。</p>
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

      <section v-if="hasSection('flows')" :class="sectionClass('flows')" class="prd-section" data-prd-section="flows">
        <div class="prd-flow-heading">
          <h3>{{ selectedDocument.flowDiagram ? '业务流程图' : '业务流程' }}</h3>
          <div v-if="selectedDocument.flowDiagram" class="prd-flow-tools" aria-label="流程图缩放控制">
            <button
              type="button"
              title="缩小"
              :disabled="flowZoom <= flowZoomMin"
              @keydown.enter.prevent="changeFlowZoom(-flowZoomStep)"
              @keydown.space.prevent="changeFlowZoom(-flowZoomStep)"
              @pointerdown.prevent="changeFlowZoom(-flowZoomStep)"
            >
              <ZoomOutOutlined />
            </button>
            <span class="prd-flow-zoom-value">{{ flowZoomPercent }}%</span>
            <button
              type="button"
              title="放大"
              :disabled="flowZoom >= flowZoomMax"
              @keydown.enter.prevent="changeFlowZoom(flowZoomStep)"
              @keydown.space.prevent="changeFlowZoom(flowZoomStep)"
              @pointerdown.prevent="changeFlowZoom(flowZoomStep)"
            >
              <ZoomInOutlined />
            </button>
            <button
              class="fit"
              type="button"
              title="全局预览"
              @keydown.enter.prevent="fitFlowPreview"
              @keydown.space.prevent="fitFlowPreview"
              @pointerdown.prevent="fitFlowPreview"
            >
              <FullscreenOutlined />
              <span>全局预览</span>
            </button>
            <button
              type="button"
              title="原始大小"
              @keydown.enter.prevent="resetFlowZoom"
              @keydown.space.prevent="resetFlowZoom"
              @pointerdown.prevent="resetFlowZoom"
            >
              <OneToOneOutlined />
            </button>
          </div>
        </div>
        <div v-if="selectedDocument.flowDiagram" class="prd-global-flow">
          <div class="prd-flow-switcher" aria-label="中心流程图切换">
            <button
              :class="{ active: activeFlowCenterId === 'all' }"
              type="button"
              @keydown.enter.prevent="setActiveFlowCenter('all')"
              @keydown.space.prevent="setActiveFlowCenter('all')"
              @pointerdown.prevent="setActiveFlowCenter('all')"
            >
              全部中心
            </button>
            <button
              v-for="layout in flowCenterLayouts"
              :key="`switch-${layout.id}`"
              :class="{ active: activeFlowCenterId === layout.id }"
              type="button"
              @keydown.enter.prevent="setActiveFlowCenter(layout.id)"
              @keydown.space.prevent="setActiveFlowCenter(layout.id)"
              @pointerdown.prevent="setActiveFlowCenter(layout.id)"
            >
              {{ layout.title }}
            </button>
          </div>

          <div ref="flowStackRef" class="prd-flow-diagram-stack">
            <article v-for="layout in visibleFlowLayouts" :key="layout.id" class="prd-flow-center-diagram">
              <header class="prd-flow-center-head">
                <div>
                  <strong>{{ layout.title }}</strong>
                  <p>{{ layout.description }}</p>
                </div>
                <span>{{ layout.nodes.length }} 节点 / {{ layout.edges.length }} 线</span>
              </header>

              <div class="prd-flow-blueprint" :aria-label="`${layout.title}业务流程图`">
                <svg
                  class="prd-flow-svg"
                  :style="getFlowSvgStyle(layout)"
                  :viewBox="`0 0 ${layout.width} ${layout.height}`"
                  role="img"
                  :aria-label="`${layout.title}业务流程泳道图`"
                >
                  <defs>
                    <marker
                      v-for="marker in layout.markers"
                      :id="flowMarkerId(layout, marker.id)"
                      :key="marker.id"
                      markerHeight="9"
                      markerWidth="9"
                      orient="auto"
                      refX="8"
                      refY="4.5"
                    >
                      <path d="M0,0 L9,4.5 L0,9 Z" :fill="marker.color" />
                    </marker>
                    <marker :id="flowMarkerId(layout, 'legend-main')" markerHeight="9" markerWidth="9" orient="auto" refX="8" refY="4.5">
                      <path d="M0,0 L9,4.5 L0,9 Z" fill="#2563eb" />
                    </marker>
                    <marker :id="flowMarkerId(layout, 'legend-support')" markerHeight="9" markerWidth="9" orient="auto" refX="8" refY="4.5">
                      <path d="M0,0 L9,4.5 L0,9 Z" fill="#0f766e" />
                    </marker>
                    <marker :id="flowMarkerId(layout, 'legend-loop')" markerHeight="9" markerWidth="9" orient="auto" refX="8" refY="4.5">
                      <path d="M0,0 L9,4.5 L0,9 Z" fill="#d97706" />
                    </marker>
                  </defs>

                  <rect class="prd-flow-canvas" x="0" y="0" :width="layout.width" :height="layout.height" rx="10" />

                  <g v-for="lane in layout.lanes" :key="`${layout.id}-${lane.title}`" class="prd-flow-svg-lane">
                    <rect class="lane-bg" x="10" :y="lane.y" :width="layout.width - 20" :height="lane.height" rx="8" />
                    <foreignObject x="20" :y="lane.y + 14" width="124" :height="lane.height - 28">
                      <div xmlns="http://www.w3.org/1999/xhtml" class="prd-svg-lane-label">
                        <span>{{ String(lane.index + 1).padStart(2, '0') }}</span>
                        <strong>{{ lane.title }}</strong>
                        <p>{{ lane.description }}</p>
                      </div>
                    </foreignObject>
                  </g>

                  <g class="prd-flow-svg-edges">
                    <g v-for="edge in layout.edges" :key="edge.id" class="prd-flow-svg-edge">
                      <path
                        :class="['prd-flow-path', edge.tone]"
                        :d="edge.path"
                        :marker-end="flowMarkerUrl(layout, edge.markerId)"
                        :style="{ stroke: edge.color }"
                      />
                      <g :class="['prd-flow-svg-label', edge.tone]">
                        <rect
                          :x="edge.labelX - edge.labelWidth / 2"
                          :y="edge.labelY - 12"
                          :width="edge.labelWidth"
                          height="24"
                          rx="5"
                          :style="{ fill: edge.labelFill, stroke: edge.color }"
                        />
                        <text :x="edge.labelX" :y="edge.labelY + 4" :style="{ fill: edge.color }">{{ edge.label }}</text>
                      </g>
                    </g>
                  </g>

                  <g class="prd-flow-svg-nodes">
                    <g
                      v-for="node in layout.nodes"
                      :key="node.id"
                      class="prd-flow-node"
                      :transform="`translate(${node.x} ${node.y})`"
                    >
                      <title>{{ node.detailText }}</title>
                      <rect class="prd-flow-node-box" x="0" y="0" :width="node.width" :height="node.height" rx="7" />
                      <text
                        class="prd-flow-node-title"
                        :x="node.width / 2"
                        :y="node.height / 2 - (node.titleLines.length - 1) * 8 + 5"
                      >
                        <tspan
                          v-for="(line, lineIndex) in node.titleLines"
                          :key="`${node.id}-${lineIndex}`"
                          :x="node.width / 2"
                          :dy="lineIndex === 0 ? 0 : 18"
                        >
                          {{ line }}
                        </tspan>
                      </text>
                      <g v-if="node.badge" class="prd-flow-node-badge" :transform="`translate(${node.width - 56} 7)`">
                        <rect x="0" y="0" width="48" height="20" rx="4" />
                        <text x="24" y="14">{{ node.badge }}</text>
                      </g>
                    </g>
                  </g>

                  <g class="prd-flow-legend" :transform="`translate(${layout.width - 540} 20)`">
                    <rect x="0" y="0" width="500" height="38" rx="8" />
                    <path class="prd-flow-path main" :marker-end="flowMarkerUrl(layout, 'legend-main')" d="M18 19H70" />
                    <text x="82" y="23">主流程</text>
                    <path class="prd-flow-path support" :marker-end="flowMarkerUrl(layout, 'legend-support')" d="M150 19H202" />
                    <text x="214" y="23">支撑线/来源色</text>
                    <path class="prd-flow-path loop" :marker-end="flowMarkerUrl(layout, 'legend-loop')" d="M348 19H400" />
                    <text x="412" y="23">闭环线/来源色</text>
                  </g>
                </svg>
              </div>
            </article>
          </div>
        </div>
        <div v-else class="prd-flow-list">
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

      <section v-if="hasSection('acceptance')" :class="sectionClass('acceptance')" class="prd-section" data-prd-section="acceptance">
        <h3>验收标准</h3>
        <ol class="prd-acceptance-list">
          <li v-for="item in selectedDocument.acceptance" :key="item">{{ item }}</li>
        </ol>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { FullscreenOutlined, OneToOneOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons-vue';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getDefaultPrdDoc, getDefaultPrdSection, getPrdCenterByDocId, getPrdCenterPath, getPrdSectionsForDocument, prdDocuments, prdTree, type PrdTreeNode } from './prdData';
import type { PrdFlowDiagram, PrdFlowDiagramNode } from './financePrd';

const route = useRoute();
const router = useRouter();
const documentRef = ref<HTMLElement | null>(null);
const flowStackRef = ref<HTMLElement | null>(null);
const treeListRef = ref<HTMLElement | null>(null);
const routeCenter = computed(() => String(route.params.center || route.query.center || 'rd'));
const defaultDocId = computed(() => getDefaultPrdDoc(routeCenter.value));
const selectedDocId = computed(() => {
  const queryDocId = String(route.query.doc || '');
  const queryDocument = prdDocuments.find((doc) => doc.id === queryDocId);
  if (queryDocument && getPrdCenterByDocId(queryDocId) === routeCenter.value) return queryDocId;
  return defaultDocId.value;
});
const selectedDocument = computed(() => prdDocuments.find((doc) => doc.id === selectedDocId.value) || prdDocuments.find((doc) => doc.id === defaultDocId.value) || prdDocuments[0]);
const flowCenterLayouts = computed(() => buildCenterFlowLayouts(selectedDocument.value?.flowDiagram));
const activeFlowCenterId = ref('all');
const visibleFlowLayouts = computed(() => {
  if (activeFlowCenterId.value === 'all') return flowCenterLayouts.value;
  return flowCenterLayouts.value.filter((layout) => layout.id === activeFlowCenterId.value);
});
const flowZoomMin = 0.18;
const flowZoomMax = 1.5;
const flowZoomStep = 0.1;
const flowZoom = ref(1);
const flowZoomPercent = computed(() => Math.round(flowZoom.value * 100));
const availableSections = computed(() => getPrdSectionsForDocument(selectedDocument.value));
const availableSectionIds = computed<Set<string>>(() => new Set(availableSections.value.map((section) => section.id)));
const defaultSectionId = computed(() => availableSections.value[0]?.id || 'fields');
const activeSectionId = computed(() => {
  const sectionId = String(route.query.section || defaultSectionId.value);
  return availableSectionIds.value.has(sectionId) ? sectionId : defaultSectionId.value;
});
const expandedTreeNodeIds = ref<Set<string>>(new Set());
const visibleTree = computed(() => flattenVisibleTree(prdTree));

watch(selectedDocId, () => {
  activeFlowCenterId.value = 'all';
  flowZoom.value = 1;
});

type FlowTone = 'main' | 'support' | 'loop';

interface FlowChartLane {
  description?: string;
  height: number;
  index: number;
  title: string;
  y: number;
}

interface FlowChartNode extends PrdFlowDiagramNode {
  detailText: string;
  height: number;
  laneIndex: number;
  titleLines: string[];
  width: number;
  x: number;
  y: number;
}

interface FlowChartEdgeSpec {
  fromId: string;
  label: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
  offset?: number;
  toId: string;
  tone: FlowTone;
}

interface FlowChartEdge extends FlowChartEdgeSpec {
  color: string;
  id: string;
  labelFill: string;
  labelWidth: number;
  labelX: number;
  labelY: number;
  markerId: string;
  path: string;
}

interface FlowChartMarker {
  color: string;
  id: string;
}

interface FlowChartLayout {
  description?: string;
  edges: FlowChartEdge[];
  height: number;
  id: string;
  lanes: FlowChartLane[];
  markers: FlowChartMarker[];
  nodes: FlowChartNode[];
  title: string;
  width: number;
}

const flowNodeWidth = 220;
const flowNodeHeight = 58;
const flowLaneHeight = 168;
const flowLaneTop = 58;
const flowLaneGap = 14;
const flowLanePaddingY = 56;
const flowChartWidth = 2240;
const flowCenterChartMinWidth = 1180;
const flowCenterNodeGap = 70;
const flowCenterNodeLeft = 170;
const flowEdgeMainColor = '#2563eb';
const flowEdgeToneColor: Record<FlowTone, { color: string; fill: string; sourceColor?: boolean }> = {
  main: { color: flowEdgeMainColor, fill: '#eff6ff' },
  support: { color: '#0f766e', fill: '#f0fdfa', sourceColor: true },
  loop: { color: '#d97706', fill: '#fff7ed', sourceColor: true },
};
const flowEdgeSourcePalette: Record<string, { color: string; fill: string }> = {
  settings: { color: '#7c3aed', fill: '#f5f3ff' },
  hr: { color: '#0891b2', fill: '#ecfeff' },
  rd: { color: '#2563eb', fill: '#eff6ff' },
  sales: { color: '#e11d48', fill: '#fff1f2' },
  purchase: { color: '#ea580c', fill: '#fff7ed' },
  production: { color: '#16a34a', fill: '#f0fdf4' },
  equipment: { color: '#475569', fill: '#f8fafc' },
  energy: { color: '#ca8a04', fill: '#fefce8' },
  qc: { color: '#db2777', fill: '#fdf2f8' },
  warehouse: { color: '#0f766e', fill: '#f0fdfa' },
  finance: { color: '#4f46e5', fill: '#eef2ff' },
  after: { color: '#be123c', fill: '#fff1f2' },
};
const flowNodeX: Record<string, number> = {
  'settings-base': 170,
  'settings-rule': 500,
  'settings-integration': 830,
  'hr-org': 170,
  'hr-attendance': 500,
  'hr-payroll': 830,
  'rd-doc-project': 170,
  'rd-product-material': 500,
  'rd-process-bom': 830,
  'rd-release': 1160,
  'sales-customer': 170,
  'sales-plan': 500,
  'sales-quote-contract': 830,
  'sales-order': 1160,
  'sales-delivery-request': 1490,
  'purchase-supplier': 170,
  'purchase-request': 500,
  'purchase-inquiry': 830,
  'purchase-order': 1160,
  'purchase-return-exchange': 1490,
  'production-demand': 500,
  'production-plan': 830,
  'production-order': 1160,
  'production-work': 1490,
  'production-schedule-outsource': 1820,
  'equipment-assets': 830,
  'equipment-maintenance': 1160,
  'equipment-repair-spare': 1490,
  'energy-monitor': 1160,
  'energy-analysis': 1490,
  'qc-iqc': 1160,
  'qc-process': 1490,
  'qc-fqc-oqc': 1820,
  'qc-exception': 1820,
  'warehouse-inbound': 1160,
  'warehouse-stock': 1490,
  'warehouse-outbound': 1820,
  'warehouse-transfer-count': 500,
  'finance-ap': 1160,
  'finance-ar-invoice': 1490,
  'finance-settlement': 1820,
  'after-sales-service': 1160,
  'after-sales-task': 1490,
  'after-sales-quality': 1820,
};

const globalFlowEdgeSpecs: FlowChartEdgeSpec[] = [
  { fromId: 'settings-base', toId: 'settings-rule', label: '基础规则', tone: 'support' },
  { fromId: 'settings-rule', toId: 'settings-integration', label: '日志接口', tone: 'support' },
  { fromId: 'settings-rule', toId: 'sales-customer', label: '字段/编号/审批', tone: 'support', offset: -70 },
  { fromId: 'settings-rule', toId: 'purchase-supplier', label: '采购规则', tone: 'support', offset: -50 },
  { fromId: 'settings-rule', toId: 'production-demand', label: '生产规则', tone: 'support', offset: -30 },
  { fromId: 'settings-rule', toId: 'finance-ap', label: '财务策略', tone: 'support', offset: 70 },
  { fromId: 'settings-integration', toId: 'energy-monitor', label: '采集接口', tone: 'support', offset: 80 },

  { fromId: 'hr-org', toId: 'hr-attendance', label: '人员排班', tone: 'support' },
  { fromId: 'hr-attendance', toId: 'hr-payroll', label: '考勤薪酬', tone: 'support' },
  { fromId: 'hr-org', toId: 'production-work', label: '派工人员', tone: 'support', offset: 36, labelOffsetX: -80 },
  { fromId: 'hr-attendance', toId: 'production-schedule-outsource', label: '班次日历', tone: 'support', offset: 70, labelOffsetX: -80 },
  { fromId: 'hr-payroll', toId: 'finance-settlement', label: '工资核算', tone: 'support', offset: 90, labelOffsetX: -40 },

  { fromId: 'rd-doc-project', toId: 'rd-product-material', label: '项目资料', tone: 'main' },
  { fromId: 'rd-product-material', toId: 'rd-process-bom', label: '产品物料', tone: 'main' },
  { fromId: 'rd-process-bom', toId: 'rd-release', label: '审批发布', tone: 'main' },
  { fromId: 'rd-release', toId: 'sales-quote-contract', label: '产品报价', tone: 'main', offset: -26, labelOffsetX: -60 },
  { fromId: 'rd-release', toId: 'purchase-request', label: '外购物料', tone: 'main', offset: -20, labelOffsetX: -80 },
  { fromId: 'rd-release', toId: 'production-plan', label: 'BOM工艺', tone: 'main', offset: 24, labelOffsetX: -40 },
  { fromId: 'rd-release', toId: 'qc-iqc', label: '质检方案', tone: 'main', offset: 68, labelOffsetX: 60 },
  { fromId: 'rd-release', toId: 'warehouse-stock', label: '库存主数据', tone: 'main', offset: 92, labelOffsetX: 70 },

  { fromId: 'sales-customer', toId: 'sales-plan', label: '目标客户', tone: 'main' },
  { fromId: 'sales-plan', toId: 'sales-quote-contract', label: '计划报价', tone: 'main' },
  { fromId: 'sales-quote-contract', toId: 'sales-order', label: '合同下单', tone: 'main' },
  { fromId: 'sales-order', toId: 'sales-delivery-request', label: '发货申请', tone: 'main' },
  { fromId: 'sales-order', toId: 'production-demand', label: '自制需求', tone: 'main', offset: -46, labelOffsetX: -70 },
  { fromId: 'sales-order', toId: 'warehouse-outbound', label: '库存发货', tone: 'main', offset: 36, labelOffsetX: 70 },
  { fromId: 'sales-order', toId: 'finance-ar-invoice', label: '应收开票', tone: 'main', offset: 74, labelOffsetX: 40 },

  { fromId: 'purchase-supplier', toId: 'purchase-request', label: '供应准入', tone: 'main' },
  { fromId: 'purchase-request', toId: 'purchase-inquiry', label: '请购询价', tone: 'main' },
  { fromId: 'purchase-inquiry', toId: 'purchase-order', label: '定价下单', tone: 'main' },
  { fromId: 'purchase-order', toId: 'qc-iqc', label: '采购到货', tone: 'main', offset: -32, labelOffsetX: -40 },
  { fromId: 'qc-iqc', toId: 'warehouse-inbound', label: '合格入库', tone: 'main', offset: -22 },
  { fromId: 'purchase-order', toId: 'finance-ap', label: '应付来源', tone: 'main', offset: 64, labelOffsetX: 42 },
  { fromId: 'qc-iqc', toId: 'purchase-return-exchange', label: '拒收/退换', tone: 'loop', offset: -66, labelOffsetX: 70 },

  { fromId: 'production-demand', toId: 'production-plan', label: '需求排产', tone: 'main' },
  { fromId: 'production-plan', toId: 'production-order', label: '计划下达', tone: 'main' },
  { fromId: 'production-order', toId: 'production-work', label: '释放工单', tone: 'main' },
  { fromId: 'production-work', toId: 'production-schedule-outsource', label: '报工/委外', tone: 'main' },
  { fromId: 'production-work', toId: 'qc-process', label: '过程检验', tone: 'main', offset: -28, labelOffsetX: -36 },
  { fromId: 'production-work', toId: 'qc-fqc-oqc', label: '完工检验', tone: 'main', offset: 52, labelOffsetX: 60 },
  { fromId: 'warehouse-stock', toId: 'production-work', label: '领料出库', tone: 'main', offset: -50, labelOffsetX: -70 },
  { fromId: 'qc-process', toId: 'production-work', label: '返工复检', tone: 'loop', offset: 34, labelOffsetX: -70 },
  { fromId: 'qc-fqc-oqc', toId: 'warehouse-inbound', label: '完工入库', tone: 'main', offset: 24, labelOffsetX: -70 },
  { fromId: 'production-schedule-outsource', toId: 'purchase-order', label: '委外下单', tone: 'main', offset: -86, labelOffsetX: -40 },

  { fromId: 'equipment-assets', toId: 'equipment-maintenance', label: '保养点检', tone: 'support' },
  { fromId: 'equipment-maintenance', toId: 'equipment-repair-spare', label: '异常维修', tone: 'support' },
  { fromId: 'equipment-repair-spare', toId: 'production-work', label: '设备可用', tone: 'support', offset: -40, labelOffsetX: -60 },
  { fromId: 'equipment-repair-spare', toId: 'purchase-request', label: '备件请购', tone: 'support', offset: 80, labelOffsetX: 80 },

  { fromId: 'energy-monitor', toId: 'energy-analysis', label: '能耗分析', tone: 'support' },
  { fromId: 'energy-analysis', toId: 'finance-settlement', label: '能耗成本', tone: 'support', offset: 60, labelOffsetX: -50 },

  { fromId: 'warehouse-inbound', toId: 'warehouse-stock', label: '上架入账', tone: 'main' },
  { fromId: 'warehouse-stock', toId: 'warehouse-outbound', label: '库存占用', tone: 'main' },
  { fromId: 'warehouse-transfer-count', toId: 'warehouse-stock', label: '来料入账', tone: 'loop', offset: -40 },
  { fromId: 'warehouse-outbound', toId: 'sales-delivery-request', label: '发货回写', tone: 'loop', offset: -80, labelOffsetX: -80 },
  { fromId: 'warehouse-inbound', toId: 'finance-ap', label: '入库暂估', tone: 'main', offset: 52, labelOffsetX: 40 },
  { fromId: 'warehouse-outbound', toId: 'finance-ar-invoice', label: '出库确认', tone: 'main', offset: 48, labelOffsetX: -50 },
  { fromId: 'warehouse-stock', toId: 'purchase-request', label: '库存补货', tone: 'loop', offset: 120, labelOffsetX: -70 },

  { fromId: 'finance-ap', toId: 'finance-settlement', label: '付款核销', tone: 'main' },
  { fromId: 'finance-ar-invoice', toId: 'finance-settlement', label: '收款核销', tone: 'main' },
  { fromId: 'finance-settlement', toId: 'sales-delivery-request', label: '回款信用', tone: 'loop', offset: 80, labelOffsetX: -70 },
  { fromId: 'finance-settlement', toId: 'purchase-order', label: '付款回写', tone: 'loop', offset: 100, labelOffsetX: 60 },

  { fromId: 'sales-delivery-request', toId: 'after-sales-service', label: '客户问题', tone: 'loop', offset: 40, labelOffsetX: 70 },
  { fromId: 'after-sales-service', toId: 'after-sales-task', label: '拆分任务', tone: 'loop' },
  { fromId: 'after-sales-task', toId: 'after-sales-quality', label: '质量/成本', tone: 'loop' },
  { fromId: 'after-sales-task', toId: 'warehouse-inbound', label: '退货入库', tone: 'loop', offset: -70, labelOffsetX: -60 },
  { fromId: 'after-sales-task', toId: 'warehouse-outbound', label: '换货出库', tone: 'loop', offset: -30, labelOffsetX: 70 },
  { fromId: 'after-sales-task', toId: 'finance-ar-invoice', label: '退款红冲', tone: 'loop', offset: 46 },
  { fromId: 'after-sales-quality', toId: 'qc-exception', label: '质量改进', tone: 'loop', offset: 70, labelOffsetX: 60 },
];

watch(flowCenterLayouts, (layouts) => {
  if (activeFlowCenterId.value === 'all') return;
  if (!layouts.some((layout) => layout.id === activeFlowCenterId.value)) activeFlowCenterId.value = 'all';
});

function setActiveFlowCenter(centerId: string) {
  activeFlowCenterId.value = centerId;
  resetFlowScroll();
}

function buildCenterFlowLayouts(diagram: PrdFlowDiagram | undefined): FlowChartLayout[] {
  if (!diagram) return [];

  const allNodeById = new Map(diagram.lanes.flatMap((lane) => lane.nodes.map((item) => [item.id, item] as const)));
  return diagram.lanes.map((lane, laneIndex) => buildCenterFlowLayout(lane, laneIndex, allNodeById));
}

function buildCenterFlowLayout(
  centerLane: PrdFlowDiagram['lanes'][number],
  centerIndex: number,
  allNodeById: Map<string, PrdFlowDiagramNode>,
): FlowChartLayout {
  const centerNodeIds = new Set(centerLane.nodes.map((item) => item.id));
  const relatedEdgeSpecs = globalFlowEdgeSpecs.filter((edge) => centerNodeIds.has(edge.fromId) || centerNodeIds.has(edge.toId));
  const inputNodes = endpointNodes(
    relatedEdgeSpecs.filter((edge) => !centerNodeIds.has(edge.fromId) && centerNodeIds.has(edge.toId)),
    'fromId',
    allNodeById,
  );
  const inputNodeIds = new Set(inputNodes.map((item) => item.id));
  const outputNodes = endpointNodes(
    relatedEdgeSpecs.filter((edge) => centerNodeIds.has(edge.fromId) && !centerNodeIds.has(edge.toId)),
    'toId',
    allNodeById,
  ).filter((item) => !inputNodeIds.has(item.id));
  const laneSpecs: Array<{ title: string; description?: string; nodes: PrdFlowDiagramNode[] }> = [];

  if (inputNodes.length) {
    laneSpecs.push({
      title: '上游输入',
      description: '进入本中心的单据、主数据或支撑关系。',
      nodes: inputNodes,
    });
  }

  laneSpecs.push({
    title: centerLane.title,
    description: centerLane.description,
    nodes: centerLane.nodes,
  });

  if (outputNodes.length) {
    laneSpecs.push({
      title: '下游输出',
      description: '从本中心流出的单据、回写和闭环结果。',
      nodes: outputNodes,
    });
  }

  const maxLaneNodeCount = Math.max(...laneSpecs.map((lane) => lane.nodes.length), 1);
  const width = Math.max(
    flowCenterChartMinWidth,
    flowCenterNodeLeft + maxLaneNodeCount * flowNodeWidth + Math.max(0, maxLaneNodeCount - 1) * flowCenterNodeGap + 90,
  );
  let currentY = flowLaneTop;
  const lanes: FlowChartLane[] = [];
  const nodes: FlowChartNode[] = [];

  laneSpecs.forEach((lane, laneIndex) => {
    lanes.push({
      description: lane.description,
      height: flowLaneHeight,
      index: laneIndex,
      title: lane.title,
      y: currentY,
    });

    const nodeStep = flowNodeWidth + flowCenterNodeGap;
    const startX = flowCenterNodeLeft + Math.max(0, (maxLaneNodeCount - lane.nodes.length) * nodeStep / 2);
    lane.nodes.forEach((item, nodeIndex) => {
      nodes.push({
        ...item,
        detailText: buildFlowNodeDetail(item),
        height: flowNodeHeight,
        laneIndex,
        titleLines: splitFlowNodeTitle(item.title),
        width: flowNodeWidth,
        x: startX + nodeIndex * nodeStep,
        y: currentY + flowLanePaddingY,
      });
    });

    currentY += flowLaneHeight + flowLaneGap;
  });

  const nodeById = new Map(nodes.map((item) => [item.id, item]));
  const edges = relatedEdgeSpecs
    .map((edge, edgeIndex) => buildFlowEdge(edge, edgeIndex, nodeById))
    .filter((edge): edge is FlowChartEdge => Boolean(edge));
  const markers = Array.from(new Map(edges.map((edge) => [edge.markerId, { id: edge.markerId, color: edge.color }])).values());

  return {
    description: centerLane.description,
    edges,
    height: currentY + 24,
    id: `center-flow-${centerIndex}`,
    lanes,
    markers,
    nodes,
    title: centerLane.title,
    width,
  };
}

function endpointNodes(
  edges: FlowChartEdgeSpec[],
  endpoint: 'fromId' | 'toId',
  allNodeById: Map<string, PrdFlowDiagramNode>,
) {
  const seenIds = new Set<string>();
  return edges.flatMap((edge) => {
    const nodeId = edge[endpoint];
    if (seenIds.has(nodeId)) return [];
    seenIds.add(nodeId);
    const existingNode = allNodeById.get(nodeId);
    if (existingNode) return [existingNode];
    return [{ id: nodeId, title: nodeId, summary: '外部业务节点。', groups: [], badge: '外部' }];
  });
}

function buildFlowChartLayout(diagram: PrdFlowDiagram | undefined) {
  if (!diagram) {
    return {
      width: 1,
      height: 1,
      lanes: [] as FlowChartLane[],
      nodes: [] as FlowChartNode[],
      edges: [] as FlowChartEdge[],
      markers: [] as FlowChartMarker[],
    };
  }

  let currentY = flowLaneTop;
  const lanes: FlowChartLane[] = [];
  const nodes: FlowChartNode[] = [];

  diagram.lanes.forEach((lane, laneIndex) => {
    const laneHeight = flowLaneHeight;
    lanes.push({
      description: lane.description,
      height: laneHeight,
      index: laneIndex,
      title: lane.title,
      y: currentY,
    });

    lane.nodes.forEach((item, nodeIndex) => {
      const fallbackX = 158 + nodeIndex * 372;
      nodes.push({
        ...item,
        detailText: buildFlowNodeDetail(item),
        height: flowNodeHeight,
        laneIndex,
        titleLines: splitFlowNodeTitle(item.title),
        width: flowNodeWidth,
        x: flowNodeX[item.id] ?? fallbackX,
        y: currentY + flowLanePaddingY,
      });
    });

    currentY += laneHeight + flowLaneGap;
  });

  const nodeById = new Map(nodes.map((item) => [item.id, item]));
  const edges = globalFlowEdgeSpecs
    .map((edge, index) => buildFlowEdge(edge, index, nodeById))
    .filter((edge): edge is FlowChartEdge => Boolean(edge));
  const markers = Array.from(new Map(edges.map((edge) => [edge.markerId, { id: edge.markerId, color: edge.color }])).values());

  return {
    width: flowChartWidth,
    height: currentY + 24,
    lanes,
    nodes,
    edges,
    markers,
  };
}

function buildFlowNodeDetail(node: PrdFlowDiagramNode) {
  const groups = (node.groups || []).map((group) => `${group.title}: ${group.items.join('、')}`).join('；');
  return [node.title, node.summary, groups].filter(Boolean).join('\n');
}

function splitFlowNodeTitle(title: string) {
  if (title.length <= 10) return [title];

  const slashParts = title.split(' / ');
  if (slashParts.length > 1) {
    const lines: string[] = [];
    slashParts.forEach((part) => {
      const lastLine = lines[lines.length - 1];
      if (!lastLine) {
        lines.push(part);
        return;
      }
      const nextLine = `${lastLine} / ${part}`;
      if (nextLine.length <= 10) lines[lines.length - 1] = nextLine;
      else lines.push(part);
    });
    return lines.slice(0, 2);
  }

  const splitIndex = Math.ceil(title.length / 2);
  return [title.slice(0, splitIndex), title.slice(splitIndex)];
}

function normalizeFlowZoom(value: number) {
  return Math.min(flowZoomMax, Math.max(flowZoomMin, Number(value.toFixed(2))));
}

function getFlowSvgStyle(layout: FlowChartLayout) {
  return {
    height: `${Math.ceil(layout.height * flowZoom.value)}px`,
    width: `${Math.ceil(layout.width * flowZoom.value)}px`,
  };
}

function flowMarkerId(layout: FlowChartLayout, markerId: string) {
  return `${layout.id}-${markerId}`.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function flowMarkerUrl(layout: FlowChartLayout, markerId: string) {
  return `url(#${flowMarkerId(layout, markerId)})`;
}

function changeFlowZoom(delta: number) {
  flowZoom.value = normalizeFlowZoom(flowZoom.value + delta);
}

function flowBlueprintElements() {
  return Array.from(flowStackRef.value?.querySelectorAll('.prd-flow-blueprint') || []) as HTMLElement[];
}

function resetFlowScroll() {
  flowBlueprintElements().forEach((blueprint) => {
    blueprint.scrollLeft = 0;
    blueprint.scrollTop = 0;
  });
}

function resetFlowZoom() {
  flowZoom.value = 1;
  resetFlowScroll();
}

async function fitFlowPreview() {
  await nextTick();
  const stack = flowStackRef.value;
  if (!stack || !visibleFlowLayouts.value.length) return;
  const maxWidth = Math.max(...visibleFlowLayouts.value.map((layout) => layout.width));
  const availableWidth = Math.max(320, stack.clientWidth - 16);
  const nextZoom = Math.min(1, availableWidth / maxWidth);
  flowZoom.value = normalizeFlowZoom(nextZoom);
  await nextTick();
  resetFlowScroll();
}

function flowEdgeSourceKey(edge: FlowChartEdgeSpec) {
  if (edge.fromId.startsWith('after-sales')) return 'after';
  return edge.fromId.split('-')[0] || 'main';
}

function getFlowEdgeVisual(edge: FlowChartEdgeSpec) {
  const tone = flowEdgeToneColor[edge.tone];
  if (!tone.sourceColor) return { color: tone.color, fill: tone.fill, markerId: `prd-flow-marker-edge-${edge.tone}` };

  const sourceKey = flowEdgeSourceKey(edge);
  const source = flowEdgeSourcePalette[sourceKey] || tone;
  return {
    color: source.color,
    fill: source.fill,
    markerId: `prd-flow-marker-edge-${edge.tone}-${sourceKey}`,
  };
}

function buildFlowEdge(edge: FlowChartEdgeSpec, index: number, nodeById: Map<string, FlowChartNode>): FlowChartEdge | undefined {
  const from = nodeById.get(edge.fromId);
  const to = nodeById.get(edge.toId);
  if (!from || !to) return undefined;
  const visual = getFlowEdgeVisual(edge);

  const fromCenterX = from.x + from.width / 2;
  const toCenterX = to.x + to.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterY = to.y + to.height / 2;
  let startX = fromCenterX;
  let startY = from.y + from.height;
  let endX = toCenterX;
  let endY = to.y;
  let path = '';
  let labelX = (startX + endX) / 2;
  let labelY = (startY + endY) / 2;

  if (from.laneIndex === to.laneIndex) {
    const forward = from.x <= to.x;
    startX = forward ? from.x + from.width : from.x;
    startY = fromCenterY;
    endX = forward ? to.x : to.x + to.width;
    endY = toCenterY;
    const midX = (startX + endX) / 2 + (edge.offset || 0);
    path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    labelX = midX;
    labelY = (startY + endY) / 2;
  } else {
    const downward = to.laneIndex > from.laneIndex;
    startY = downward ? from.y + from.height : from.y;
    endY = downward ? to.y : to.y + to.height;
    const midY = (startY + endY) / 2 + (edge.offset || 0);
    path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    labelY = midY;
  }

  labelX += edge.labelOffsetX || 0;
  labelY += edge.labelOffsetY || 0;

  return {
    ...edge,
    color: visual.color,
    id: `${edge.fromId}-${edge.toId}-${index}`,
    labelFill: visual.fill,
    labelWidth: Math.max(78, Math.min(132, edge.label.length * 13 + 24)),
    labelX,
    labelY,
    markerId: visual.markerId,
    path,
  };
}

function flattenVisibleTree(nodes: PrdTreeNode[]): PrdTreeNode[] {
  return nodes.flatMap((node) => {
    if (!node.children?.length) return [node];
    if (isNodeCollapsible(node) && !isNodeExpanded(node)) return [node];
    return [node, ...flattenVisibleTree(node.children)];
  });
}

function firstDoc(node: PrdTreeNode): string {
  if (node.docId) return node.docId;
  for (const child of node.children || []) {
    const docId = firstDoc(child);
    if (docId) return docId;
  }
  return defaultDocId.value;
}

function selectNode(node: PrdTreeNode) {
  if (isNodeCollapsible(node) && !isNodeExpanded(node)) setNodeExpanded(node.id, true);
  const docId = firstDoc(node);
  const sectionId = node.sectionId || getDefaultPrdSection(docId);
  router.replace({
    path: getPrdCenterPath(docId),
    query: {
      doc: docId,
      section: sectionId,
    },
  }).then(() => scrollToSection(sectionId));
}

function isNodeCollapsible(node: PrdTreeNode) {
  return Boolean(node.children?.length);
}

function isNodeExpanded(node: PrdTreeNode) {
  return expandedTreeNodeIds.value.has(node.id);
}

function toggleNode(node: PrdTreeNode) {
  setNodeExpanded(node.id, !isNodeExpanded(node));
}

function setNodeExpanded(nodeId: string, expanded: boolean) {
  const nextIds = new Set(expandedTreeNodeIds.value);
  if (expanded) nextIds.add(nodeId);
  else nextIds.delete(nodeId);
  expandedTreeNodeIds.value = nextIds;
}

function isNodeActive(node: PrdTreeNode) {
  if (node.sectionId) return node.docId === selectedDocId.value && node.sectionId === activeSectionId.value;
  if (node.docId) return node.docId === selectedDocId.value;
  return hasActiveChild(node);
}

function sectionClass(sectionId: string) {
  return { active: activeSectionId.value === sectionId };
}

function hasSection(sectionId: string) {
  return availableSectionIds.value.has(sectionId);
}

function hasActiveChild(node: PrdTreeNode): boolean {
  return Boolean(node.children?.some((child) => child.docId === selectedDocId.value || hasActiveChild(child)));
}

function findDocPath(nodes: PrdTreeNode[], docId: string, path: string[] = []): string[] {
  for (const node of nodes) {
    const nextPath = [...path, node.id];
    if (node.docId === docId) return nextPath;
    const childPath = findDocPath(node.children || [], docId, nextPath);
    if (childPath.length) return childPath;
  }
  return [];
}

function expandActiveTreePath() {
  const path = findDocPath(prdTree, selectedDocId.value);
  if (!path.length) return;
  const nextIds = new Set(expandedTreeNodeIds.value);
  path.forEach((nodeId) => nextIds.add(nodeId));
  expandedTreeNodeIds.value = nextIds;
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

async function scrollToActiveTreeNode() {
  await nextTick();
  const container = treeListRef.value;
  if (!container) return;
  const activeNodes = container.querySelectorAll<HTMLElement>('.prd-tree-node.active');
  const node = activeNodes[activeNodes.length - 1];
  if (!node) return;
  container.scrollTo({
    top: Math.max(node.offsetTop - container.offsetTop - 32, 0),
    behavior: 'smooth',
  });
}

watch(selectedDocId, () => {
  expandActiveTreePath();
}, { immediate: true });

watch([selectedDocId, activeSectionId], ([, sectionId]) => {
  scrollToSection(sectionId || defaultSectionId.value);
  scrollToActiveTreeNode();
});

onMounted(() => {
  scrollToSection(activeSectionId.value || defaultSectionId.value);
  scrollToActiveTreeNode();
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

.prd-tree-row {
  align-items: center;
  display: grid;
  gap: 2px;
  grid-template-columns: 18px minmax(0, 1fr);
  min-width: 0;
}

.prd-tree-row.level-2 {
  padding-left: 18px;
}

.prd-tree-row.level-3 {
  padding-left: 36px;
}

.prd-tree-row.level-4 {
  padding-left: 56px;
}

.prd-tree-toggle {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 4px;
  color: var(--aw-fg-3);
  cursor: pointer;
  display: inline-flex;
  height: 24px;
  justify-content: center;
  padding: 0;
  width: 18px;
}

.prd-tree-toggle span {
  display: block;
  font-size: 16px;
  line-height: 1;
  transform: rotate(0deg);
  transition: transform 0.16s ease;
}

.prd-tree-toggle.open span {
  transform: rotate(90deg);
}

.prd-tree-toggle:hover {
  background: rgba(86, 119, 252, 0.1);
  color: var(--aw-primary);
}

.prd-tree-toggle.placeholder {
  cursor: default;
  pointer-events: none;
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
  padding: 0 8px 0 4px;
  text-align: left;
  width: 100%;
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
}

.prd-tree-node.level-4 {
  color: var(--aw-fg-2);
  font-size: 12px;
  height: 26px;
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

.prd-flow-heading {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.prd-flow-heading h3 {
  margin: 0;
}

.prd-flow-tools {
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: inline-flex;
  flex: none;
  gap: 4px;
  padding: 4px;
}

.prd-flow-tools button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--aw-fg-2);
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  gap: 5px;
  height: 28px;
  justify-content: center;
  min-width: 30px;
  padding: 0 8px;
}

.prd-flow-tools button:hover:not(:disabled) {
  background: rgba(86, 119, 252, 0.1);
  color: var(--aw-primary);
}

.prd-flow-tools button:disabled {
  color: var(--aw-fg-3);
  cursor: not-allowed;
  opacity: 0.42;
}

.prd-flow-tools button.fit {
  border-left: 1px solid var(--aw-divider);
  color: var(--aw-primary);
  font-weight: 700;
  margin-left: 4px;
  padding-left: 10px;
}

.prd-flow-tools > span {
  color: var(--aw-fg);
  font-size: 12px;
  font-weight: 800;
  min-width: 42px;
  text-align: center;
}

.prd-global-flow {
  margin-bottom: 16px;
}

.prd-flow-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.prd-flow-switcher button {
  background: #ffffff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  color: var(--aw-fg-2);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  height: 30px;
  padding: 0 10px;
}

.prd-flow-switcher button:hover,
.prd-flow-switcher button.active {
  background: rgba(86, 119, 252, 0.1);
  border-color: rgba(86, 119, 252, 0.35);
  color: var(--aw-primary);
}

.prd-flow-diagram-stack {
  display: grid;
  gap: 18px;
}

.prd-flow-center-diagram {
  display: grid;
  gap: 8px;
}

.prd-flow-center-head {
  align-items: end;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.prd-flow-center-head strong {
  color: var(--aw-fg);
  font-size: 15px;
}

.prd-flow-center-head p {
  color: var(--aw-fg-2);
  font-size: 12px;
  line-height: 1.5;
  margin: 4px 0 0;
}

.prd-flow-center-head span {
  color: var(--aw-fg-3);
  flex: none;
  font-size: 12px;
  font-weight: 700;
}

.prd-flow-blueprint {
  background: #ffffff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  overflow: auto;
  padding: 0;
}

.prd-flow-svg {
  display: block;
  font-family: inherit;
  max-width: none;
  min-width: 0;
}

.prd-flow-canvas {
  fill: #ffffff;
}

.prd-flow-svg-lane .lane-bg {
  fill: #f8fafc;
  stroke: #d8dee8;
}

.prd-svg-lane-label {
  align-content: start;
  background: #eef4ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  box-sizing: border-box;
  display: grid;
  gap: 8px;
  height: 100%;
  padding: 12px;
}

.prd-svg-lane-label span {
  color: #5677fc;
  font-size: 12px;
  font-weight: 800;
}

.prd-svg-lane-label strong {
  color: var(--aw-fg);
  font-size: 15px;
  line-height: 1.25;
}

.prd-svg-lane-label p {
  color: var(--aw-fg-2);
  font-size: 12px;
  line-height: 1.55;
  margin: 0;
}

.prd-flow-path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.prd-flow-path.main {
  stroke: #2563eb;
  stroke-width: 2.2;
}

.prd-flow-path.support {
  stroke: #0f766e;
  stroke-dasharray: 8 6;
  stroke-width: 1.8;
}

.prd-flow-path.loop {
  stroke: #d97706;
  stroke-dasharray: 12 5;
  stroke-width: 2;
}

.prd-flow-svg-label rect {
  fill: #ffffff;
  stroke-width: 1;
}

.prd-flow-svg-label.main rect {
  stroke: rgba(37, 99, 235, 0.35);
}

.prd-flow-svg-label.support rect {
  stroke: rgba(15, 118, 110, 0.35);
}

.prd-flow-svg-label.loop rect {
  stroke: rgba(217, 119, 6, 0.4);
}

.prd-flow-svg-label text {
  fill: #334155;
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
}

.prd-flow-node-box {
  fill: #ffffff;
  filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.08));
  stroke: #38bdf8;
  stroke-width: 2;
}

.prd-flow-node-title {
  fill: var(--aw-fg);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0;
  text-anchor: middle;
}

.prd-flow-node-badge rect {
  fill: #eef4ff;
  stroke: #c7d2fe;
}

.prd-flow-node-badge text {
  fill: #3b5bdb;
  font-size: 10px;
  font-weight: 700;
  text-anchor: middle;
}

.prd-flow-legend rect {
  fill: rgba(255, 255, 255, 0.92);
  stroke: #d8dee8;
}

.prd-flow-legend text {
  fill: var(--aw-fg-2);
  font-size: 12px;
  font-weight: 700;
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

.prd-detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.prd-detail-grid article {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 12px;
}

.prd-detail-grid h4 {
  color: var(--aw-fg);
  font-size: 13px;
  margin: 0 0 8px;
}

.prd-acceptance-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
}

.prd-acceptance-list li {
  color: var(--aw-fg-1);
  font-size: 13px;
  line-height: 1.7;
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

  .prd-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
