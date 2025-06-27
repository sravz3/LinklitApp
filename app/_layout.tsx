import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { DefaultDataService } from '@/utils/defaultData';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [isDefaultDataReady, setIsDefaultDataReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize default data first
        await DefaultDataService.initializeDefaultData();
        setIsDefaultDataReady(true);
      } catch (error) {
        console.error('Error initializing default data:', error);
        // Still allow the app to continue even if default data fails
        setIsDefaultDataReady(true);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isDefaultDataReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isDefaultDataReady]);

  if ((!fontsLoaded && !fontError) || !isDefaultDataReady) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}