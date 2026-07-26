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
import AdBanner from '../components/AdBanner';
import Button from '../components/Button';
import { PACKS, isDuo, questionText } from '../data/questions';
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

/**
 * Une partie se joue en chapitres courts : 15 questions, puis une pause
 * (« Chapitre suivant ? »). Les chapitres suivants piochent dans les
 * questions pas encore vues — aucune répétition avant épuisement.
 */
const ROUND_SIZE = 15;

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
  const [round, setRound] = useState(1);
  const [answeredInRound, setAnsweredInRound] = useState(0);
  const [betweenRounds, setBetweenRounds] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  const names = useMemo(() => {
    const a = playerA || 'Joueur 1';
    const b = playerB || 'Joueur 2';
    return [a, b];
  }, [playerA, playerB]);

  const finished = index >= deck.length;
  const current = finished ? null : deck[index];
  const responder = names[soloCount % 2];
  // Taille réelle de la manche en cours (la dernière peut être plus courte).
  const roundTotal = Math.min(ROUND_SIZE, answeredInRound + (deck.length - index));

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (current?.kind === 'solo') setSoloCount((n) => n + 1);
    const answered = answeredInRound + 1;
    setAnsweredInRound(answered);
    if (answered >= ROUND_SIZE) setBetweenRounds(true);
    Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setIndex((i) => i + 1);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const goBack = () => {
    if (index === 0 || answeredInRound === 0) return;
    Haptics.selectionAsync().catch(() => {});
    const prev = index - 1;
    // On restitue le tour tel qu'il était affiché sur cette question.
    if (deck[prev].kind === 'solo') setSoloCount((n) => Math.max(0, n - 1));
    setAnsweredInRound((n) => Math.max(0, n - 1));
    setIndex(prev);
  };

  const nextRound = () => {
    setAnsweredInRound(0);
    setRound((r) => r + 1);
    setBetweenRounds(false);
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
    setRound(1);
    setAnsweredInRound(0);
    setBetweenRounds(false);
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
        <AdBanner compact />
      </SafeAreaView>
    );
  }

  if (betweenRounds) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.endContainer}>
          <Text style={[styles.endTitle, styles.endTitlePause]}>
            Fin du chapitre
            <Text style={styles.endDot}>.</Text>
          </Text>
          <Button label="Chapitre suivant" onPress={nextRound} style={styles.endButton} />
          <Button
            label="On s'arrête là"
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
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${((answeredInRound + 1) / roundTotal) * 100}%` }]}
        />
      </View>
      <Text style={styles.progressLabel}>
        Chapitre {round} · {answeredInRound + 1} / {roundTotal}
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

      <View style={styles.footerRow}>
        <Button
          label="← Précédente"
          variant="ghost"
          onPress={goBack}
          disabled={index === 0 || answeredInRound === 0}
          style={styles.footerButton}
        />
        <Button
          label="Passer cette question"
          variant="ghost"
          onPress={skip}
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
        kind: isDuo(q) ? 'duo' : 'solo',
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
  endTitlePause: { marginBottom: spacing.lg },
  endText: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: spacing.lg,
  },
  endButton: { marginTop: spacing.sm },
});
