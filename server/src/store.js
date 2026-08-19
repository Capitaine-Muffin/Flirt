/**
 * Qui possède quoi.
 *
 * Le serveur tient deux choses : un journal des derniers événements reçus
 * (pour ne pas traiter deux fois le même) et, surtout, la liste des
 * produits acquis par utilisateur. C'est une projection : on part des
 * événements RevenueCat / des vérifications Google Play et on en déduit
 * l'état courant.
 *
 * Le stockage est un simple fichier JSON, écrit de façon atomique. C'est
 * suffisant pour l'échelle de Flirt (quelques milliers d'achats) et ça
 * évite d'installer une base de données. Le jour où ça ne suffit plus,
 * seule ce fichier change : l'API ci-dessous reste la même.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Événements RevenueCat qui accordent un produit. */
const GRANTING = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  // Remboursement annulé : l'utilisateur retrouve son achat.
  'REFUND_REVERSED_TO_ACTIVE',
]);

/** Événements qui le retirent (remboursement, litige bancaire). */
const REVOKING = new Set(['REFUND', 'EXPIRATION']);

/** Nombre d'identifiants d'événements gardés pour la déduplication. */
const SEEN_EVENTS_KEPT = 1000;

/** État vide — une fabrique, pour que deux magasins ne partagent rien. */
const emptyData = () => ({ version: 1, users: {}, seenEvents: [] });

/**
 * Ouvre (ou crée) le magasin de droits.
 * @param {string} file chemin du fichier JSON
 */
export async function createStore(file) {
  let data = emptyData();
  try {
    data = { ...data, ...JSON.parse(await readFile(file, 'utf8')) };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // Premier démarrage : normal.
  }

  // Les écritures sont sérialisées : deux webhooks simultanés ne peuvent
  // pas s'écraser l'un l'autre.
  let writing = Promise.resolve();
  function persist() {
    const snapshot = JSON.stringify(data);
    writing = writing.then(async () => {
      await mkdir(dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await writeFile(tmp, snapshot);
      await rename(tmp, file);
    });
    return writing;
  }

  function userOf(appUserId) {
    if (!data.users[appUserId]) {
      data.users[appUserId] = { productIds: [], updatedAt: null, lastEventType: null };
    }
    return data.users[appUserId];
  }

  return {
    /** Droits d'un utilisateur. Toujours un objet, même inconnu. */
    entitlements(appUserId) {
      const user = data.users[appUserId];
      return {
        appUserId,
        productIds: user ? [...user.productIds] : [],
        updatedAt: user?.updatedAt ?? null,
      };
    },

    /**
     * Applique un événement RevenueCat.
     * @returns {Promise<{applied: boolean, reason?: string, appUserId?: string, productIds?: string[]}>}
     */
    async applyEvent(event) {
      const appUserId = event?.app_user_id ?? event?.original_app_user_id;
      const productId = event?.product_id;
      const type = event?.type;

      if (!appUserId || !type) return { applied: false, reason: 'événement incomplet' };
      if (event.id && data.seenEvents.includes(event.id)) {
        return { applied: false, reason: 'déjà traité', appUserId };
      }

      let changed = false;
      const user = userOf(appUserId);

      // Pour un achat définitif, RevenueCat signale un remboursement par un
      // CANCELLATION dont la raison n'est pas un simple désabonnement.
      const revokes =
        REVOKING.has(type) || (type === 'CANCELLATION' && event.cancel_reason !== 'UNSUBSCRIBE');

      if (productId && GRANTING.has(type) && !user.productIds.includes(productId)) {
        user.productIds.push(productId);
        changed = true;
      } else if (productId && revokes && user.productIds.includes(productId)) {
        user.productIds = user.productIds.filter((id) => id !== productId);
        changed = true;
      } else if (type === 'TRANSFER') {
        // Changement de compte store : les droits suivent le nouvel
        // identifiant. RevenueCat fournit les deux listes.
        changed = transfer(event) || changed;
      }

      if (event.id) {
        data.seenEvents.push(event.id);
        if (data.seenEvents.length > SEEN_EVENTS_KEPT) {
          data.seenEvents = data.seenEvents.slice(-SEEN_EVENTS_KEPT);
        }
      }
      user.updatedAt = new Date().toISOString();
      user.lastEventType = type;
      await persist();

      return {
        applied: true,
        changed,
        appUserId,
        productIds: [...userOf(appUserId).productIds],
      };
    },

    /** Enregistre un achat vérifié directement auprès de Google Play. */
    async grant(appUserId, productId, details = {}) {
      const user = userOf(appUserId);
      if (!user.productIds.includes(productId)) user.productIds.push(productId);
      user.updatedAt = new Date().toISOString();
      user.lastEventType = 'GOOGLE_PLAY_VERIFIED';
      if (details.orderId) user.lastOrderId = details.orderId;
      await persist();
      return { appUserId, productIds: [...user.productIds] };
    },

    /** Vue brute, pour les tests et un éventuel export. */
    snapshot() {
      return JSON.parse(JSON.stringify(data));
    },

    /** Attend que les écritures en cours soient sur le disque. */
    flush() {
      return writing;
    },
  };

  function transfer(event) {
    const from = event.transferred_from ?? [];
    const to = event.transferred_to ?? [];
    const moved = new Set();
    for (const id of from) for (const p of data.users[id]?.productIds ?? []) moved.add(p);
    if (moved.size === 0) return false;
    for (const id of to) {
      const user = userOf(id);
      for (const p of moved) if (!user.productIds.includes(p)) user.productIds.push(p);
      user.updatedAt = new Date().toISOString();
    }
    for (const id of from) if (data.users[id]) data.users[id].productIds = [];
    return true;
  }
}
