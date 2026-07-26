/**
 * Couche d'abstraction des achats in-app.
 *
 * Modèle économique de Flirt :
 *  - App gratuite avec une bannière de pub discrète sur les écrans de menu
 *    (JAMAIS pendant une partie, pour ne pas casser le rythme du date).
 *  - « Flirt Premium à vie » (achat unique ≈ 4,99 €) : supprime les pubs.
 *  - Packs de questions premium (≈ 1,99 € chacun).
 *  - Bundle « Tout Flirt » (≈ 9,99 €) : premium + tous les packs.
 *
 * Cette implémentation est un mock local qui simule un achat réussi, afin
 * que toute l'app (boutique, verrouillage des packs, suppression des pubs)
 * fonctionne de bout en bout en développement.
 *
 * INTÉGRATION PRODUCTION — remplacer le corps de `purchaseProduct` et
 * `restorePurchases` par RevenueCat (recommandé, gère App Store + Play
 * Store avec une seule API) :
 *
 *   npx expo install react-native-purchases
 *
 *   import Purchases from 'react-native-purchases';
 *   Purchases.configure({ apiKey: '<clé publique RevenueCat>' });
 *   const { customerInfo } = await Purchases.purchaseStoreProduct(product);
 *
 * Les identifiants produits à déclarer dans App Store Connect / Play
 * Console sont ceux de `PRODUCT_IDS` et des `productId` de chaque pack
 * (src/data/questions.ts).
 */

export interface Product {
  id: string;
  /** Prix affiché. En production, il vient du store (localisé). */
  displayPrice: string;
}

/**
 * Prix indicatifs utilisés par le mock ; les stores font foi en prod.
 * Stratégie de LANCEMENT (volume et avis avant marge) : packs à 0,99 €
 * pour l'achat impulsif, escalier 0,99 → 2,99 (sans pub) → 4,99 (tout).
 * Les prix pourront remonter (packs à 1,99 €) depuis App Store Connect /
 * Play Console une fois la base installée, sans mise à jour de l'app.
 */
export const MOCK_PRICES: Record<string, string> = {
  flirt_premium_lifetime: '2,99 €',
  flirt_bundle_tout: '4,99 €',
  flirt_pack_coeur: '0,99 €',
  flirt_pack_hot: '0,99 €',
  flirt_pack_vraiment_hot: '0,99 €',
  flirt_pack_dilemmes: '0,99 €',
  flirt_pack_couple: '0,99 €',
};

export interface PurchaseResult {
  success: boolean;
  productId: string;
  error?: string;
}

/**
 * Lance le flux d'achat natif pour un produit.
 * Mock : résout toujours avec succès après un court délai.
 */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true, productId };
}

/**
 * Restaure les achats précédents (obligatoire pour la validation App Store).
 * Mock : ne restaure rien ; en prod, renvoyer la liste des productIds actifs.
 */
export async function restorePurchases(): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return [];
}

export function getDisplayPrice(productId: string): string {
  return MOCK_PRICES[productId] ?? '—';
}
