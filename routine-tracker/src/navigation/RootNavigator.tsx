import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../theme/theme';
import TodayScreen from '../screens/TodayScreen';
import WeekScreen from '../screens/WeekScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DayDetailScreen from '../screens/DayDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

function MainTabs() {
  return (
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
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="DayDetail" component={DayDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
