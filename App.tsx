import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { RootStackParamList } from './src/navigation';
import GameScreen from './src/screens/GameScreen';
import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import ShopScreen from './src/screens/ShopScreen';
import { AppProvider } from './src/state/AppContext';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    primary: colors.primary,
    border: colors.surfaceLight,
  },
};

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Setup" component={SetupScreen} options={{ title: 'Nouvelle partie' }} />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{ title: '', headerTransparent: true }}
          />
          <Stack.Screen name="Shop" component={ShopScreen} options={{ title: 'Boutique' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
