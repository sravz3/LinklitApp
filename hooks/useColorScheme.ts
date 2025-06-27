import { useColorScheme as useNativeColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';

export function useColorScheme() {
  const colorScheme = useNativeColorScheme();
  return colorScheme ?? 'light';
}

export function useThemeColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme];
}