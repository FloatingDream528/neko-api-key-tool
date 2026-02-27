/**
 * 获取运行时环境变量
 * 优先从 window._env_（Docker 运行时注入）读取，
 * 回退到 process.env（CRA 构建时注入），兼容本地开发与容器部署。
 */
export function getEnv(key) {
  if (window._env_ && window._env_[key] !== undefined && window._env_[key] !== '') {
    return window._env_[key];
  }
  return process.env[key] || '';
}
