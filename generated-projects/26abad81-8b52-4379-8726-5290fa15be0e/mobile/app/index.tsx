import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AlertsScreen from './screens/AlertsScreen';
import MapScreen from './screens/MapScreen';
import ScanScreen from './screens/ScanScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#0b1120' },
            headerTintColor: '#e2e8f0',
            tabBarStyle: { backgroundColor: '#0b1120', borderTopColor: '#1e293b' },
            tabBarActiveTintColor: '#22d3ee',
            tabBarInactiveTintColor: '#64748b',
            tabBarIcon: ({ color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle';
              if (route.name === 'Alerts') iconName = 'alert-circle';
              else if (route.name === 'Map') iconName = 'map';
              else if (route.name === 'Scan') iconName = 'scan';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Alerts" component={AlertsScreen} />
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen name="Scan" component={ScanScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
