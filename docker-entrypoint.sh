#!/bin/sh
# 容器启动时，将环境变量动态写入 env-config.js，供 React 运行时读取
# 支持两种方式传入变量：
#   1. docker-compose environment / -e 参数
#   2. 挂载 /app/.env 文件（推荐）

ENV_JS="/usr/share/nginx/html/env-config.js"
ENV_FILE="/app/.env"

# 如果挂载了 .env 文件，手动解析并导出变量
if [ -f "$ENV_FILE" ]; then
  echo "Loading env from $ENV_FILE ..."
  while IFS= read -r line || [ -n "$line" ]; do
    # 跳过空行和注释
    case "$line" in
      ''|\#*) continue ;;
    esac
    # 去掉行首空格
    line=$(echo "$line" | sed 's/^[[:space:]]*//')
    # 提取 key=value
    key=$(echo "$line" | cut -d'=' -f1)
    value=$(echo "$line" | cut -d'=' -f2-)
    export "$key=$value"
  done < "$ENV_FILE"
fi

# 生成 env-config.js，用单引号包裹值避免 JSON 双引号冲突
{
  echo 'window._env_ = {'
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
