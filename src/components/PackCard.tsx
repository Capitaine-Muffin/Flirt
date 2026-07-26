import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QuestionPack } from '../data/questions';
import { colors, font, radius, spacing } from '../theme';

interface PackCardProps {
  pack: QuestionPack;
  unlocked: boolean;
  selected?: boolean;
  onPress: () => void;
}

function intensityLabel(intensity: 1 | 2 | 3): string {
  return '🌶️'.repeat(intensity);
}

export default function PackCard({ pack, unlocked, selected = false, onPress }: PackCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.emoji}>{pack.emoji}</Text>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{pack.title}</Text>
          {!unlocked && <Text style={styles.lock}>🔒</Text>}
          {selected && <Text style={styles.check}>✓</Text>}
        </View>
        <Text style={styles.description}>{pack.description}</Text>
        <Text style={styles.meta}>
          {pack.questions.length} questions · {intensityLabel(pack.intensity)}
        </Text>
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
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  emoji: { fontSize: 34, marginRight: spacing.md },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.text, fontSize: font.subtitle, fontWeight: '700', flex: 1 },
  lock: { fontSize: 16, marginLeft: spacing.sm },
  check: { color: colors.primary, fontSize: 18, fontWeight: '900', marginLeft: spacing.sm },
  description: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.xs },
});
