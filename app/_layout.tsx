import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#8b5cf6',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Home',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              title: 'Login',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="dashboard"
            options={{
              title: 'Dashboard',
            }}
          />
          <Stack.Screen
            name="send-challenge"
            options={{
              title: 'Send Challenge',
            }}
          />
          <Stack.Screen
            name="received-challenges"
            options={{
              title: 'Received Challenges',
            }}
          />
          <Stack.Screen
            name="propose"
            options={{
              title: 'Propose Challenge',
            }}
          />
          <Stack.Screen
            name="community"
            options={{
              title: 'Community',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Settings',
            }}
          />
          <Stack.Screen
            name="challenge/[id]"
            options={{
              title: 'Challenge Details',
            }}
          />
        </Stack>
      </AuthProvider>
      <StatusBar style="auto" />
    </>
  );
}
