import { Stack } from 'expo-router';

export default function NutritionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="entry/index" />
      <Stack.Screen
        name="entry/new"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="trends" />
      <Stack.Screen name="analysis/index" />
      <Stack.Screen name="consultation-prep/index" />
      <Stack.Screen name="support-access/index" />
      <Stack.Screen name="education/index" />
      <Stack.Screen name="chat" />
    </Stack>
  );
}
