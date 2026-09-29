import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function Layout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="save" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="wallet" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ headerShown: false }} />
      </Stack>
      <Toast />
    </>
  );
}