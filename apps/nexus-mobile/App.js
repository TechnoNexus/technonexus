import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/lib/supabase';

import AuthScreen from './src/screens/AuthScreen';
import Dashboard from './src/screens/Dashboard';
import ArcadeHome from './src/screens/ArcadeHome';
import ForgeLobby from './src/screens/ForgeLobby';
import NexusBlitz from './src/screens/NexusBlitz';
import DumbCharades from './src/screens/DumbCharades';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
          animation: 'slide_from_right'
        }}
      >
        {session && session.user ? (
          // User is signed in
          <>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="ArcadeHome" component={ArcadeHome} />
            <Stack.Screen name="ForgeLobby" component={ForgeLobby} />
            <Stack.Screen name="NexusBlitz" component={NexusBlitz} />
            <Stack.Screen name="DumbCharades" component={DumbCharades} />
          </>
        ) : (
          // No session, show Auth screen
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
