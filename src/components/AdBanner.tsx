/**
 * Emplacement de bannière publicitaire.
 *
 * Ne s'affiche que pour les utilisateurs non premium, et uniquement sur les
 * écrans de menu — jamais pendant une partie. En production, remplacer le
 * contenu par un <BannerAd> de react-native-google-mobile-ads
 * (voir src/services/ads.ts pour les instructions complètes).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adsEnabled } from '../services/ads';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

export default function AdBanner() {
  const { isPremium } = useApp();
  if (!adsEnabled(isPremium)) return null;

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
