export const environment = {
  production: true,
  analytics: {
    enabled: true,
    githubToken: '', // ⚠️ Configurar en build time con GitHub Secrets
    githubRepo: 'trendingghostofficial/trending-ghost-analytics'
  },
  contact: {
    // URL del Cloudflare Worker de contacto (deployado en Cloudflare)
    // ⚠️ Reemplazar YOUR-ACCOUNT con tu account name de Cloudflare
    workerUrl: 'https://worker-contact.trendingghostofficial.workers.dev'
  }
};
