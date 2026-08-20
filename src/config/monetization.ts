/**
 * Configuration de la monétisation.
 *
 * Une seule source de vérité pour : les identifiants produits déclarés
 * dans la Play Console / App Store Connect, les « droits » (entitlements)
 * RevenueCat, et les clés d'API publiques.
 *
 * Les clés ne sont PAS écrites dans le dépôt : elles arrivent par des
 * variables d'environnement `EXPO_PUBLIC_*` (inlinées à la compilation par
 * Metro, y compris sur EAS Build — voir docs/ACHATS_INTEGRES.md). Sans
 * clé, l'app reste en mode simulation : elle tourne dans Expo Go, la
 * boutique fonctionne, mais aucun vrai paiement n'est déclenché.
 *
 * Ces clés RevenueCat sont *publiques* (elles vivent dans l'app installée,
 * donc lisibles) : elles ne servent qu'à identifier l'app, pas à autoriser
 * quoi que ce soit de sensible. La clé secrète, elle, ne doit jamais
 * quitter le serveur (voir server/).
 */

// `process.env.EXPO_PUBLIC_…` est remplacé littéralement par Metro au
// moment du bundle ; la déclaration ci-dessous ne sert qu'à TypeScript.
declare const process: { env: Record<string, string | undefined> };

/** Clé publique RevenueCat pour Android (Play Store). */
export const REVENUECAT_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_KEY_ANDROID ?? '';

/** Clé publique RevenueCat pour iOS (App Store) — pour la sortie iOS. */
export const REVENUECAT_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_KEY_IOS ?? '';

/**
 * Droits (entitlements) déclarés dans RevenueCat, et ce qu'ils débloquent.
 * Un droit est une clé stable côté RevenueCat ; plusieurs produits peuvent
 * l'accorder (ex. : le bundle et le premium donnent tous deux `premium`).
 *
 * Utile si un jour on change les identifiants produits ou les prix : le
 * code continue de raisonner en droits, pas en références de vente.
 */
export const ENTITLEMENTS: Record<string, string[]> = {
  /** Plus de publicité. */
  premium: ['flirt_premium_lifetime'],
  /** Tout : premium + les cinq packs. */
  tout: [
    'flirt_premium_lifetime',
    'flirt_bundle_tout',
    'flirt_pack_coeur',
    'flirt_pack_hot',
    'flirt_pack_dilemmes',
    'flirt_pack_couple',
  ],
};

/**
 * Niveau de journalisation RevenueCat. `DEBUG` en développement pour voir
 * passer les achats dans la console, `ERROR` en production.
 */
export const PURCHASES_LOG_LEVEL: 'DEBUG' | 'ERROR' = __DEV__ ? 'DEBUG' : 'ERROR';
