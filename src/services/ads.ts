/**
 * Publicité : l'API utilisée par le reste de l'app.
 *
 * Règle d'or de Flirt : la pub ne COUPE jamais rien. Aucun interstitiel,
 * aucune vidéo, aucun plein écran — uniquement des bannières discrètes :
 * accueil, boutique, et une bannière fine sous la carte pendant le jeu.
 * Toutes disparaissent avec le Premium.
 *
 * Deux modes, comme pour les achats (voir services/purchases.ts) :
 *
 *  1. **Réel** — `react-native-google-mobile-ads` est installé (build EAS) :
 *     consentement RGPD demandé, puis vraies bannières AdMob.
 *  2. **Simulation** — sinon (Expo Go, démo web) : `AdBanner` affiche un
 *     cadre « Publicité » à la bonne place, sans rien charger.
 *
 * Installation (au moment du premier build EAS, pas avant) :
 *   npx expo install react-native-google-mobile-ads
 *
 * L'App ID AdMob est ajouté au manifeste par app.config.js. Tant que le
 * module n'est pas installé, metro.config.js le remplace par un module
 * vide — sans quoi la compilation échouerait sur un `require` introuvable.
 *
 * Voir docs/PUBLICITE.md.
 */
import { Platform } from 'react-native';
import { BANNER_UNIT_ID, TEST_BANNER_UNIT_ID, USE_TEST_ADS } from '../config/ads';

// `require` conditionnel : un import statique planterait au démarrage
// quand le module natif n'est pas là.
declare function require(name: string): any;

let nativeModule: any = null;
let loadAttempted = false;
let live = false;
let initPromise: Promise<boolean> | null = null;

/** Le SDK AdMob, ou `null` s'il n'est pas embarqué dans ce build. */
export function getNativeAds(): any {
  if (!loadAttempted) {
    loadAttempted = true;
    try {
      const mod = require('react-native-google-mobile-ads');
      // Module vide (Expo Go) : on vérifie qu'on a bien le vrai SDK.
      nativeModule = typeof mod?.default === 'function' && mod?.BannerAd ? mod : null;
    } catch {
      nativeModule = null; // Module natif absent : c'est prévu, on simule.
    }
  }
  return nativeModule;
}

/** Les pubs sont-elles activées ? (désactivées dès que premium est acheté) */
export function adsEnabled(isPremium: boolean): boolean {
  return !isPremium;
}

/** Le bloc d'annonces à demander pour la plateforme courante. */
export function getBannerUnitId(): string {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  if (USE_TEST_ADS) return TEST_BANNER_UNIT_ID[platform];
  return BANNER_UNIT_ID[platform] || TEST_BANNER_UNIT_ID[platform];
}

/** De vraies bannières peuvent-elles s'afficher ? */
export function areAdsLive(): boolean {
  return live;
}

/**
 * Prépare la publicité : consentement puis initialisation du SDK.
 * Appelé par `AdBanner`, donc seulement quand une bannière doit
 * réellement s'afficher — un utilisateur premium n'a pas à subir un
 * formulaire de consentement pour des pubs qu'il ne verra jamais.
 *
 * Renvoie `false` si on reste en simulation.
 */
export function initAds(): Promise<boolean> {
  if (!initPromise) {
    initPromise = start().catch(() => false);
  }
  return initPromise;
}

async function start(): Promise<boolean> {
  const ads = getNativeAds();
  if (!ads) return false;

  // Le consentement ajuste seulement pub personnalisée ou non : un
  // utilisateur qui refuse, ou qui ferme le formulaire sans choisir, a
  // quand même des pubs. Seuls les premium n'en ont pas.
  await gatherConsent(ads);

  await ads.default().initialize();
  live = true;
  return true;
}

/**
 * Recueille le consentement RGPD via la plateforme de messagerie de Google
 * (UMP). Obligatoire en Europe avant toute annonce personnalisée — son
 * résultat ne bloque plus l'affichage des pubs (voir `start`), seulement
 * leur personnalisation.
 */
async function gatherConsent(ads: any): Promise<boolean> {
  const { AdsConsent, AdsConsentStatus } = ads;
  if (!AdsConsent) return true; // SDK sans module de consentement.

  try {
    // En test, on trace l'état réel renvoyé par UMP : sans ça, un formulaire
    // qui ne s'affiche pas est indiscernable d'un formulaire refusé. Le
    // `reset` efface le choix mémorisé, sinon le premier lancement décide
    // pour tous les suivants et le formulaire ne réapparaît jamais.
    if (USE_TEST_ADS) {
      AdsConsent.reset?.();
      const before = await AdsConsent.requestInfoUpdate(consentOptions(ads));
      console.log('[flirt] consentement UMP', JSON.stringify(before));
    }

    // API récente : une seule fonction fait tout.
    if (typeof AdsConsent.gatherConsent === 'function') {
      const info = await AdsConsent.gatherConsent(consentOptions(ads));
      if (USE_TEST_ADS) console.log('[flirt] après formulaire', JSON.stringify(info));
      return info?.canRequestAds ?? true;
    }

    // API plus ancienne : demander l'état, puis afficher le formulaire.
    const info = await AdsConsent.requestInfoUpdate(consentOptions(ads));
    if (info?.isConsentFormAvailable && info?.status === AdsConsentStatus?.REQUIRED) {
      const result = await AdsConsent.showForm();
      return result?.status !== AdsConsentStatus?.REQUIRED;
    }
    return true;
  } catch (error) {
    if (USE_TEST_ADS) console.log('[flirt] consentement en échec', String(error));
    return false;
  }
}

/**
 * Options passées à UMP. En test, on fait croire au SDK que l'appareil est
 * dans l'EEE : sans ça, un émulateur est géolocalisé hors Europe et le
 * formulaire RGPD ne s'affiche jamais, impossible de le vérifier. En
 * production, aucune option : la vraie géolocalisation s'applique.
 */
function consentOptions(ads: any): Record<string, unknown> | undefined {
  if (!USE_TEST_ADS) return undefined;
  const eea = ads.AdsConsentDebugGeography?.EEA ?? 1;
  return { debugGeography: eea };
}

/**
 * Rouvre le formulaire UMP pour que l'utilisateur modifie ou retire son
 * consentement RGPD à tout moment (exigé par Google, pas seulement au
 * premier lancement). Renvoie `false` quand ce n'est pas possible — SDK
 * absent (Expo Go, démo web) ou aucun formulaire à proposer — et
 * l'appelant affiche alors un message adapté plutôt qu'un formulaire.
 */
export async function openPrivacyOptionsForm(): Promise<boolean> {
  const ads = getNativeAds();
  const { AdsConsent } = ads ?? {};
  if (!AdsConsent?.showPrivacyOptionsForm) return false;

  try {
    await AdsConsent.requestInfoUpdate();
    await AdsConsent.showPrivacyOptionsForm();
    return true;
  } catch {
    return false;
  }
}
