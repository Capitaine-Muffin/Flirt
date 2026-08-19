/**
 * Configuration Expo dynamique.
 *
 * `app.json` reste la source des valeurs stables ; ce fichier n'ajoute
 * qu'une chose : le plugin AdMob, et seulement quand la bibliothèque est
 * installée **et** qu'un App ID est fourni.
 *
 * Pourquoi ne pas l'écrire directement dans `app.json` : un plugin déclaré
 * mais non installé fait échouer `expo start`, ce qui casserait le
 * développement dans Expo Go — où la pub n'existe de toute façon pas.
 *
 * L'App ID AdMob (`ca-app-pub-…~…`) doit être inscrit dans le manifeste au
 * moment du build : il ne s'ajoute pas après coup depuis une console. Le
 * fournir à EAS, jamais au dépôt :
 *
 *   eas secret:create --name EXPO_PUBLIC_ADMOB_APP_ID_ANDROID --value ca-app-pub-xxx~yyy
 */
const ADMOB_MODULE = 'react-native-google-mobile-ads';

module.exports = ({ config }) => {
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS;

  // Pas d'App ID : app inchangée, les bannières restent simulées.
  if (!androidAppId && !iosAppId) return config;

  try {
    require.resolve(ADMOB_MODULE);
  } catch {
    console.warn(
      `[flirt] App ID AdMob fourni mais ${ADMOB_MODULE} n'est pas installé : ` +
        'la publicité restera simulée. → npx expo install ' +
        ADMOB_MODULE,
    );
    return config;
  }

  const admob = {};
  if (androidAppId) admob.androidAppId = androidAppId;
  if (iosAppId) admob.iosAppId = iosAppId;

  return { ...config, plugins: [...(config.plugins ?? []), [ADMOB_MODULE, admob]] };
};
