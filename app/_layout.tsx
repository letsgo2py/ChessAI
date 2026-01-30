import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Check for guest mode
    AsyncStorage.getItem('isGuest').then((guestValue) => {
      setIsGuest(guestValue === 'true');
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'login-form';

    // Allow access if user is authenticated OR in guest mode
    if (!user && !isGuest && !inAuthGroup) {
      // User is not logged in, not a guest, and not on auth screens, redirect to login
      router.replace('/login');
    } else if ((user || isGuest) && inAuthGroup) {
      // User is logged in or is a guest but on auth screens, redirect to main app
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, isGuest]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#93ABC5' }}>
        <ActivityIndicator size="large" color="#F68412" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="login-form" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="matchmaking" />
        <Stack.Screen name="chess-board" />
        <Stack.Screen name="chess-board-ai" />
        <Stack.Screen name="chess-board-online" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
