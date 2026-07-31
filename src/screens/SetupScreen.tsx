/**
 * Préparation de la partie : les deux prénoms + le choix des packs.
 * Pensé pour être rempli en quelques secondes, en plein date.
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import PackCard from '../components/PackCard';
import { PACKS } from '../data/questions';
import { ScreenProps } from '../navigation';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

export default function SetupScreen({ navigation }: ScreenProps<'Setup'>) {
  const { playerA, playerB, setPlayers, isPackUnlocked } = useApp();
  const [nameA, setNameA] = useState(playerA);
  const [nameB, setNameB] = useState(playerB);
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
    setPlayers(nameA.trim(), nameB.trim());
    navigation.navigate('Game', { packIds: selectedIds });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Qui joue ce soir ?</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.input}
              placeholder="Prénom 1"
              placeholderTextColor={colors.textMuted}
              value={nameA}
              onChangeText={setNameA}
              maxLength={20}
            />
            <Text style={styles.heart}>❤️</Text>
            <TextInput
              style={styles.input}
              placeholder="Prénom 2"
              placeholderTextColor={colors.textMuted}
              value={nameB}
              onChangeText={setNameB}
              maxLength={20}
            />
          </View>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: {
    color: colors.text,
    fontSize: font.subtitle,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
  },
  heart: { fontSize: 20 },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceLight,
  },
});
