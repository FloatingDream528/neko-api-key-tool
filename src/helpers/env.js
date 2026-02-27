/**
 * 获取运行时环境变量
 * 优先从 window._env_（Docker 运行时注入）读取，
 * 回退到 process.env（CRA 构建时注入 / Vercel），兼容所有部署方式。
 *
 * 同时兼容新旧变量名：
 *   新名 (BASE_URL) → 旧名 (REACT_APP_BASE_URL)
 */

const LEGACY_MAP = {
  BASE_URL: 'REACT_APP_BASE_URL',
  API_SERVER: 'REACT_APP_SERVER',
  SHOW_BALANCE: 'REACT_APP_SHOW_BALANCE',
  SHOW_DETAIL: 'REACT_APP_SHOW_DETAIL',
  SHOW_GITHUB_ICON: 'REACT_APP_SHOW_ICONGITHUB',
};

function readValue(key) {
  if (window._env_ && window._env_[key] !== undefined && window._env_[key] !== '') {
    return window._env_[key];
  }
  return process.env[key] || '';
}

export function getEnv(key) {
  // 先用新名读取
  const val = readValue(key);
  if (val) return val;

  // 回退到旧名（兼容 Vercel 等仍使用 REACT_APP_ 前缀的部署）
  const legacyKey = LEGACY_MAP[key];
  if (legacyKey) {
    return readValue(legacyKey);
  }

  return '';
}
