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
  interstitialAndroid: 'ca-app-pub-3940256099942544/1033173712',
  interstitialIos: 'ca-app-pub-3940256099942544/4411468910',
};

/** Les pubs sont-elles activées ? (désactivées dès que premium est acheté) */
export function adsEnabled(isPremium: boolean): boolean {
  return !isPremium;
}

/**
 * Interstitiel de fin de session : affiché quand on quitte le jeu pour
 * revenir à l'accueil (fin de pioche ou bouton Quitter). C'est le seul
 * moment où une pub plein écran est acceptable — le date est terminé,
 * elle ne casse plus le rythme. Format AdMob : vidéo/plein écran de
 * 5 à 30 s, passable après 5 s (~5-15 € CPM contre 0,5-2 € en bannière).
 *
 * Plafond de fréquence : au plus un interstitiel toutes les 10 minutes,
 * sinon les désinstallations et mauvaises notes annulent le gain.
 */
const INTERSTITIAL_COOLDOWN_MS = 10 * 60 * 1000;
let lastInterstitialAt = 0;

/**
 * À appeler quand l'utilisateur quitte l'écran de jeu. Renvoie true si
 * un interstitiel doit être montré (et arme le plafond de fréquence).
 * En production : si true, appeler InterstitialAd.show() de
 * react-native-google-mobile-ads (précharger l'annonce au lancement de
 * la partie pour qu'elle soit prête à l'affichage).
 */
export function shouldShowInterstitialOnGameExit(isPremium: boolean): boolean {
  if (isPremium) return false;
  const now = Date.now();
  if (now - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return false;
  lastInterstitialAt = now;
  return true;
}
