import { Stack } from 'expo-router';

export default function MedicalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="bloodwork/index" />
      <Stack.Screen name="bloodwork/new" />
      <Stack.Screen name="bloodwork/[id]" />
    </Stack>
  );
}
