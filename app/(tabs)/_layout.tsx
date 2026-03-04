import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, BookOpen, Library, Utensils, Sparkles, Brain, Activity, Stethoscope, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/config/theme';

export default function TabLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found in tabs, redirecting to sign-in');
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    console.log('Auth loading...');
    return null;
  }

  if (!user) {
    console.log('No user, blocking tabs access');
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand.cyan,
        tabBarInactiveTintColor: theme.colors.text.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.background.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.default,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarActiveBackgroundColor: theme.colors.background.surface,
        tabBarInactiveBackgroundColor: theme.colors.background.surface,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-path"
        options={{
          title: 'My Path',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medical"
        options={{
          title: 'Medical',
          tabBarIcon: ({ size, color }) => (
            <Stethoscope size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meditation"
        options={{
          title: 'Awakening',
          tabBarIcon: ({ size, color }) => (
            <Sparkles size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mindfulness"
        options={{
          title: 'Mindfulness',
          tabBarIcon: ({ size, color }) => (
            <Brain size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="movement"
        options={{
          title: 'Movement',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ size, color }) => (
            <Utensils size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, color }) => (
            <Library size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
