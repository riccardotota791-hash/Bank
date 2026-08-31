import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { colors } from '../theme/theme';
import TodayScreen from '../screens/TodayScreen';
import WeekScreen from '../screens/WeekScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.panel,
    border: colors.border,
    primary: colors.accent,
    text: colors.textPrimary,
  },
};

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Oggi: 'radio-outline',
  Settimana: 'grid-outline',
  Statistiche: 'stats-chart-outline',
  Impostazioni: 'settings-outline',
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.panel,
            borderTopColor: colors.border,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Oggi" component={TodayScreen} />
        <Tab.Screen name="Settimana" component={WeekScreen} />
        <Tab.Screen name="Statistiche" component={StatsScreen} />
        <Tab.Screen name="Impostazioni" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
