const moneyKeyPattern = /(?:^|_)(amount|price|cost)(?:_|$)|(?:Amount|Price)$|^unitPrice$|^paid$|^payable$|^receivable$|^tax$|^taxAmount$|^taxExclusiveAmount$|^qualityDeduction$|^deduction$|^credit(?:Limit|Used|Hold|Available|Occupied)$/i;
const moneyTitlePattern = /金额|单价|价格|价税|税额|应收|应付|已收|未收|已付|未付|可付款|回款|收款|付款|余额|信用额度|成本|售价|进价/;
const nonMoneyTitlePattern = /来源|状态|申请|版本|类型|条件|方式|日期|编号|单号|账户|是否/;

export function parseMoneyValue(value: unknown) {
  const normalized = String(value ?? '')
    .replace(/\uffe5/g, '\u00a5')
    .replace(/RMB/gi, '')
    .replace(/,/g, '')
    .replace(/:/g, '.')
    .replace(/[^\d.-]/g, '');
  const parsed = Number(normalized || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: unknown) {
  return `\u00a5 ${parseMoneyValue(value)
    .toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace('.', ':')}`;
}

export function isMoneyField(key?: string, title?: string) {
  const titleText = String(title || '');
  return moneyKeyPattern.test(String(key || '')) || (!nonMoneyTitlePattern.test(titleText) && moneyTitlePattern.test(titleText));
}

export function formatNumber(value: unknown, fractionDigits = 2) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString('zh-CN', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
    : String(value ?? '-');
}
