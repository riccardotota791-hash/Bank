import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AdviceScreen from '../screens/AdviceScreen';
import HistoryScreen from '../screens/HistoryScreen';
import MonthDetailScreen from '../screens/MonthDetailScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CategoryManagerScreen from '../screens/CategoryManagerScreen';
import CategoryEditScreen from '../screens/CategoryEditScreen';
import GmailSetupScreen from '../screens/GmailSetupScreen';
import ImportFileScreen from '../screens/ImportFileScreen';
import NewsScreen from '../screens/NewsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TransactionsStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.card },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: { fontWeight: '700' },
  headerShadowVisible: false,
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

function TransactionsStackNavigator() {
  return (
    <TransactionsStack.Navigator screenOptions={stackScreenOptions}>
      <TransactionsStack.Screen name="TransactionsMain" component={TransactionsScreen} options={{ headerShown: false }} />
    </TransactionsStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={stackScreenOptions}>
      <HistoryStack.Screen name="HistoryMain" component={HistoryScreen} options={{ headerShown: false }} />
      <HistoryStack.Screen name="MonthDetail" component={MonthDetailScreen} />
    </HistoryStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={stackScreenOptions}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="CategoryManager" component={CategoryManagerScreen} options={{ title: 'Categorie' }} />
      <SettingsStack.Screen name="CategoryEdit" component={CategoryEditScreen} />
      <SettingsStack.Screen name="GmailSetup" component={GmailSetupScreen} options={{ title: 'Collega Gmail' }} />
      <SettingsStack.Screen name="ImportFile" component={ImportFileScreen} options={{ title: 'Importa da file' }} />
    </SettingsStack.Navigator>
  );
}

const ICONS = {
  Home: 'home',
  Movimenti: 'swap-horizontal',
  Consigli: 'bulb',
  Storico: 'time',
  Statistiche: 'bar-chart',
  Notizie: 'newspaper',
  Impostazioni: 'settings',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border },
        tabBarLabelStyle: { fontSize: 9 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={`${ICONS[route.name]}${focused ? '' : '-outline'}`} size={size - 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Movimenti" component={TransactionsStackNavigator} />
      <Tab.Screen name="Consigli" component={AdviceScreen} />
      <Tab.Screen name="Storico" component={HistoryStackNavigator} />
      <Tab.Screen name="Statistiche" component={StatisticsScreen} />
      <Tab.Screen name="Notizie" component={NewsScreen} />
      <Tab.Screen name="Impostazioni" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}
