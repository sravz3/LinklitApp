import { useColorScheme as useNativeColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';

export function useColorScheme() {
  const colorScheme = useNativeColorScheme();
  return colorScheme ?? 'light';
}

export function useThemeColors() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme];
  
  // Ensure all color values are strings and provide fallbacks
  return {
    primary: String(themeColors?.primary ?? Colors.light.primary),
    primaryMuted: String(themeColors?.primaryMuted ?? Colors.light.primaryMuted),
    background: String(themeColors?.background ?? Colors.light.background),
    surface: String(themeColors?.surface ?? Colors.light.surface),
    card: String(themeColors?.card ?? Colors.light.card),
    text: String(themeColors?.text ?? Colors.light.text),
    textSecondary: String(themeColors?.textSecondary ?? Colors.light.textSecondary),
    textMuted: String(themeColors?.textMuted ?? Colors.light.textMuted),
    border: String(themeColors?.border ?? Colors.light.border),
    borderLight: String(themeColors?.borderLight ?? Colors.light.borderLight),
    success: String(themeColors?.success ?? Colors.light.success),
    warning: String(themeColors?.warning ?? Colors.light.warning),
    error: String(themeColors?.error ?? Colors.light.error),
    collections: themeColors?.collections ?? Colors.light.collections
  };
}