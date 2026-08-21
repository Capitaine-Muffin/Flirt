/**
 * Branchement natif des achats in-app, via RevenueCat.
 *
 * Ce fichier est le SEUL endroit qui parle au SDK natif. Il est chargé
 * paresseusement : si `react-native-purchases` n'est pas installé (Expo Go,
 * démo web, tests), tout renvoie « indisponible » et l'app retombe sur la
 * simulation de src/services/purchases.ts. C'est ce qui permet de garder
 * l'app lançable dans Expo Go tout en embarquant la vraie facturation dans
 * les builds EAS.
 *
 * Pourquoi RevenueCat plutôt que le SDK Play directement : c'est lui, le
 * « backend » des achats. Il valide les reçus côté serveur, mémorise qui
 * possède quoi (donc la restauration marche après réinstallation ou
 * changement de téléphone), gère les remboursements, et parle à Play comme
 * à l'App Store avec la même API. Gratuit jusqu'à ~2 500 $ de revenus
 * mensuels. Voir docs/ACHATS_INTEGRES.md.
 *
 * Installation (au moment du premier build EAS, pas avant) :
 *   npx expo install react-native-purchases
 *
 * Tant qu'il n'est pas installé, metro.config.js le remplace par un module
 * vide — sans quoi la compilation échouerait sur un `require` introuvable.
 */
import { Platform } from 'react-native';
import {
  ENTITLEMENTS,
  PURCHASES_LOG_LEVEL,
  REVENUECAT_KEY_ANDROID,
  REVENUECAT_KEY_IOS,
} from '../config/monetization';

// `require` conditionnel : un import statique planterait au démarrage
// quand le module natif n'est pas là.
declare function require(name: string): any;

export interface StoreProduct {
  productId: string;
  /** Prix localisé fourni par le store, ex. « 0,99 € ». */
  displayPrice: string;
  /** Le même prix en centimes, pour comparer les offres entre elles. */
  priceCents: number;
}

/**
 * Catégorie à passer à `getProducts`. Sans elle, le SDK interroge les
 * **abonnements** — c'est son défaut — et Play ne renvoie rien, puisque les
 * produits de Flirt sont tous des achats uniques. L'app affichait alors
 * « Ce produit n'est pas disponible sur votre compte » pour chaque achat.
 *
 * On passe la chaîne en dur plutôt que l'énumération `PRODUCT_CATEGORY` :
 * le SDK est chargé par un `require` conditionnel (voir `loadNative`), donc
 * un import statique planterait quand le module natif est absent.
 */
const ACHAT_UNIQUE = 'NON_SUBSCRIPTION';

export type NativePurchaseOutcome =
  | { status: 'success'; productIds: string[] }
  | { status: 'cancelled' }
  | { status: 'error'; error: string };

let nativeModule: any = null;
let nativeLogLevel: any = null;
let loadAttempted = false;
let configured = false;

function loadNative(): any {
  if (!loadAttempted) {
    loadAttempted = true;
    try {
      const mod = require('react-native-purchases');
      const candidate = mod?.default ?? mod;
      // Module vide (Expo Go) ou SDK sans son module natif : on vérifie
      // qu'on a bien affaire à la vraie bibliothèque avant de s'y fier.
      nativeModule = typeof candidate?.configure === 'function' ? candidate : null;
      nativeLogLevel = mod?.LOG_LEVEL ?? null;
    } catch {
      nativeModule = null; // Module natif absent : c'est prévu, on simule.
    }
  }
  return nativeModule;
}

function apiKey(): string {
  return Platform.OS === 'ios' ? REVENUECAT_KEY_IOS : REVENUECAT_KEY_ANDROID;
}

/** Le vrai paiement est-il branchable ici (module natif + clé) ? */
export function isSupported(): boolean {
  return Platform.OS !== 'web' && !!loadNative() && apiKey() !== '';
}

/**
 * Initialise le SDK. À appeler une fois au démarrage de l'app.
 * Renvoie `false` si on reste en simulation (et alors rien n'a été fait).
 */
export async function configure(): Promise<boolean> {
  if (configured) return true;
  if (!isSupported()) return false;

  const Purchases = loadNative();
  try {
    if (nativeLogLevel) await Purchases.setLogLevel(nativeLogLevel[PURCHASES_LOG_LEVEL]);
    // Pas d'`appUserID` : RevenueCat génère un identifiant anonyme et le
    // rattache au compte du store. L'app n'a donc aucun compte à créer,
    // aucune donnée personnelle à demander.
    await Purchases.configure({ apiKey: apiKey() });
    configured = true;
    return true;
  } catch {
    return false;
  }
}

/** Prix localisés fournis par le store pour les produits demandés. */
export async function fetchProducts(productIds: string[]): Promise<StoreProduct[]> {
  if (!configured) return [];
  try {
    const products = await loadNative().getProducts(productIds, ACHAT_UNIQUE);
    return (products ?? []).map((p: any) => ({
      productId: baseProductId(p.identifier),
      displayPrice: p.priceString,
      priceCents: Math.round((p.price ?? 0) * 100),
    }));
  } catch {
    return [];
  }
}

/** Lance le flux d'achat natif (feuille Google Play / App Store). */
export async function purchase(productId: string): Promise<NativePurchaseOutcome> {
  if (!configured) return { status: 'error', error: 'Achats indisponibles.' };

  const Purchases = loadNative();
  try {
    const products = await Purchases.getProducts([productId], ACHAT_UNIQUE);
    const product = (products ?? []).find(
      (p: any) => baseProductId(p.identifier) === productId,
    );
    if (!product) {
      return { status: 'error', error: "Ce produit n'est pas disponible sur votre compte." };
    }
    const { customerInfo } = await Purchases.purchaseStoreProduct(product);
    return { status: 'success', productIds: ownedFrom(customerInfo) };
  } catch (e: any) {
    // Annulation : l'utilisateur a fermé la feuille de paiement. Ce n'est
    // pas une erreur, on ne lui affiche rien.
    if (e?.userCancelled) return { status: 'cancelled' };
    return { status: 'error', error: humanError(e) };
  }
}

/** Restaure les achats rattachés au compte du store. */
export async function restore(): Promise<string[]> {
  if (!configured) return [];
  try {
    return ownedFrom(await loadNative().restorePurchases());
  } catch {
    return [];
  }
}

/**
 * Ce que possède l'utilisateur, d'après RevenueCat (source de vérité).
 *
 * Renvoie `null` — et non une liste vide — quand le store n'a pas répondu :
 * l'appelant remplace sa liste d'achats par celle-ci, et confondre « cet
 * utilisateur ne possède rien » avec « on n'a pas pu demander » retirerait
 * ses achats à quelqu'un hors ligne.
 */
export async function activeProductIds(): Promise<string[] | null> {
  if (!configured) return null;
  try {
    return ownedFrom(await loadNative().getCustomerInfo());
  } catch {
    return null;
  }
}

/**
 * Traduit un `customerInfo` RevenueCat en liste d'identifiants produits.
 *
 * Seuls les **droits actifs** font foi. Les autres listes que renvoie
 * RevenueCat (`allPurchasedProductIdentifiers`,
 * `nonSubscriptionTransactions`) sont un historique : un achat remboursé y
 * reste inscrit pour toujours. S'en servir laissait le contenu débloqué
 * après un remboursement — on pouvait payer, se faire rembourser, et tout
 * garder.
 *
 * Conséquence : chaque produit vendu doit être rattaché à un droit dans le
 * tableau de bord RevenueCat, sinon son acheteur n'obtient rien. La
 * correspondance droit → produits est dans `config/monetization.ts`.
 */
function ownedFrom(customerInfo: any): string[] {
  const owned = new Set<string>();

  for (const entitlementId of Object.keys(customerInfo?.entitlements?.active ?? {})) {
    for (const productId of ENTITLEMENTS[entitlementId] ?? []) owned.add(productId);
  }

  return [...owned];
}

/**
 * L'identifiant produit seul, sans l'option d'achat que Play accole
 * derrière deux points (`flirt_premium_lifetime:standard`). Le reste de
 * l'app ne connaît que la partie de gauche : sans ce nettoyage, un achat
 * réel ne serait pas reconnu et le joueur aurait payé pour rien.
 */
function baseProductId(identifier: string): string {
  return identifier.split(':')[0];
}

/** Message d'erreur lisible, en français, à partir d'une erreur du SDK. */
function humanError(e: any): string {
  const code = String(e?.code ?? e?.userInfo?.readableErrorCode ?? '');
  if (/NETWORK/i.test(code)) return 'Connexion impossible. Réessayez dans un instant.';
  if (/PRODUCT_ALREADY_PURCHASED/i.test(code)) {
    return 'Vous possédez déjà cet achat — utilisez « Restaurer mes achats ».';
  }
  if (/PURCHASE_NOT_ALLOWED|PAYMENT_PENDING/i.test(code)) {
    return "Le paiement n'a pas pu aboutir sur ce compte.";
  }
  return "L'achat n'a pas pu être finalisé.";
}
