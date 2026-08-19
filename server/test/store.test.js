import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { createStore } from '../src/store.js';

let dir;
before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'flirt-store-'));
});
after(async () => {
  await rm(dir, { recursive: true, force: true });
});

const purchase = (over = {}) => ({
  id: 'evt-1',
  type: 'NON_RENEWING_PURCHASE',
  app_user_id: 'user-a',
  product_id: 'flirt_pack_coeur',
  ...over,
});

test('un achat accorde le produit', async () => {
  const store = await createStore(join(dir, 'a.json'));
  const result = await store.applyEvent(purchase());

  assert.equal(result.applied, true);
  assert.deepEqual(result.productIds, ['flirt_pack_coeur']);
  assert.deepEqual(store.entitlements('user-a').productIds, ['flirt_pack_coeur']);
});

test('le même événement rejoué ne compte qu\'une fois', async () => {
  const store = await createStore(join(dir, 'b.json'));
  await store.applyEvent(purchase());
  const replay = await store.applyEvent(purchase());

  assert.equal(replay.applied, false);
  assert.equal(replay.reason, 'déjà traité');
  assert.deepEqual(store.entitlements('user-a').productIds, ['flirt_pack_coeur']);
});

test('un remboursement retire le produit', async () => {
  const store = await createStore(join(dir, 'c.json'));
  await store.applyEvent(purchase());
  await store.applyEvent(purchase({ id: 'evt-2', type: 'REFUND' }));

  assert.deepEqual(store.entitlements('user-a').productIds, []);
});

test('une annulation d\'abonnement ne retire rien', async () => {
  const store = await createStore(join(dir, 'd.json'));
  await store.applyEvent(purchase());
  await store.applyEvent(
    purchase({ id: 'evt-3', type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE' }),
  );

  assert.deepEqual(store.entitlements('user-a').productIds, ['flirt_pack_coeur']);
});

test('un remboursement annoncé comme CANCELLATION retire le produit', async () => {
  const store = await createStore(join(dir, 'e.json'));
  await store.applyEvent(purchase());
  await store.applyEvent(
    purchase({ id: 'evt-4', type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' }),
  );

  assert.deepEqual(store.entitlements('user-a').productIds, []);
});

test('les droits survivent au redémarrage', async () => {
  const file = join(dir, 'f.json');
  const store = await createStore(file);
  await store.applyEvent(purchase());
  await store.flush();

  const rebooted = await createStore(file);
  assert.deepEqual(rebooted.entitlements('user-a').productIds, ['flirt_pack_coeur']);
});

test('un transfert déplace les droits vers le nouveau compte', async () => {
  const store = await createStore(join(dir, 'g.json'));
  await store.applyEvent(purchase());
  await store.applyEvent({
    id: 'evt-5',
    type: 'TRANSFER',
    app_user_id: 'user-b',
    transferred_from: ['user-a'],
    transferred_to: ['user-b'],
  });

  assert.deepEqual(store.entitlements('user-b').productIds, ['flirt_pack_coeur']);
  assert.deepEqual(store.entitlements('user-a').productIds, []);
});

test('un utilisateur inconnu n\'a simplement aucun droit', async () => {
  const store = await createStore(join(dir, 'h.json'));
  assert.deepEqual(store.entitlements('jamais-vu'), {
    appUserId: 'jamais-vu',
    productIds: [],
    updatedAt: null,
  });
});
