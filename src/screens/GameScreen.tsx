/**
 * L'écran de jeu — le moment du date.
 *
 * Une question à la fois, en plein écran. Mécanique « Mix » : selon la
 * nature de la question, elle s'adresse à une personne en alternance ou
 * aux deux (« Tu préfères », débats). Zéro publicité ici :
 * rien ne doit casser le rythme de la conversation. On peut passer une
 * question qui ne convient pas, et rejouer à l'infini.
 */
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { PACKS } from '../data/questions';
import { ScreenProps } from '../navigation';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

interface GameQuestion {
  text: string;
  packEmoji: string;
  packTitle: string;
  /** solo = une personne répond, duo = les deux répondent. */
  kind: 'solo' | 'duo';
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
  const { playerA, playerB } = useApp();
  const { packIds } = route.params;

  const [deck, setDeck] = useState<GameQuestion[]>(() => buildDeck(packIds));
  const [index, setIndex] = useState(0);
  // Nombre de questions solo déjà jouées : l'alternance des tours ne
  // compte que celles-là, pour rester équitable malgré les questions duo.
  const [soloCount, setSoloCount] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const names = useMemo(() => {
    const a = playerA || 'Joueur 1';
    const b = playerB || 'Joueur 2';
    return [a, b];
  }, [playerA, playerB]);

  const finished = index >= deck.length;
  const current = finished ? null : deck[index];
  const responder = names[soloCount % 2];

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (current?.kind === 'solo') setSoloCount((n) => n + 1);
    Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setIndex((i) => i + 1);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const skip = () => {
    // La question passée est renvoyée en fin de pioche : on ne la perd pas.
    if (!current) return;
    Haptics.selectionAsync().catch(() => {});
    setDeck((d) => [...d.slice(0, index), ...d.slice(index + 1), current]);
  };

  const replay = () => {
    setDeck(buildDeck(packIds));
    setIndex(0);
    setSoloCount(0);
  };

  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.endContainer}>
          <Text style={styles.endEmoji}>💞</Text>
          <Text style={styles.endTitle}>Vous avez fait le tour !</Text>
          <Text style={styles.endText}>
            {names[0]} & {names[1]}, vous vous connaissez déjà beaucoup mieux.
            {'\n'}La suite se passe sans téléphone…
          </Text>
          <Button label="Rejouer avec les mêmes thèmes" onPress={replay} style={styles.endButton} />
          <Button
            label="Retour à l'accueil"
            variant="ghost"
            onPress={() => navigation.popToTop()}
            style={styles.endButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${((index + 1) / deck.length) * 100}%` }]}
        />
      </View>
      <Text style={styles.progressLabel}>
        Question {index + 1} / {deck.length}
      </Text>

      <Pressable style={styles.cardArea} onPress={goNext}>
        <Animated.View style={[styles.card, { opacity: fade }]}>
          <Text style={styles.packLabel}>
            {current!.packEmoji} {current!.packTitle}
          </Text>
          {current!.kind === 'duo' ? (
            <Text style={[styles.turn, styles.turnDuo]}>Question pour vous deux</Text>
          ) : (
            <Text style={styles.turn}>Question pour {responder}</Text>
          )}
          <Text style={styles.question}>{current!.text}</Text>
          <Text style={styles.tapHint}>Touchez la carte pour la question suivante</Text>
        </Animated.View>
      </Pressable>

      <View style={styles.footer}>
        <Button label="Passer cette question" variant="ghost" onPress={skip} />
      </View>
    </SafeAreaView>
  );
}

function buildDeck(packIds: string[]): GameQuestion[] {
  const questions = PACKS.filter((p) => packIds.includes(p.id)).flatMap((p) =>
    p.questions.map(
      (text): GameQuestion => ({
        text,
        packEmoji: p.emoji,
        packTitle: p.title,
        kind: p.duo ? 'duo' : 'solo',
      }),
    ),
  );
  return shuffle(questions);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressLabel: {
    color: colors.textMuted,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
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
  turn: {
    color: colors.primary,
    fontSize: font.subtitle,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  turnDuo: { color: colors.gold },
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
  footer: { padding: spacing.md },
  endContainer: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  endEmoji: { fontSize: 64, textAlign: 'center' },
  endTitle: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  endText: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: spacing.lg,
  },
  endButton: { marginTop: spacing.sm },
});
