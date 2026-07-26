/**
 * Couche d'abstraction publicité.
 *
 * Règle d'or de Flirt : la pub ne COUPE jamais rien. Aucun interstitiel,
 * aucune vidéo, aucun plein écran — uniquement des bannières discrètes
 * qui laissent l'app chic : accueil, boutique, et une bannière fine sous
 * la carte pendant le jeu. Toutes disparaissent avec le Premium.
 *
 * INTÉGRATION PRODUCTION — Google AdMob :
 *
 *   npx expo install react-native-google-mobile-ads
 *
 * puis dans app.json :
 *   "plugins": [["react-native-google-mobile-ads", {
 *     "androidAppId": "ca-app-pub-xxx~yyy",
 *     "iosAppId": "ca-app-pub-xxx~zzz"
 *   }]]
 *
 * et remplacer le composant AdBanner (src/components/AdBanner.tsx) par un
 * vrai <BannerAd size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} …/>.
 */

/** IDs de test AdMob — à remplacer par les vrais IDs de blocs d'annonces. */
export const AD_UNIT_IDS = {
  bannerAndroid: 'ca-app-pub-3940256099942544/6300978111',
  bannerIos: 'ca-app-pub-3940256099942544/2934735716',
};

/** Les pubs sont-elles activées ? (désactivées dès que premium est acheté) */
export function adsEnabled(isPremium: boolean): boolean {
  return !isPremium;
}
