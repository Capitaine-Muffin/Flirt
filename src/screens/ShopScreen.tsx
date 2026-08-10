/**
 * « Bientôt » — la vitrine des packs à venir.
 *
 * Version 1.0 (première sortie sur les stores) : Flirt est entièrement
 * gratuit, sans compte et sans publicité. Les packs plus intenses sont
 * annoncés ici, mais ne sont pas encore achetables — la couche d'achats
 * in-app (Play Billing) arrivera dans une mise à jour. Aucun prix n'est
 * affiché tant que les produits n'existent pas réellement.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FREE_PACKS, PREMIUM_PACKS } from '../data/questions';
import { ScreenProps } from '../navigation';
import { colors, font, radius, spacing } from '../theme';

const FREE_QUESTION_COUNT = FREE_PACKS.reduce((n, p) => n + p.questions.length, 0);

export default function ShopScreen(_props: ScreenProps<'Shop'>) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            Tout est gratuit
            <Text style={styles.introDot}>.</Text>
          </Text>
          <Text style={styles.introText}>
            Les {FREE_PACKS.length} thèmes de l'app, soit {FREE_QUESTION_COUNT} questions,
            sont ouverts à tout le monde. Pas de compte, pas de publicité, rien à payer.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Bientôt dans l'app</Text>
        <Text style={styles.sectionText}>
          {PREMIUM_PACKS.length} nouveaux packs sont en préparation, un cran plus
          intenses. Ils arriveront par une simple mise à jour.
        </Text>

        {PREMIUM_PACKS.map((pack) => (
          <View key={pack.id} style={styles.packRow}>
            <Text style={styles.packEmoji}>{pack.emoji}</Text>
            <View style={styles.packInfo}>
              <Text style={styles.packTitle}>{pack.title}</Text>
              <Text style={styles.packDescription}>{pack.description}</Text>
            </View>
            <Text style={styles.soon}>Bientôt</Text>
          </View>
        ))}

        <Text style={styles.footnote}>
          Merci d'être là si tôt 💛
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  intro: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  introTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: '800' },
  introDot: { color: colors.primary },
  introText: {
    color: colors.textMuted,
    fontSize: font.body,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.subtitle,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  sectionText: {
    color: colors.textMuted,
    fontSize: font.small,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    opacity: 0.85,
  },
  packEmoji: { fontSize: 30, marginRight: spacing.md },
  packInfo: { flex: 1 },
  packTitle: { color: colors.text, fontSize: font.body, fontWeight: '700' },
  packDescription: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  soon: {
    color: colors.primary,
    fontSize: font.small,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  footnote: {
    color: colors.textMuted,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: spacing.lg,
    opacity: 0.8,
  },
});
