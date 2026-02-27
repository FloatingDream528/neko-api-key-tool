#!/bin/sh
# 容器启动时，将环境变量动态写入 env-config.js，供 React 运行时读取

ENV_JS="/usr/share/nginx/html/env-config.js"

# 对值中的双引号和反斜杠进行转义，确保 JS 字符串安全
escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$ENV_JS" <<ENDOFFILE
window._env_ = {
  BASE_URL: "$(escape "${BASE_URL}")",
  API_SERVER: "$(escape "${API_SERVER}")",
  SHOW_BALANCE: "$(escape "${SHOW_BALANCE:-true}")",
  SHOW_DETAIL: "$(escape "${SHOW_DETAIL:-true}")",
  SHOW_GITHUB_ICON: "$(escape "${SHOW_GITHUB_ICON:-true}")",
};
ENDOFFILE

echo "env-config.js generated:"
cat "$ENV_JS"

exec nginx -g 'daemon off;'
