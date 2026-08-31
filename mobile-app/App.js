import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { LoadingView } from './src/components/UI';
import { COLORS } from './src/constants/theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.card,
    primary: COLORS.primary,
    text: COLORS.textPrimary,
    border: COLORS.border,
  },
};

function Root() {
  const { ready, error } = useApp();

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Errore di avvio</Text>
        <Text style={styles.errorText}>{String(error.message || error)}</Text>
      </View>
    );
  }

  if (!ready) {
    return <LoadingView label="Preparo il tuo archivio finanziario..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.negative,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
