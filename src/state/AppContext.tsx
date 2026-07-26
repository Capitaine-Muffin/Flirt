/**
 * État global de l'app : prénoms des joueurs, achats débloqués, persistance.
 *
 * Tout est sauvegardé dans AsyncStorage pour que l'app se souvienne des
 * achats et des prénoms d'une session à l'autre (les achats réels sont en
 * plus restaurables via le store — voir services/purchases.ts).
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

const STORAGE_KEY = 'flirt/state/v1';

interface PersistedState {
  playerA: string;
  playerB: string;
  /** productIds achetés (packs, premium, bundle). */
  purchases: string[];
}

interface AppContextValue {
  ready: boolean;
  playerA: string;
  playerB: string;
  setPlayers: (a: string, b: string) => void;
  /** Premium = plus aucune publicité. */
  isPremium: boolean;
  /** Un pack est-il jouable (gratuit ou acheté) ? */
  isPackUnlocked: (packId: string) => boolean;
  /** Enregistre un achat validé (appelé par la boutique). */
  registerPurchase: (productId: string) => void;
  registerPurchases: (productIds: string[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_STATE: PersistedState = { playerA: '', playerB: '', purchases: [] };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: PersistedState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setPlayers = useCallback(
    (a: string, b: string) => persist({ ...state, playerA: a, playerB: b }),
    [persist, state],
  );

  const registerPurchases = useCallback(
    (productIds: string[]) => {
      const purchases = Array.from(new Set([...state.purchases, ...productIds]));
      persist({ ...state, purchases });
    },
    [persist, state],
  );

  const registerPurchase = useCallback(
    (productId: string) => registerPurchases([productId]),
    [registerPurchases],
  );

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
      playerA: state.playerA,
      playerB: state.playerB,
      setPlayers,
      isPremium,
      isPackUnlocked,
      registerPurchase,
      registerPurchases,
    }),
    [ready, state, setPlayers, isPremium, isPackUnlocked, registerPurchase, registerPurchases],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>');
  return ctx;
}
