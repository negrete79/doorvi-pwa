const CACHE_NAME = 'doorvi-cache-v1';

// Lista de todos os arquivos que compõem o "shell" do aplicativo
// Isso inclui HTML, CSS, JS e bibliotecas externas.
const URLS_TO_CACHE = [
  '/',
  '/morador.html',
  '/visitante.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

// Evento de Instalação: Ocorre quando o Service Worker é registrado pela primeira vez.
// Usamos para abrir um cache e adicionar todos os arquivos essenciais a ele.
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto, adicionando arquivos...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Todos os arquivos foram cacheados.');
        // Força a ativação do novo Service Worker imediatamente
        return self.skipWaiting();
      })
  );
});

// Evento de Ativação: Ocorre quando o Service Worker antigo é substituído por um novo.
// Usamos para limpar caches antigos.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não for o atual, deletamos
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Evento de Fetch: Intercepta todas as requisições de rede do aplicativo.
self.addEventListener('fetch', event => {
  // Estratégia: Cache First. Tenta buscar do cache primeiro.
  // Se não encontrar, busca na rede.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se a resposta estiver no cache, retorna-a
        if (response) {
          console.log('[Service Worker] Servindo do cache:', event.request.url);
          return response;
        }

        // Se não estiver no cache, faz a requisição de rede
        console.log('[Service Worker] Buscando da rede:', event.request.url);
        return fetch(event.request);
      })
      .catch(error => {
        // Opcional: Você pode retornar uma página offline personalizada aqui
        console.error('[Service Worker] Falha na busca:', error);
      })
  );
});
