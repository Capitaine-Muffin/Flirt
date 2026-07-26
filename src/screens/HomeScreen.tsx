import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdBanner from '../components/AdBanner';
import Button from '../components/Button';
import { ScreenProps } from '../navigation';
import { useApp } from '../state/AppContext';
import { colors, font, spacing } from '../theme';

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { isPremium } = useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.logo}>💘</Text>
        <Text style={styles.title}>Flirt</Text>
        <Text style={styles.tagline}>
          Le jeu qui transforme un date{'\n'}en vraie rencontre.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Commencer une partie" onPress={() => navigation.navigate('Setup')} />
        <Button
          label={isPremium ? 'Boutique · Packs de questions' : 'Boutique · Premium & Packs'}
          variant="secondary"
          onPress={() => navigation.navigate('Shop')}
          style={styles.secondaryAction}
        />
        {isPremium && <Text style={styles.premiumBadge}>✨ Premium à vie activé — merci !</Text>}
      </View>

      <View style={styles.footer}>
        <Text style={styles.howTo}>
          Posez votre téléphone entre vous deux,{'\n'}répondez à tour de rôle, et laissez la
          magie opérer.
        </Text>
        <AdBanner />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 72 },
  title: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: spacing.sm,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  actions: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  secondaryAction: { marginTop: spacing.sm },
  premiumBadge: {
    color: colors.gold,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: { marginTop: spacing.xl },
  howTo: {
    color: colors.textMuted,
    fontSize: font.small,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
});
