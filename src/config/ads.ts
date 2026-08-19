/**
 * Configuration de la publicité.
 *
 * Comme pour les achats (voir monetization.ts), rien de tout ceci n'est
 * écrit dans le dépôt : les identifiants arrivent par des variables
 * `EXPO_PUBLIC_*`, inlinées à la compilation par Metro et fournies à EAS
 * Build par `eas secret:create`. Sans identifiant, l'app affiche les
 * bannières de test de Google — jamais de vraies annonces.
 *
 * Deux familles d'identifiants, à ne pas confondre :
 *  - l'**App ID** (`ca-app-pub-…~…`, avec un tilde) doit être inscrit dans
 *    le manifeste au moment du build : il est lu par app.config.js ;
 *  - les **blocs d'annonces** (`ca-app-pub-…/…`, avec une barre oblique)
 *    sont demandés à l'exécution, c'est ce fichier qui les fournit.
 */

// Remplacé littéralement par Metro au moment du bundle.
declare const process: { env: Record<string, string | undefined> };

/**
 * Blocs de test publiés par Google. Les utiliser en développement est
 * obligatoire : demander de vraies annonces depuis un build de test fait
 * fermer le compte AdMob pour clics invalides.
 */
export const TEST_BANNER_UNIT_ID = {
  android: 'ca-app-pub-3940256099942544/6300978111',
  ios: 'ca-app-pub-3940256099942544/2934735716',
};

/** Blocs réels, créés dans AdMob. Vides tant qu'ils ne sont pas fournis. */
export const BANNER_UNIT_ID = {
  android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? '',
  ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS ?? '',
};

/**
 * En développement, on force les blocs de test même si les vrais sont
 * configurés : c'est la règle d'AdMob, et c'est ce qui protège le compte.
 */
export const USE_TEST_ADS = __DEV__;
