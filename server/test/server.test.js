import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { loadConfig } from '../src/config.js';
import { createServer } from '../src/server.js';
import { createStore } from '../src/store.js';

const SECRET = 'secret-de-test';

let dir;
before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'flirt-server-'));
});
after(async () => {
  await rm(dir, { recursive: true, force: true });
});

/** Démarre le serveur sur un port libre et renvoie de quoi l'appeler. */
async function start({ playClient = null, secret = SECRET, name = 'srv' } = {}) {
  const store = await createStore(join(dir, `${name}.json`));
  const config = loadConfig({ REVENUECAT_WEBHOOK_SECRET: secret, DATA_FILE: `./${name}.json` });
  const server = createServer({ store, playClient, config });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  return {
    store,
    async call(path, init) {
      const response = await fetch(base + path, init);
      return { status: response.status, body: await response.json() };
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

const webhook = (event) => ({
  method: 'POST',
  headers: { authorization: SECRET, 'content-type': 'application/json' },
  body: JSON.stringify({ event }),
});

test('/health répond et annonce ce qui est configuré', async () => {
  const srv = await start({ name: 'health' });
  const { status, body } = await srv.call('/health');

  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.webhookConfigured, true);
  assert.equal(body.googlePlayConfigured, false);
  await srv.close();
});

test('le webhook refuse un appel sans le bon secret', async () => {
  const srv = await start({ name: 'auth' });
  const { status } = await srv.call('/v1/webhooks/revenuecat', {
    method: 'POST',
    headers: { authorization: 'mauvais-secret' },
    body: '{}',
  });

  assert.equal(status, 401);
  await srv.close();
});

test('le webhook est désactivé tant que le secret n\'est pas configuré', async () => {
  const srv = await start({ secret: '', name: 'nosecret' });
  const { status } = await srv.call('/v1/webhooks/revenuecat', { method: 'POST', body: '{}' });

  assert.equal(status, 503);
  await srv.close();
});

test('un achat annoncé par RevenueCat débloque le produit', async () => {
  const srv = await start({ name: 'buy' });
  const posted = await srv.call(
    '/v1/webhooks/revenuecat',
    webhook({
      id: 'evt-100',
      type: 'NON_RENEWING_PURCHASE',
      app_user_id: 'user-x',
      product_id: 'flirt_bundle_tout',
    }),
  );
  assert.equal(posted.status, 200);

  const { status, body } = await srv.call('/v1/entitlements/user-x');
  assert.equal(status, 200);
  assert.deepEqual(body.productIds, ['flirt_bundle_tout']);
  await srv.close();
});

test('un corps illisible donne 400, une route inconnue 404', async () => {
  const srv = await start({ name: 'errors' });

  const bad = await srv.call('/v1/webhooks/revenuecat', {
    method: 'POST',
    headers: { authorization: SECRET },
    body: 'pas du json',
  });
  assert.equal(bad.status, 400);

  const missing = await srv.call('/v1/inconnu');
  assert.equal(missing.status, 404);
  await srv.close();
});

test('la vérification Google Play valide, acquitte et débloque', async () => {
  const acknowledged = [];
  const playClient = {
    isConfigured: () => true,
    verifyProduct: async () => ({ valid: true, orderId: 'GPA.1234', acknowledged: false }),
    acknowledge: async (productId, token) => {
      acknowledged.push([productId, token]);
      return { ok: true, status: 200 };
    },
  };
  const srv = await start({ playClient, name: 'verify' });

  const { status, body } = await srv.call('/v1/purchases/google/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      appUserId: 'user-y',
      productId: 'flirt_pack_hot',
      purchaseToken: 'jeton-play',
    }),
  });

  assert.equal(status, 200);
  assert.deepEqual(body.productIds, ['flirt_pack_hot']);
  assert.equal(body.orderId, 'GPA.1234');
  assert.deepEqual(acknowledged, [['flirt_pack_hot', 'jeton-play']]);
  await srv.close();
});

test('un achat refusé par Google ne débloque rien', async () => {
  const playClient = {
    isConfigured: () => true,
    verifyProduct: async () => ({ valid: false, reason: 'achat inconnu' }),
    acknowledge: async () => assert.fail('ne doit pas acquitter un achat invalide'),
  };
  const srv = await start({ playClient, name: 'refused' });

  const { status } = await srv.call('/v1/purchases/google/verify', {
    method: 'POST',
    body: JSON.stringify({ appUserId: 'u', productId: 'p', purchaseToken: 't' }),
  });

  assert.equal(status, 402);
  assert.deepEqual(srv.store.entitlements('u').productIds, []);
  await srv.close();
});

test('la vérification exige les trois paramètres', async () => {
  const playClient = { isConfigured: () => true };
  const srv = await start({ playClient, name: 'params' });

  const { status } = await srv.call('/v1/purchases/google/verify', {
    method: 'POST',
    body: JSON.stringify({ appUserId: 'u' }),
  });

  assert.equal(status, 400);
  await srv.close();
});
