#!/bin/sh
# 容器启动时，将环境变量动态写入 env-config.js，供 React 运行时读取

ENV_JS="/usr/share/nginx/html/env-config.js"

# 对值中的双引号和反斜杠进行转义，确保 JSON 字符串安全
escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$ENV_JS" <<ENDOFFILE
window._env_ = {
  REACT_APP_BASE_URL: "$(escape "${REACT_APP_BASE_URL}")",
  REACT_APP_SERVER: "$(escape "${REACT_APP_SERVER}")",
  REACT_APP_SHOW_BALANCE: "$(escape "${REACT_APP_SHOW_BALANCE:-true}")",
  REACT_APP_SHOW_DETAIL: "$(escape "${REACT_APP_SHOW_DETAIL:-true}")",
  REACT_APP_SHOW_ICONGITHUB: "$(escape "${REACT_APP_SHOW_ICONGITHUB:-true}")",
};
ENDOFFILE

echo "env-config.js generated:"
cat "$ENV_JS"

exec nginx -g 'daemon off;'
