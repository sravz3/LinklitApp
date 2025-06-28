import { Tabs } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorScheme';
import { House, FolderOpen, Plus, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => {
            return <House size={size} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ size, color }) => {
            return <FolderOpen size={size} color={color} />;
          },
          // Remove the href override to let it navigate to the index properly
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ size, color }) => {
            return <Plus size={size} color={color} />;
          },
          // This ensures the Add tab always starts fresh
          href: '/(tabs)/add',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => {
            return <Settings size={size} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}