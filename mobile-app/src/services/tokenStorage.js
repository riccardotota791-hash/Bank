import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKENS_KEY = 'gmail_tokens_v1';
const CLIENT_ID_KEY = 'gmail_client_id_v1';

export async function saveTokens(tokens) {
  await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export async function getTokens() {
  const raw = await AsyncStorage.getItem(TOKENS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearTokens() {
  await AsyncStorage.removeItem(TOKENS_KEY);
}

export async function saveClientId(clientId) {
  await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
}

export async function getClientId() {
  return AsyncStorage.getItem(CLIENT_ID_KEY);
}
