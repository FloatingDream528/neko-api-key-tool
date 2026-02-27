#!/bin/sh
# 容器启动时，将环境变量动态写入 env-config.js，供 React 运行时读取

ENV_JS="/usr/share/nginx/html/env-config.js"

# 用 JS 模板直接拼接，避免 heredoc 中的引号转义问题
{
  echo 'window._env_ = {'

  # 逐个输出，用单引号包裹避免 JS 中双引号冲突
  echo "  BASE_URL: '${BASE_URL}',"
  echo "  API_SERVER: '${API_SERVER}',"
  echo "  SHOW_BALANCE: '${SHOW_BALANCE:-true}',"
  echo "  SHOW_DETAIL: '${SHOW_DETAIL:-true}',"
  echo "  SHOW_GITHUB_ICON: '${SHOW_GITHUB_ICON:-true}',"

  echo '};'
} > "$ENV_JS"

echo "=== env-config.js generated ==="
cat "$ENV_JS"
echo "==============================="

exec nginx -g 'daemon off;'
