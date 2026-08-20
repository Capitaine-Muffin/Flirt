import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Routes de l'app. Le jeu reçoit le thème choisi ; ses questions sont
 * mélangées à l'entrée de l'écran.
 */
export type RootStackParamList = {
  Home: undefined;
  Setup: undefined;
  Game: { packIds: string[] };
  Shop: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
