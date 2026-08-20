/**
 * Choix d'un thème : une pression lance immédiatement une partie.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PackCard from '../components/PackCard';
import { PACKS } from '../data/questions';
import { ScreenProps } from '../navigation';
import { useApp } from '../state/AppContext';
import { colors, font, spacing } from '../theme';

export default function SetupScreen({ navigation }: ScreenProps<'Setup'>) {
  const { isPackUnlocked } = useApp();

  const openPack = (packId: string) => {
    if (!isPackUnlocked(packId)) {
      navigation.navigate('Shop');
      return;
    }
    navigation.navigate('Game', { packIds: [packId] });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Choisissez un thème</Text>
        {PACKS.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            unlocked={isPackUnlocked(pack.id)}
            onPress={() => openPack(pack.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: {
    color: colors.text,
    fontSize: font.subtitle,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
