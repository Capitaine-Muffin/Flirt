/**
 * La boutique : Premium à vie (sans pub), packs de questions, bundle.
 * Les achats passent par src/services/purchases.ts (mock en dev,
 * RevenueCat en production).
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdBanner from '../components/AdBanner';
import Button from '../components/Button';
import { PACKS, PREMIUM_PACKS, PRODUCT_IDS } from '../data/questions';
import { ScreenProps } from '../navigation';
import {
  MOCK_PRICE_CENTS,
  getDisplayPrice,
  purchaseProduct,
  restorePurchases,
} from '../services/purchases';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

export default function ShopScreen(_props: ScreenProps<'Shop'>) {
  const { isPremium, isPackUnlocked, registerPurchase, registerPurchases } = useApp();
  const [busyProduct, setBusyProduct] = useState<string | null>(null);

  const buy = async (productId: string) => {
    setBusyProduct(productId);
    try {
      const result = await purchaseProduct(productId);
      if (result.success) {
        registerPurchase(productId);
        Alert.alert('Merci ! 💘', 'Votre achat a bien été débloqué.');
      } else if (result.error) {
        Alert.alert('Achat impossible', result.error);
      }
    } finally {
      setBusyProduct(null);
    }
  };

  const restore = async () => {
    setBusyProduct('restore');
    try {
      const restored = await restorePurchases();
      if (restored.length > 0) {
        registerPurchases(restored);
        Alert.alert('Achats restaurés', 'Vos achats ont été retrouvés.');
      } else {
        Alert.alert('Aucun achat trouvé', "Aucun achat n'est associé à ce compte.");
      }
    } finally {
      setBusyProduct(null);
    }
  };

  const allPacksOwned = PACKS.every((p) => isPackUnlocked(p.id));
  const bundleOwned = isPremium && allPacksOwned;

  // Valeur à l'unité de ce qui manque encore : on ne propose le bundle
  // que s'il reste une vraie économie (sinon on ferait payer à
  // l'utilisateur des packs qu'il possède déjà).
  const missingValueCents =
    PREMIUM_PACKS.filter((p) => !isPackUnlocked(p.id)).reduce(
      (sum, p) => sum + (MOCK_PRICE_CENTS[p.productId!] ?? 0),
      0,
    ) + (isPremium ? 0 : MOCK_PRICE_CENTS[PRODUCT_IDS.PREMIUM_LIFETIME]);
  const bundleWorthIt = missingValueCents > MOCK_PRICE_CENTS[PRODUCT_IDS.BUNDLE_ALL];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Premium à vie */}
        <View style={[styles.offer, styles.premiumOffer]}>
          <Text style={styles.offerTitle}>✨ Flirt Premium · à vie</Text>
          <Text style={styles.offerText}>
            Plus aucune publicité, pour toujours. Un seul paiement, pas
            d'abonnement — parce qu'une pub ne doit jamais casser le charme
            d'un date.
          </Text>
          {isPremium ? (
            <Text style={styles.owned}>Déjà activé — merci ! 💛</Text>
          ) : (
            <Button
              label={`Passer Premium · ${getDisplayPrice(PRODUCT_IDS.PREMIUM_LIFETIME)}`}
              variant="gold"
              loading={busyProduct === PRODUCT_IDS.PREMIUM_LIFETIME}
              onPress={() => buy(PRODUCT_IDS.PREMIUM_LIFETIME)}
            />
          )}
        </View>

        {/* Bundle — masqué dès qu'il n'est plus avantageux pour l'utilisateur */}
        {bundleOwned ? (
          <View style={[styles.offer, styles.bundleOffer]}>
            <Text style={styles.offerTitle}>💝 Tout Flirt</Text>
            <Text style={styles.owned}>Tout est débloqué ! 🎉</Text>
          </View>
        ) : bundleWorthIt ? (
          <View style={[styles.offer, styles.bundleOffer]}>
            <Text style={styles.offerTitle}>💝 Tout Flirt</Text>
            <Text style={styles.offerText}>
              Premium à vie + les {PREMIUM_PACKS.length} packs de questions.
              La meilleure offre.
            </Text>
            <Button
              label={`Tout débloquer · ${getDisplayPrice(PRODUCT_IDS.BUNDLE_ALL)}`}
              loading={busyProduct === PRODUCT_IDS.BUNDLE_ALL}
              onPress={() => buy(PRODUCT_IDS.BUNDLE_ALL)}
            />
          </View>
        ) : (
          <Text style={styles.bundleHint}>
            Vu vos achats, il est plus avantageux de compléter à l'unité 👇
          </Text>
        )}

        {/* Packs à l'unité */}
        <Text style={styles.sectionTitle}>Packs de questions</Text>
        {PREMIUM_PACKS.map((pack) => {
          const owned = isPackUnlocked(pack.id);
          return (
            <View key={pack.id} style={styles.packRow}>
              <Text style={styles.packEmoji}>{pack.emoji}</Text>
              <View style={styles.packInfo}>
                <Text style={styles.packTitle}>{pack.title}</Text>
                <Text style={styles.packDescription}>{pack.description}</Text>
                <Text style={styles.packMeta}>{pack.questions.length} questions</Text>
              </View>
              {owned ? (
                <Text style={styles.packOwned}>✓</Text>
              ) : (
                <Button
                  label={getDisplayPrice(pack.productId!)}
                  variant="secondary"
                  loading={busyProduct === pack.productId}
                  onPress={() => buy(pack.productId!)}
                  style={styles.packBuy}
                />
              )}
            </View>
          );
        })}

        <Button
          label="Restaurer mes achats"
          variant="ghost"
          loading={busyProduct === 'restore'}
          onPress={restore}
          style={styles.restore}
        />
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  offer: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
  },
  premiumOffer: { borderColor: colors.gold },
  bundleOffer: { borderColor: colors.primary },
  offerTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: '800' },
  offerText: {
    color: colors.textMuted,
    fontSize: font.body,
    lineHeight: 22,
    marginVertical: spacing.sm,
  },
  owned: { color: colors.success, fontSize: font.body, fontWeight: '700' },
  bundleHint: {
    color: colors.textMuted,
    fontSize: font.small,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.subtitle,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  packEmoji: { fontSize: 30, marginRight: spacing.md },
  packInfo: { flex: 1 },
  packTitle: { color: colors.text, fontSize: font.body, fontWeight: '700' },
  packDescription: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  packMeta: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  packOwned: { color: colors.success, fontSize: 22, fontWeight: '900', marginLeft: spacing.sm },
  packBuy: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginLeft: spacing.sm,
  },
  restore: { marginTop: spacing.md },
});
