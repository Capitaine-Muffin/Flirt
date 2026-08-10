/**
 * État global de l'app : accès aux packs de questions.
 *
 * Version 1.0 : l'app est entièrement gratuite et sans publicité. Les
 * packs marqués `premium` ne sont pas encore achetables — ils sont
 * annoncés « bientôt » dans l'écran dédié. Les achats validés seront
 * mémorisés ici (AsyncStorage) quand Play Billing sera branché ; la
 * lecture est déjà en place pour qu'une future mise à jour retrouve les
 * packs débloqués sans migration.
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
  /** productIds débloqués (packs, bundle). Vide tant que les achats n'existent pas. */
  purchases: string[];
}

interface AppContextValue {
  ready: boolean;
  /** Un pack est-il jouable (gratuit ou débloqué) ? */
  isPackUnlocked: (packId: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_STATE: PersistedState = { purchases: [] };

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

  const hasBundle = state.purchases.includes(PRODUCT_IDS.BUNDLE_ALL);

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

  const value = useMemo(() => ({ ready, isPackUnlocked }), [ready, isPackUnlocked]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>');
  return ctx;
}
