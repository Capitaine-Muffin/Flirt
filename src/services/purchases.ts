/**
 * Achats in-app : l'API utilisée par le reste de l'app.
 *
 * Modèle économique de Flirt :
 *  - App gratuite avec une bannière de pub discrète sur les écrans de menu
 *    (JAMAIS pendant une partie, pour ne pas casser le rythme du date).
 *  - « Flirt Premium à vie » (achat unique) : supprime les pubs.
 *  - Packs de questions premium, à l'unité.
 *  - Bundle « Tout Flirt » : premium + tous les packs.
 *
 * Deux modes, choisis automatiquement au démarrage :
 *
 *  1. **Réel** — le module natif `react-native-purchases` est présent et une
 *     clé RevenueCat est configurée : les prix viennent du store (localisés),
 *     les paiements passent par Google Play / l'App Store, et RevenueCat
 *     mémorise les achats (restauration après réinstallation).
 *  2. **Simulation** — sinon (Expo Go, tests) : les prix ci-dessous servent
 *     de repli et un « achat » réussit immédiatement, ce qui permet de
 *     dérouler toute la boutique sans build natif.
 *
 * Rien ne change dans l'app entre les deux modes : c'est le même contrat.
 * Voir docs/ACHATS_INTEGRES.md pour la mise en service.
 */
import { PREMIUM_PACKS, PRODUCT_IDS } from '../data/questions';
import * as native from './purchases.revenuecat';

/** Tous les identifiants produits à déclarer dans les consoles des stores. */
export const ALL_PRODUCT_IDS: string[] = [
  PRODUCT_IDS.PREMIUM_LIFETIME,
  PRODUCT_IDS.BUNDLE_ALL,
  ...PREMIUM_PACKS.map((p) => p.productId!).filter(Boolean),
];

/**
 * Prix de repli, utilisés tant que le store n'a pas répondu (et en
 * simulation). En production, c'est TOUJOURS le prix du store qui
 * s'affiche : lui seul est localisé, converti et à jour.
 *
 * Stratégie de LANCEMENT (volume et avis avant marge) : packs à 0,99 €
 * pour l'achat impulsif, escalier 0,99 → 2,99 (sans pub) → 4,99 (tout).
 * Ces prix pourront évoluer depuis la Play Console sans mise à jour de
 * l'app.
 */
export const FALLBACK_PRICE_CENTS: Record<string, number> = {
  flirt_premium_lifetime: 299,
  flirt_bundle_tout: 499,
  flirt_pack_coeur: 99,
  flirt_pack_hot: 99,
  flirt_pack_dilemmes: 99,
  flirt_pack_couple: 99,
};

export const FALLBACK_PRICES: Record<string, string> = {
  flirt_premium_lifetime: '2,99 €',
  flirt_bundle_tout: '4,99 €',
  flirt_pack_coeur: '0,99 €',
  flirt_pack_hot: '0,99 €',
  flirt_pack_dilemmes: '0,99 €',
  flirt_pack_couple: '0,99 €',
};

export interface Product {
  id: string;
  /** Prix affiché, tel que fourni par le store quand il est disponible. */
  displayPrice: string;
  priceCents: number;
}

export interface PurchaseResult {
  success: boolean;
  productId: string;
  /** L'utilisateur a fermé la feuille de paiement : ne rien lui dire. */
  cancelled?: boolean;
  error?: string;
  /**
   * Tout ce que possède l'utilisateur après l'achat, d'après le store.
   * Sert à débloquer aussi les packs inclus dans un bundle.
   */
  ownedProductIds?: string[];
}

/** Prix reçus du store, remplis par `refreshPrices()`. */
const storePrices = new Map<string, Product>();
let live = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Prépare la facturation. À appeler une fois au démarrage de l'app.
 * Renvoie `true` si les vrais paiements sont actifs.
 */
export function initPurchases(): Promise<boolean> {
  if (!initPromise) {
    initPromise = native
      .configure()
      .then(async (ok) => {
        live = ok;
        if (ok) await loadPrices();
        return ok;
      })
      .catch(() => false);
  }
  return initPromise;
}

/** Les paiements réels sont-ils actifs (sinon : simulation) ? */
export function isBillingLive(): boolean {
  return live;
}

/**
 * Récupère les prix localisés du store. Attend l'initialisation, pour que
 * la boutique affiche les bons prix même si elle s'ouvre pendant celle-ci.
 * Sans effet en simulation.
 */
export async function refreshPrices(): Promise<void> {
  if (!(await initPurchases())) return;
  await loadPrices();
}

async function loadPrices(): Promise<void> {
  for (const product of await native.fetchProducts(ALL_PRODUCT_IDS)) {
    storePrices.set(product.productId, {
      id: product.productId,
      displayPrice: product.displayPrice,
      priceCents: product.priceCents,
    });
  }
}

/** Prix à afficher : celui du store s'il est connu, sinon le repli. */
export function getDisplayPrice(productId: string): string {
  return storePrices.get(productId)?.displayPrice ?? FALLBACK_PRICES[productId] ?? '—';
}

/** Prix en centimes, pour comparer les offres entre elles. */
export function getPriceCents(productId: string): number {
  return storePrices.get(productId)?.priceCents ?? FALLBACK_PRICE_CENTS[productId] ?? 0;
}

/** Lance le flux d'achat pour un produit. */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  if (!live) {
    // Une clé est configurée : ce build est censé facturer pour de vrai.
    // Si l'initialisation a échoué (réseau, store indisponible), on refuse
    // l'achat — offrir le produit gratuitement serait pire que l'erreur.
    if (native.isSupported()) {
      return {
        success: false,
        productId,
        error: "Les achats sont momentanément indisponibles. Réessayez plus tard.",
      };
    }

    // Aucune clé : build de développement, simulation assumée.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, productId, ownedProductIds: [productId] };
  }

  const outcome = await native.purchase(productId);
  if (outcome.status === 'success') {
    return { success: true, productId, ownedProductIds: outcome.productIds };
  }
  if (outcome.status === 'cancelled') {
    return { success: false, productId, cancelled: true };
  }
  return { success: false, productId, error: outcome.error };
}

/**
 * Restaure les achats précédents. Obligatoire pour la validation des deux
 * stores : un achat définitif doit se retrouver après une réinstallation.
 */
export async function restorePurchases(): Promise<string[]> {
  if (!live) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return [];
  }
  return native.restore();
}

/**
 * Prévient quand les achats changent sans que l'app y soit pour quelque
 * chose : remboursement accordé par Google, achat fait depuis un autre
 * appareil. Renvoie la fonction de désabonnement.
 */
export function subscribeToOwnedProducts(
  onChange: (productIds: string[]) => void,
): () => void {
  if (!live) return () => {};
  return native.subscribeToOwnedProducts(onChange);
}

/**
 * Ce que possède l'utilisateur d'après le store. Appelé au démarrage :
 * le store fait foi, la sauvegarde locale n'est qu'un cache.
 *
 * `null` signifie « pas de réponse du store » (simulation, hors ligne) :
 * l'app garde alors son cache au lieu de le vider.
 */
export async function getActiveProductIds(): Promise<string[] | null> {
  if (!live) return null;
  return native.activeProductIds();
}
