// 运行时环境变量注入（由 docker-entrypoint.sh 在容器启动时覆盖此文件）
// 本地开发时使用以下默认值，生产环境由 Docker 容器启动脚本动态生成
window._env_ = {
  BASE_URL: "",
  API_SERVER: "",
  SHOW_BALANCE: "true",
  SHOW_DETAIL: "true",
  SHOW_GITHUB_ICON: "true",
};
