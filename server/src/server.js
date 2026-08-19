/**
 * Les routes HTTP du backend.
 *
 *   GET  /health                        → le serveur est debout
 *   GET  /v1/entitlements/:appUserId    → ce que possède un utilisateur
 *   POST /v1/webhooks/revenuecat        → RevenueCat annonce un achat / remboursement
 *   POST /v1/purchases/google/verify    → vérifier un achat auprès de Google
 *
 * Pas de framework : le module `http` de Node suffit pour quatre routes, et
 * ça évite d'avoir à surveiller les mises à jour de sécurité de dépendances.
 */
import { timingSafeEqual } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';

/** Au-delà, on refuse le corps de requête (un webhook fait ~2 Ko). */
const MAX_BODY_BYTES = 128 * 1024;

/**
 * @param {object} deps
 * @param {import('./store.js').createStore extends (...a: any) => Promise<infer S> ? S : never} deps.store
 * @param {ReturnType<import('./googlePlay.js').createPlayClient> | null} [deps.playClient]
 * @param {ReturnType<import('./config.js').loadConfig>} deps.config
 */
export function createRequestHandler({ store, playClient = null, config }) {
  return async function handle(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const route = `${req.method} ${url.pathname}`;

      if (route === 'GET /health') {
        return json(res, 200, {
          status: 'ok',
          webhookConfigured: config.revenueCatWebhookSecret !== '',
          googlePlayConfigured: playClient?.isConfigured() ?? false,
        });
      }

      const entitlementsMatch = url.pathname.match(/^\/v1\/entitlements\/([^/]+)$/);
      if (req.method === 'GET' && entitlementsMatch) {
        const appUserId = decodeURIComponent(entitlementsMatch[1]);
        return json(res, 200, store.entitlements(appUserId));
      }

      if (route === 'POST /v1/webhooks/revenuecat') {
        return await handleWebhook(req, res, { store, config });
      }

      if (route === 'POST /v1/purchases/google/verify') {
        return await handleVerify(req, res, { store, playClient });
      }

      return json(res, 404, { error: 'route inconnue' });
    } catch (err) {
      // Le détail reste dans les journaux du serveur, jamais dans la réponse.
      console.error('[flirt-backend]', err);
      return json(res, 500, { error: 'erreur interne' });
    }
  };
}

async function handleWebhook(req, res, { store, config }) {
  if (!config.revenueCatWebhookSecret) {
    // Mieux vaut tout refuser que d'accepter n'importe quel appel.
    return json(res, 503, { error: 'webhook non configuré' });
  }
  if (!authorized(req.headers.authorization, config.revenueCatWebhookSecret)) {
    return json(res, 401, { error: 'non autorisé' });
  }

  const body = await readJson(req, res);
  if (body === undefined) return; // Réponse déjà envoyée.

  const result = await store.applyEvent(body?.event ?? body);
  // On répond 200 même si l'événement ne nous concerne pas : sinon
  // RevenueCat le rejoue indéfiniment.
  return json(res, 200, result);
}

async function handleVerify(req, res, { store, playClient }) {
  if (!playClient?.isConfigured()) {
    return json(res, 503, { error: 'vérification Google Play non configurée' });
  }

  const body = await readJson(req, res);
  if (body === undefined) return;

  const { appUserId, productId, purchaseToken } = body ?? {};
  if (!appUserId || !productId || !purchaseToken) {
    return json(res, 400, { error: 'appUserId, productId et purchaseToken sont requis' });
  }

  const verdict = await playClient.verifyProduct(productId, purchaseToken);
  if (!verdict.valid) return json(res, 402, { error: verdict.reason ?? 'achat invalide' });

  // Sans acquittement, Google rembourse l'achat au bout de trois jours.
  if (!verdict.acknowledged) await playClient.acknowledge(productId, purchaseToken);

  const granted = await store.grant(appUserId, productId, { orderId: verdict.orderId });
  return json(res, 200, { ...granted, orderId: verdict.orderId });
}

/** Comparaison à durée constante : ne laisse pas deviner le secret. */
function authorized(header, secret) {
  const value = Buffer.from(String(header ?? ''));
  const expected = Buffer.from(secret);
  return value.length === expected.length && timingSafeEqual(value, expected);
}

/** Lit un corps JSON borné. Répond et renvoie `undefined` en cas d'erreur. */
async function readJson(req, res) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      json(res, 413, { error: 'corps trop volumineux' });
      req.destroy();
      return undefined;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    json(res, 400, { error: 'JSON invalide' });
    return undefined;
  }
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

/** Serveur prêt à écouter. */
export function createServer(deps) {
  return createHttpServer(createRequestHandler(deps));
}
