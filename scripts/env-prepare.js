/**
 * 读取 .env 文件，将变量注入到 public/env-config.js
 * 解决 CRA 只注入 REACT_APP_ 前缀变量的限制
 * 在 npm start / npm run build 前自动执行
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');
const OUT_FILE = path.join(ROOT, 'public', 'env-config.js');

// 需要注入的 key（与 src/helpers/env.js 保持一致）
const KEYS = ['BASE_URL', 'API_SERVER', 'SHOW_BALANCE', 'SHOW_DETAIL', 'SHOW_GITHUB_ICON'];

// 默认值
const DEFAULTS = {
  BASE_URL: '',
  API_SERVER: '',
  SHOW_BALANCE: 'true',
  SHOW_DETAIL: 'true',
  SHOW_GITHUB_ICON: 'true',
};

function parseEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;

  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // 去除引号
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

const envVars = parseEnvFile(ENV_FILE);

const result = {};
for (const key of KEYS) {
  result[key] = envVars[key] || DEFAULTS[key] || '';
}

const jsContent = `// 运行时环境变量注入（由 docker-entrypoint.sh 在容器启动时覆盖此文件）
// 本地开发时由 scripts/env-prepare.js 从 .env 自动生成
window._env_ = ${JSON.stringify(result, null, 2)};
`;

fs.writeFileSync(OUT_FILE, jsContent, 'utf-8');
console.log('[env-prepare] Generated public/env-config.js');
