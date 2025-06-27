import { Stack } from 'expo-router';

export default function CollectionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="create" 
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="edit" 
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="[id]" 
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}