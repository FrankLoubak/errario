import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  return (
    <View className="items-center">
      <Text className={focused ? 'text-primary-500 text-xs' : 'text-gray-500 text-xs'}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#16213e',
          borderTopColor: '#1e2a4a',
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="📊" />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Erros',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="📝" />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="📅" />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Análise',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="🍕" />,
        }}
      />
    </Tabs>
  );
}
