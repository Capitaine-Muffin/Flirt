/**
 * Couche d'abstraction publicité.
 *
 * Règle d'or de Flirt : AUCUNE pub pendant une partie. Un date a un rythme,
 * une interstitielle au milieu d'une question le briserait. Les bannières
 * n'apparaissent que sur les écrans de menu (accueil, boutique), et
 * uniquement pour les utilisateurs non premium.
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
