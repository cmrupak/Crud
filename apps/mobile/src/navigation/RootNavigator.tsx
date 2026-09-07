import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { RegisterWizardScreen } from '../screens/RegisterWizardScreen';
import { ExistingUserScreen } from '../screens/ExistingUserScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { RecordsScreen } from '../screens/RecordsScreen';
import { RecordFormScreen } from '../screens/RecordFormScreen';
import { RecordDetailScreen } from '../screens/RecordDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminUserDetailScreen } from '../screens/AdminUserDetailScreen';
import { AdminRecordsScreen } from '../screens/AdminRecordsScreen';
import { DeactivatedScreen } from '../screens/DeactivatedScreen';
import { TabIcon } from '../components/TabIcon';
import { colors } from '../theme';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuth();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.line },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="dashboard" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Records"
        component={RecordsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="records" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="profile" color={color} size={size} />,
        }}
      />
      {user?.role === 'admin' ? (
        <Tabs.Screen
          name="Admin"
          component={AdminUsersScreen}
          options={{
            tabBarIcon: ({ color, size }) => <TabIcon name="admin" color={color} size={size} />,
          }}
        />
      ) : null}
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading, deactivated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (deactivated) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Deactivated" component={DeactivatedScreen} />
      </AuthStack.Navigator>
    );
  }

  if (!user) {
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
        <AuthStack.Screen name="Login" component={ExistingUserScreen} />
        <AuthStack.Screen name="RegisterWizard" component={RegisterWizardScreen} />
      </AuthStack.Navigator>
    );
  }

  return (
    <AppStack.Navigator
      screenOptions={{
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <AppStack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
      <AppStack.Screen name="CreateRecord" component={RecordFormScreen} options={{ title: 'Create record' }} />
      <AppStack.Screen name="EditRecord" component={RecordFormScreen} options={{ title: 'Edit record' }} />
      <AppStack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ title: 'Record' }} />
      <AppStack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} options={{ title: 'User' }} />
      <AppStack.Screen name="AdminRecords" component={AdminRecordsScreen} options={{ title: 'All records' }} />
    </AppStack.Navigator>
  );
}
