import type { FunctionalComponent, SVGAttributes } from 'vue';
import { h } from 'vue';

type IconRenderer = FunctionalComponent<SVGAttributes>;

const iconAttrs = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.8',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

const icon = (children: ReturnType<typeof h>[]): IconRenderer => (props) => h('svg', { ...iconAttrs, ...props }, children);
const path = (d: string) => h('path', { d });
const circle = (cx: number, cy: number, r: number) => h('circle', { cx, cy, r });
const rect = (x: number, y: number, width: number, height: number, rx = 2) => h('rect', { x, y, width, height, rx });

export const icons = {
  'line-search': icon([circle(10.5, 10.5, 5.5), path('M15 15l4 4')]),
  'line-refresh': icon([path('M20 6v5h-5'), path('M4 18v-5h5'), path('M18 9a7 7 0 0 0-12-3'), path('M6 15a7 7 0 0 0 12 3')]),
  'line-filter': icon([path('M4 5h16l-6 7v5l-4 2v-7z')]),
  'line-columns': icon([rect(4, 5, 16, 14), path('M9 5v14'), path('M15 5v14')]),
  'line-upload': icon([path('M12 16V5'), path('M7 10l5-5 5 5'), path('M5 19h14')]),
  'line-download': icon([path('M12 5v11'), path('M7 11l5 5 5-5'), path('M5 19h14')]),
  'line-plus': icon([path('M12 5v14'), path('M5 12h14')]),
  'line-back': icon([path('M15 6l-6 6 6 6'), path('M9 12h11')]),
  'line-users': icon([circle(9, 8, 3), path('M3.5 19a5.5 5.5 0 0 1 11 0'), path('M16 9a2.5 2.5 0 0 1 0 5'), path('M17 17c1.7.4 3 1.4 3.5 2.7')]),
  'line-lock': icon([rect(5, 10, 14, 10), path('M8 10V7a4 4 0 0 1 8 0v3')]),
  'line-node': icon([circle(12, 12, 4), path('M4 12h4'), path('M16 12h4')]),
  'line-table': icon([rect(4, 5, 16, 14), path('M4 10h16'), path('M4 15h16'), path('M10 5v14')]),
  'line-box': icon([path('M4 8l8-4 8 4-8 4z'), path('M4 8v8l8 4 8-4V8'), path('M12 12v8')]),
  'line-settings': icon([circle(12, 12, 3), path('M12 3v3'), path('M12 18v3'), path('M3 12h3'), path('M18 12h3'), path('M5.6 5.6l2.1 2.1'), path('M16.3 16.3l2.1 2.1'), path('M18.4 5.6l-2.1 2.1'), path('M7.7 16.3l-2.1 2.1')]),
  'line-setting': icon([circle(12, 12, 3), path('M12 3v3'), path('M12 18v3'), path('M3 12h3'), path('M18 12h3'), path('M5.6 5.6l2.1 2.1'), path('M16.3 16.3l2.1 2.1'), path('M18.4 5.6l-2.1 2.1'), path('M7.7 16.3l-2.1 2.1')]),
  'line-folder': icon([path('M3 7h6l2 2h10v8.5A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z')]),
  'line-doc': icon([path('M7 3h7l5 5v13H7z'), path('M14 3v6h5'), path('M9.5 13h5'), path('M9.5 17h5')]),
  'line-warehouse': icon([path('M4 10l8-5 8 5'), path('M6 9.5V20h12V9.5'), path('M9 20v-6h6v6')]),
  'line-location': icon([path('M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11z'), circle(12, 10, 2)]),
  'side-workbench': icon([rect(4, 5, 7, 6), rect(13, 5, 7, 6), path('M4 15h16'), path('M4 19h10')]),
  'side-project': icon([path('M5 5h6l2 2h6v13H5z'), path('M9 12h6'), path('M9 16h4')]),
  'side-product': icon([path('M4 8l8-4 8 4-8 4z'), path('M4 8v8l8 4 8-4V8'), path('M8 10l8-4')]),
  'side-material': icon([path('M6 7l6-3 6 3-6 3z'), path('M6 12l6-3 6 3-6 3z'), path('M6 17l6-3 6 3-6 3z')]),
  'side-process': icon([circle(6, 6, 2), circle(18, 6, 2), circle(12, 18, 2), path('M8 6h8'), path('M17 8l-4 8'), path('M7 8l4 8')]),
  'side-craft': icon([path('M14 7l3-3 3 3-3 3z'), path('M4 20l8-8'), path('M8 12l4 4'), path('M5 6h5'), path('M7.5 3.5v5')]),
  'side-bom': icon([rect(5, 4, 14, 16), path('M9 8h6'), path('M9 12h6'), path('M9 16h3'), path('M6 8h.01'), path('M6 12h.01'), path('M6 16h.01')]),
  'center-template': icon([rect(4, 5, 7, 6), rect(13, 5, 7, 6), rect(4, 13, 7, 6), rect(13, 13, 7, 6)]),
  'center-prd': icon([path('M5 4h14v16H5z'), path('M8 8h8'), path('M8 12h8'), path('M8 16h5')]),
  'center-rd': icon([path('M8 4h8'), path('M10 4v5l-5 8a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-8V4'), path('M8 15h8')]),
  'center-purchase': icon([path('M6 7h15l-2 8H8z'), path('M6 7l-1-3H3'), circle(9, 20, 1), circle(18, 20, 1)]),
  'center-sales': icon([path('M4 17l5-5 4 4 7-8'), path('M15 8h5v5')]),
  'center-warehouse': icon([path('M4 9l8-5 8 5'), path('M5 9v11h14V9'), path('M8 13h8'), path('M8 17h8')]),
  'center-production': icon([path('M4 18V8l5 4V8l5 4V6h6v12z'), path('M7 18v-3'), path('M11 18v-3')]),
  'center-after-sales': icon([path('M7 7a7 7 0 0 1 11 2'), path('M18 5v4h-4'), path('M17 17a7 7 0 0 1-11-2'), path('M6 19v-4h4')]),
  'center-qc': icon([path('M12 3l7 4v5c0 4.4-2.9 7.5-7 9-4.1-1.5-7-4.6-7-9V7z'), path('M9 12l2 2 4-4')]),
  'center-hr': icon([circle(12, 8, 3), path('M5 20a7 7 0 0 1 14 0')]),
  'center-finance': icon([path('M12 3v18'), path('M17 7.5c-.8-1-2.5-1.7-4.3-1.7-2.2 0-3.7 1-3.7 2.6 0 4.1 8 1.7 8 6 0 1.6-1.5 2.8-4.1 2.8-2 0-3.7-.8-4.7-2')]),
  'center-equipment': icon([circle(12, 12, 3), path('M4 12h3'), path('M17 12h3'), path('M12 4v3'), path('M12 17v3'), path('M6.3 6.3l2.1 2.1'), path('M15.6 15.6l2.1 2.1'), path('M17.7 6.3l-2.1 2.1'), path('M8.4 15.6l-2.1 2.1')]),
  'center-energy': icon([path('M13 2L5 14h6l-1 8 9-13h-6z')]),
  'center-settings': icon([circle(12, 12, 3), path('M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.8-2.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7.1 4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4h-.1a1.7 1.7 0 0 0-1.7 1z')]),
  'workbench-customer': icon([circle(9, 8, 3), path('M3.5 19a5.5 5.5 0 0 1 11 0'), path('M15.5 10h5'), path('M18 7.5v5')]),
  'workbench-plan': icon([rect(5, 4, 14, 16), path('M8 8h8'), path('M8 12h8'), path('M8 16h5')]),
  'workbench-quote': icon([path('M7 4h10v16H7z'), path('M10 9h4'), path('M10 13h4'), path('M10 17h2')]),
  'workbench-contract': icon([path('M7 3h8l4 4v14H7z'), path('M15 3v5h4'), path('M10 14l2 2 4-4')]),
  'workbench-order': icon([rect(5, 4, 14, 16), path('M9 8h6'), path('M9 12h6'), path('M9 16h4')]),
  'workbench-delivery': icon([path('M4 16V7h10v9'), path('M14 11h4l2 3v2h-6'), circle(7, 18, 1.5), circle(17, 18, 1.5)]),
  'workbench-invoice': icon([path('M7 4h10v16l-2-1-2 1-2-1-2 1-2-1z'), path('M10 9h4'), path('M10 13h4')]),
  'workbench-payment': icon([rect(4, 6, 16, 12), path('M4 10h16'), path('M8 15h4')]),
  'workbench-return': icon([path('M9 7l-5 5 5 5'), path('M4 12h10a5 5 0 0 1 0 10')]),
  'workbench-report': icon([rect(5, 4, 14, 16), path('M9 16v-4'), path('M12 16V9'), path('M15 16v-6')]),
  'workbench-approve': icon([path('M8 12l3 3 5-6'), path('M5 4h14v16H5z')]),
  'workbench-alert': icon([path('M12 4l9 16H3z'), path('M12 9v4'), path('M12 17h.01')]),
  'workbench-employee': icon([circle(12, 8, 3), path('M5 20a7 7 0 0 1 14 0')]),
  'workbench-org': icon([rect(9, 3, 6, 4), rect(4, 15, 6, 4), rect(14, 15, 6, 4), path('M12 7v4'), path('M7 15v-4h10v4')]),
  'workbench-equipment': icon([circle(12, 12, 3), path('M12 3v3'), path('M12 18v3'), path('M3 12h3'), path('M18 12h3')]),
};

export type AwIconName = keyof typeof icons;

const legacyIconMap: Record<string, AwIconName> = {
  '+': 'line-plus',
  '!': 'workbench-alert',
  '✓': 'workbench-approve',
  '⇄': 'center-after-sales',
  '↩': 'workbench-return',
  '↑': 'workbench-delivery',
  '¥': 'workbench-payment',
  '□': 'workbench-quote',
  '◇': 'workbench-customer',
  '▤': 'workbench-plan',
  '▦': 'workbench-contract',
  '▣': 'workbench-order',
  '⌕': 'workbench-report',
};

const labelIconRules: Array<[RegExp, AwIconName]> = [
  [/客户|供应商/, 'workbench-customer'],
  [/计划|排班|日历|方案/, 'workbench-plan'],
  [/报价|询价/, 'workbench-quote'],
  [/合同|协议/, 'workbench-contract'],
  [/订单|单据|申请|请购|需求/, 'workbench-order'],
  [/发货|出库|入库|物流|仓库|库存|库位/, 'workbench-delivery'],
  [/开票|发票|票据/, 'workbench-invoice'],
  [/回款|收款|付款|薪酬|工资|资金|财务/, 'workbench-payment'],
  [/退|返|换货/, 'workbench-return'],
  [/报表|分析|统计/, 'workbench-report'],
  [/审核|审批|确认|通过|质检|检验/, 'workbench-approve'],
  [/逾期|异常|预警|待办/, 'workbench-alert'],
  [/员工|人员|人事|入职|离职|转正/, 'workbench-employee'],
  [/组织|部门|岗位/, 'workbench-org'],
  [/设备|维修|保养|点检|备件/, 'workbench-equipment'],
  [/设置|配置|策略|规则/, 'center-settings'],
];

export function resolveIconName(name?: string, label?: string): AwIconName {
  if (name && name in icons) return name as AwIconName;
  if (name && legacyIconMap[name]) return legacyIconMap[name];
  const source = `${label || ''}${name || ''}`;
  const rule = labelIconRules.find(([pattern]) => pattern.test(source));
  return rule?.[1] || 'line-doc';
}
