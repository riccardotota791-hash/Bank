import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import VoiceAddScreen from '../screens/VoiceAddScreen';
import { COLORS } from '../constants/theme';

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      />
      <RootStack.Screen
        name="VoiceAdd"
        component={VoiceAddScreen}
        options={{
          title: 'Aggiungi a voce',
          presentation: 'modal',
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      />
    </RootStack.Navigator>
  );
}
