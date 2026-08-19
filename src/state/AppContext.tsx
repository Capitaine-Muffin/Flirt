/**
 * État global de l'app : achats débloqués, persistance.
 *
 * La sauvegarde locale (AsyncStorage) sert de cache pour que l'app se
 * souvienne des achats hors ligne et démarre instantanément. La source de
 * vérité, elle, reste le store : au lancement, on demande à RevenueCat ce
 * que possède réellement l'utilisateur et on complète le cache. C'est ce
 * qui fait qu'un achat se retrouve après une réinstallation ou sur un
 * nouveau téléphone (voir services/purchases.ts).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { PACKS, PRODUCT_IDS } from '../data/questions';
import { getActiveProductIds, initPurchases } from '../services/purchases';

const STORAGE_KEY = 'flirt/state/v1';

interface PersistedState {
  /** productIds achetés (packs, premium, bundle). */
  purchases: string[];
}

interface AppContextValue {
  ready: boolean;
  /** Premium = plus aucune publicité. */
  isPremium: boolean;
  /** Un pack est-il jouable (gratuit ou acheté) ? */
  isPackUnlocked: (packId: string) => boolean;
  /** Enregistre des achats validés (appelés par la boutique). */
  registerPurchases: (productIds: string[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_STATE: PersistedState = { purchases: [] };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);

  const registerPurchases = useCallback((productIds: string[]) => {
    if (productIds.length === 0) return;
    setState((prev) => {
      const purchases = Array.from(new Set([...prev.purchases, ...productIds]));
      // Même contenu : on garde l'objet précédent pour éviter un rendu et
      // une écriture disque inutiles.
      return purchases.length === prev.purchases.length ? prev : { ...prev, purchases };
    });
  }, []);

  // 1. Cache local d'abord (rapide), puis vérification auprès du store.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      } catch {
        // Cache illisible : on repart d'un état vide, le store complétera.
      }
      if (!cancelled) setReady(true);

      try {
        await initPurchases();
        const owned = await getActiveProductIds();
        if (!cancelled) registerPurchases(owned);
      } catch {
        // Hors ligne : on reste sur le cache local.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [registerPurchases]);

  // 2. Toute évolution des achats est réécrite sur le téléphone.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [ready, state]);

  const hasBundle = state.purchases.includes(PRODUCT_IDS.BUNDLE_ALL);
  const isPremium = hasBundle || state.purchases.includes(PRODUCT_IDS.PREMIUM_LIFETIME);

  const isPackUnlocked = useCallback(
    (packId: string) => {
      const pack = PACKS.find((p) => p.id === packId);
      if (!pack) return false;
      if (!pack.premium) return true;
      if (hasBundle) return true;
      return pack.productId ? state.purchases.includes(pack.productId) : false;
    },
    [hasBundle, state.purchases],
  );

  const value = useMemo(
    () => ({
      ready,
      isPremium,
      isPackUnlocked,
      registerPurchases,
    }),
    [ready, isPremium, isPackUnlocked, registerPurchases],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>');
  return ctx;
}
