export function renderQuota(quota, digits = 2) {
  let quotaPerUnit = 500000;
  return '$' + (quota / quotaPerUnit).toFixed(digits);
}

export function renderModelPrice(
  inputTokens,
  completionTokens,
  modelRatio,
  modelPrice = -1,
  completionRatio,
  groupRatio,
) {
  if (modelPrice !== -1) {
    return '模型价格：$' + modelPrice * groupRatio;
  } else {
    if (completionRatio === undefined) {
      completionRatio = 0;
    }
    let inputRatioPrice = modelRatio * 2.0 * groupRatio;
    let completionRatioPrice = modelRatio * 2.0 * completionRatio * groupRatio;
    let price =
      (inputTokens / 1000000) * inputRatioPrice +
      (completionTokens / 1000000) * completionRatioPrice;
    return (
      <>
        <article>
          <p>提示 ${inputRatioPrice} / 1M tokens</p>
          <p>补全 ${completionRatioPrice} / 1M tokens</p>
          <p></p>
          <p>
            提示 {inputTokens} tokens / 1M tokens * ${inputRatioPrice} + 补全{' '}
            {completionTokens} tokens / 1M tokens * ${completionRatioPrice} = $
            {price.toFixed(6)}
          </p>
        </article>
      </>
    );
  }
}

const colors = [
  'amber', 'blue', 'cyan', 'green', 'grey', 'indigo',
  'light-blue', 'lime', 'orange', 'pink', 'purple',
  'red', 'teal', 'violet', 'yellow',
];

export function stringToColor(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  let i = sum % colors.length;
  return colors[i];
}
