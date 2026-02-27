#!/bin/sh
# 容器启动时，将环境变量动态写入 env-config.js，供 React 运行时读取

ENV_JS="/usr/share/nginx/html/env-config.js"

cat <<EOF > "$ENV_JS"
window._env_ = {
  REACT_APP_BASE_URL: "${REACT_APP_BASE_URL}",
  REACT_APP_SERVER: "${REACT_APP_SERVER}",
  REACT_APP_SHOW_BALANCE: "${REACT_APP_SHOW_BALANCE:-true}",
  REACT_APP_SHOW_DETAIL: "${REACT_APP_SHOW_DETAIL:-true}",
  REACT_APP_SHOW_ICONGITHUB: "${REACT_APP_SHOW_ICONGITHUB:-true}",
};
EOF

echo "env-config.js generated:"
cat "$ENV_JS"

exec nginx -g 'daemon off;'
