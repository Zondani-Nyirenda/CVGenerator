// App.tsx
import 'react-native-get-random-values';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';

import RootNavigator from './src/navigation/RootNavigator';
import { initDB } from './src/db/database';
import { useCVStore } from './src/store/cvStore';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializationDone = useRef(false);

  useEffect(() => {
    if (initializationDone.current) return;

    async function initialize() {
      try {
        console.log('Starting app initialization...');

        // 1. Open DB and create tables
        await initDB();
        console.log('✅ Database initialized');

        // 2. Load any existing CV data into the store
        //    (the chat screen handles fresh starts naturally —
        //     no need to wipe data so users can resume a session)
        await useCVStore.getState().loadFromSQLite();
        console.log('✅ Store loaded from SQLite');

        setIsReady(true);
        initializationDone.current = true;
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize app');
        Alert.alert(
          'Initialization Error',
          'Failed to initialize the app. Please restart or reinstall if the problem persists.',
          [{ text: 'OK' }],
        );
      }
    }

    initialize();

    return () => {
      initializationDone.current = false;
    };
  }, []);

  const handleRetry = async () => {
    setError(null);
    setIsReady(false);
    initializationDone.current = false;
    try {
      await initDB();
      await useCVStore.getState().loadFromSQLite();
      setIsReady(true);
      initializationDone.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize app');
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        {error ? (
          <>
            <Text style={{ color: '#EF4444', marginBottom: 20, textAlign: 'center' }}>
              Error: {error}
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={{
                backgroundColor: '#1E4FD8',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#1E4FD8" />
            <Text style={{ marginTop: 20, color: '#475569' }}>Setting up...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}