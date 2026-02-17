export const environment = {
  production: false,
  analytics: {
    enabled: true,
    githubToken: '', // ⚠️ NUNCA commitear el token real aquí
    githubRepo: 'trendingghostofficial/trending-ghost-analytics'
  },
  contact: {
    // URL del Cloudflare Worker de contacto (deployado en Cloudflare)
    // ⚠️ Reemplazar YOUR-ACCOUNT con tu account name de Cloudflare
    workerUrl: 'https://worker-contact.trendingghostofficial.workers.dev'
  }
};
