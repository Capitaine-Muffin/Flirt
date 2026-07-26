/**
 * Emplacement de bannière publicitaire.
 *
 * Ne s'affiche que pour les utilisateurs non premium. Deux variantes :
 * la normale (accueil, boutique) et la `compact` (une ligne fine sous la
 * carte pendant le jeu — discrète, elle ne coupe jamais rien). En
 * production, remplacer le contenu par un <BannerAd> de
 * react-native-google-mobile-ads (voir src/services/ads.ts).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adsEnabled } from '../services/ads';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

export default function AdBanner({ compact = false }: { compact?: boolean }) {
  const { isPremium } = useApp();
  if (!adsEnabled(isPremium)) return null;

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
