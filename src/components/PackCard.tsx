import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QuestionPack } from '../data/questions';
import { colors, font, radius, spacing } from '../theme';

interface PackCardProps {
  pack: QuestionPack;
  unlocked: boolean;
  onPress: () => void;
}

export default function PackCard({ pack, unlocked, onPress }: PackCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.emoji}>{pack.emoji}</Text>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{pack.title}</Text>
          {!unlocked && <Text style={styles.lock}>🔒</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    minHeight: 128,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pressed: { opacity: 0.8 },
  emoji: { fontSize: 48, marginRight: spacing.lg },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', flex: 1 },
  lock: { fontSize: 16, marginLeft: spacing.sm },
});
