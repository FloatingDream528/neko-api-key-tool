// 运行时环境变量注入（由 docker-entrypoint.sh 在容器启动时覆盖此文件）
// 本地开发时由 scripts/env-prepare.js 从 .env 自动生成
window._env_ = {
  "BASE_URL": "{\"server1\": \"https://us.vps668.top\"}",
  "API_SERVER": "",
  "SHOW_BALANCE": "true",
  "SHOW_DETAIL": "true",
  "SHOW_GITHUB_ICON": "true"
};
