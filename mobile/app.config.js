// A versão web publicada fica em /app no mesmo domínio da API (ver infra/caddy.Dockerfile).
// No dev e nos apps nativos fica na raiz.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL ?? "" },
});
