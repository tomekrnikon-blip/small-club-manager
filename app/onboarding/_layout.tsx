import { Stack } from 'expo-router';

export default function OnboardingFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="country-select" />
      <Stack.Screen name="club-setup" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
