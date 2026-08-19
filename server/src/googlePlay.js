/**
 * Vérification d'un achat directement auprès de Google Play.
 *
 * Sert dans deux cas :
 *  - si on renonce à RevenueCat (voir server/README.md) : c'est alors ici
 *    qu'on établit qu'un achat est réel avant de débloquer quoi que ce soit ;
 *  - pour lever un doute sur une commande précise, sans passer par
 *    l'interface de la Play Console.
 *
 * Google demande un jeton OAuth2 obtenu en signant un JWT avec la clé
 * privée d'un compte de service (Play Console → Utilisateurs et
 * autorisations, droit « Voir les données financières »). Tout est fait
 * avec `node:crypto`, sans dépendance.
 *
 * ⚠️ Un achat non « acquitté » sous 3 jours est automatiquement remboursé
 * par Google. RevenueCat s'en charge ; si on vérifie soi-même, il faut
 * appeler `acknowledge()` — d'où sa présence ici.
 */
import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

const base64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * @param {object} options
 * @param {string} options.serviceAccountJson clé du compte de service (JSON)
 * @param {string} options.packageName nom du package de l'app
 * @param {typeof fetch} [options.fetchImpl] injectable pour les tests
 * @param {() => number} [options.now]
 */
export function createPlayClient({
  serviceAccountJson,
  packageName,
  fetchImpl = fetch,
  now = Date.now,
}) {
  let credentials = null;
  if (serviceAccountJson) {
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON n\'est pas un JSON valide');
    }
  }

  let cachedToken = null; // { value, expiresAt }

  async function accessToken() {
    if (cachedToken && cachedToken.expiresAt > now() + 60_000) return cachedToken.value;

    const issuedAt = Math.floor(now() / 1000);
    const claims = {
      iss: credentials.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    };
    const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
      JSON.stringify(claims),
    )}`;
    const signature = createSign('RSA-SHA256')
      .update(unsigned)
      .sign(credentials.private_key, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${unsigned}.${signature}`,
      }).toString(),
    });
    if (!response.ok) {
      throw new Error(`Jeton Google refusé (${response.status}) : ${await response.text()}`);
    }
    const token = await response.json();
    cachedToken = { value: token.access_token, expiresAt: now() + token.expires_in * 1000 };
    return cachedToken.value;
  }

  async function call(path, init = {}) {
    const response = await fetchImpl(`${API}/${packageName}/${path}`, {
      ...init,
      headers: { authorization: `Bearer ${await accessToken()}`, ...(init.headers ?? {}) },
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, body: text ? JSON.parse(text) : {} };
  }

  return {
    /** Le client est-il utilisable (compte de service fourni) ? */
    isConfigured() {
      return credentials !== null;
    },

    /**
     * État réel d'un achat unique.
     * @returns {Promise<{valid: boolean, reason?: string, orderId?: string, acknowledged?: boolean}>}
     */
    async verifyProduct(productId, purchaseToken) {
      const { ok, status, body } = await call(
        `purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(
          purchaseToken,
        )}`,
      );
      if (!ok) {
        return { valid: false, reason: status === 404 ? 'achat inconnu' : `Google a répondu ${status}` };
      }
      // purchaseState : 0 acheté, 1 annulé, 2 en attente.
      if (body.purchaseState !== 0) {
        return { valid: false, reason: body.purchaseState === 2 ? 'paiement en attente' : 'achat annulé' };
      }
      return {
        valid: true,
        orderId: body.orderId,
        acknowledged: body.acknowledgementState === 1,
        purchaseTimeMillis: body.purchaseTimeMillis,
      };
    },

    /** Acquitte un achat — sans quoi Google le rembourse au bout de 3 jours. */
    async acknowledge(productId, purchaseToken) {
      const { ok, status } = await call(
        `purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(
          purchaseToken,
        )}:acknowledge`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      );
      return { ok, status };
    },
  };
}
