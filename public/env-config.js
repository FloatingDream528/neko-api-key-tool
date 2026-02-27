// 运行时环境变量注入（由 docker-entrypoint.sh 在容器启动时覆盖此文件）
// 本地开发时使用以下默认值，生产环境由 Docker 容器启动脚本动态生成
window._env_ = {
  REACT_APP_BASE_URL: "",
  REACT_APP_SERVER: "",
  REACT_APP_SHOW_BALANCE: "true",
  REACT_APP_SHOW_DETAIL: "true",
  REACT_APP_SHOW_ICONGITHUB: "true",
};
