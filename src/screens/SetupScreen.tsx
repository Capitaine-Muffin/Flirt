/**
 * Préparation de la partie : le choix des packs.
 * Pensé pour être rempli en quelques secondes, en plein date.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import PackCard from '../components/PackCard';
import { PACKS } from '../data/questions';
import { ScreenProps } from '../navigation';
import { useApp } from '../state/AppContext';
import { colors, font, spacing } from '../theme';

export default function SetupScreen({ navigation }: ScreenProps<'Setup'>) {
  const { isPackUnlocked } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    PACKS.filter((p) => !p.premium).map((p) => p.id),
  );

  const togglePack = (packId: string) => {
    if (!isPackUnlocked(packId)) {
      navigation.navigate('Shop');
      return;
    }
    setSelectedIds((ids) =>
      ids.includes(packId) ? ids.filter((id) => id !== packId) : [...ids, packId],
    );
  };

  const start = () => {
    navigation.navigate('Game', { packIds: selectedIds });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Choisissez vos thèmes</Text>
        {PACKS.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            unlocked={isPackUnlocked(pack.id)}
            selected={selectedIds.includes(pack.id)}
            onPress={() => togglePack(pack.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={
            selectedIds.length === 0
              ? 'Sélectionnez au moins un thème'
              : "C'est parti !"
          }
          onPress={start}
          disabled={selectedIds.length === 0}
        />
      </View>
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
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceLight,
  },
});
