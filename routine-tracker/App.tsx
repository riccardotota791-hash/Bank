import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoutineProvider } from './src/hooks/RoutineStore';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RoutineProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </RoutineProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
