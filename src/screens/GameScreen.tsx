/**
 * L'écran de jeu — le moment du date.
 *
 * Une question à la fois, en plein écran. Les cartes défilent en
 * continu, sans pause ni compteur : une carte, une question, et les
 * joueurs décident qui répond. Zéro publicité ici : rien ne doit
 * casser le rythme de la conversation. On peut rejouer à l'infini.
 */
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdBanner from '../components/AdBanner';
import Button from '../components/Button';
import { PACKS, questionText } from '../data/questions';
import { ScreenProps } from '../navigation';
import { colors, font, radius, spacing } from '../theme';

interface GameQuestion {
  text: string;
  packEmoji: string;
  packTitle: string;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GameScreen({ navigation, route }: ScreenProps<'Game'>) {
  const { packIds } = route.params;

  const [deck, setDeck] = useState<GameQuestion[]>(() => buildDeck(packIds));
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const finished = index >= deck.length;
  const current = finished ? null : deck[index];

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setIndex((i) => i + 1);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const goBack = () => {
    if (index === 0) return;
    Haptics.selectionAsync().catch(() => {});
    setIndex((i) => i - 1);
  };

  const replay = () => {
    setDeck(buildDeck(packIds));
    setIndex(0);
  };

  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.endContainer}>
          <Text style={styles.endTitle}>
            Vous avez fait le tour
            <Text style={styles.endDot}>.</Text>
          </Text>
          <Text style={styles.endText}>
            Vous vous connaissez déjà beaucoup mieux.
            {'\n'}La suite se passe sans téléphone…
          </Text>
          <Button label="Rejouer avec le même thème" onPress={replay} style={styles.endButton} />
          <Button
            label="Retour à l'accueil"
            variant="ghost"
            onPress={() => navigation.popToTop()}
            style={styles.endButton}
          />
        </View>
        <AdBanner compact />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.cardArea} onPress={goNext}>
        <Animated.View style={[styles.card, { opacity: fade }]}>
          <Text style={styles.packLabel}>
            {current!.packEmoji} {current!.packTitle}
          </Text>
          <Text style={styles.question}>{current!.text}</Text>
          <Text style={styles.tapHint}>Touchez la carte pour la question suivante</Text>
        </Animated.View>
      </Pressable>

      <View style={styles.footerRow}>
        <Button
          label="← Précédente"
          variant="ghost"
          onPress={goBack}
          disabled={index === 0}
          style={styles.footerButton}
        />
      </View>
      <AdBanner compact />
    </SafeAreaView>
  );
}

function buildDeck(packIds: string[]): GameQuestion[] {
  const questions = PACKS.filter((p) => packIds.includes(p.id)).flatMap((p) =>
    p.questions.map(
      (q): GameQuestion => ({
        text: questionText(q),
        packEmoji: p.emoji,
        packTitle: p.title,
      }),
    ),
  );
  return shuffle(questions);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  cardArea: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 320,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  packLabel: {
    color: colors.textMuted,
    fontSize: font.small,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  question: {
    color: colors.text,
    fontSize: font.question,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 36,
    marginVertical: spacing.lg,
  },
  tapHint: {
    color: colors.textMuted,
    fontSize: font.small,
    textAlign: 'center',
  },
  footerRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  footerButton: { flex: 1 },
  endContainer: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  endTitle: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: '900',
    textAlign: 'center',
  },
  endDot: { color: colors.primary },
  endText: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: spacing.lg,
  },
  endButton: { marginTop: spacing.sm },
});
