/**
 * Emplacement de bannière publicitaire.
 *
 * Ne s'affiche que pour les utilisateurs non premium. Deux variantes : la
 * normale (accueil, boutique) et la `compact` (une ligne fine sous la
 * carte pendant le jeu — discrète, elle ne coupe jamais rien).
 *
 * Quand le SDK AdMob est embarqué (build EAS), c'est une vraie bannière ;
 * sinon (Expo Go), un cadre qui tient la place. Voir services/ads.ts.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adsEnabled, getBannerUnitId, getNativeAds, initAds } from '../services/ads';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

export default function AdBanner({ compact = false }: { compact?: boolean }) {
  const { isPremium } = useApp();
  const enabled = adsEnabled(isPremium);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);

  // Le consentement et l'initialisation ne partent que si une bannière
  // doit vraiment s'afficher : un premium n'a rien à valider.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    initAds().then((ok) => {
      if (!cancelled) setLive(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) return null;

  if (live) {
    // En production, une annonce qui ne charge pas ne laisse rien : pas de
    // cadre gris à la place d'une bannière absente.
    if (failed) return null;
    const ads = getNativeAds();
    const BannerAd = ads.BannerAd;
    return (
      <View style={[styles.liveBanner, compact && styles.liveBannerCompact]}>
        <BannerAd
          unitId={getBannerUnitId()}
          size={ads.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdFailedToLoad={() => setFailed(true)}
        />
      </View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.container, styles.compact]}>
        <Text style={styles.label}>Publicité</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Publicité</Text>
      <Text style={styles.hint}>
        Passez en Premium pour une expérience sans pub 💛
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    alignItems: 'center',
  },
  compact: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  liveBanner: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveBannerCompact: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.small,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  hint: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: spacing.xs,
  },
});
