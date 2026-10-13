import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { AppState, ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AuthSession, UserRole } from '@/types/domain';
import { flushOfflineQueue, getOfflineQueue } from '@/services/offline';
import { AppFrame, cx, PageTitle } from '@/features/app/native-ui';
import { useResource } from '@/features/app/hooks';
import { HomeScreen } from '@/features/mobile/HomeScreen';
import type { MobileTab } from '@/features/mobile/types';
import { ManagePatrolsScreen } from '@/features/patrols/ManagePatrolsScreen';
import { RiskAlertsScreen } from '@/features/monitoring/RiskAlertsScreen';
import { ReportHubScreen } from '@/features/reports/ReportHubScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { ResponderCasesScreen } from '@/features/conflicts/ResponderCasesScreen';
import { alertApi } from '@/services/api';

const mobileNavItems: {
  key: MobileTab;
  label: string;
  icon: SymbolViewProps['name'];
  roles?: UserRole[];
}[] = [
  { key: 'home', label: 'Home', icon: { ios: 'house.fill', android: 'home', web: 'home' } },
  {
    key: 'patrols',
    label: 'Patrols',
    icon: { ios: 'figure.walk', android: 'route', web: 'route' },
    roles: ['RANGER'],
  },
  {
    key: 'alerts',
    label: 'Alerts',
    icon: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
    roles: ['RANGER', 'COMMUNITY_LIAISON_OFFICER', 'COMMUNITY_MEMBER'],
  },
  {
    key: 'cases',
    label: 'Cases',
    icon: { ios: 'location.fill', android: 'near_me', web: 'near_me' },
    roles: ['COMMUNITY_LIAISON_OFFICER'],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: { ios: 'doc.text.fill', android: 'assignment', web: 'assignment' },
    roles: ['RANGER', 'COMMUNITY_MEMBER'],
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: { ios: 'person.crop.circle.fill', android: 'person', web: 'person' },
  },
];

function mobileEyebrow(role: UserRole) {
  if (role === 'COMMUNITY_MEMBER') {
    return 'Community mobile';
  }

  if (role === 'COMMUNITY_LIAISON_OFFICER') {
    return 'Liaison mobile';
  }

  return 'Ranger mobile';
}

export function MobileShell({ session }: { session: AuthSession }) {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const insets = useSafeAreaInsets();
  const visibleTabs = mobileNavItems.filter((item) => !item.roles || item.roles.includes(session.role));
  const bottomInset = Math.max(insets.bottom, 12);
  const bottomNavOffset = 72 + bottomInset;
  const canReceiveRiskAlerts = ['RANGER', 'COMMUNITY_LIAISON_OFFICER', 'COMMUNITY_MEMBER'].includes(session.role);
  const alerts = useResource(
    () => (canReceiveRiskAlerts ? alertApi.all(session.token) : Promise.resolve([])),
    [session.token, session.role],
  );
  const refreshAlerts = alerts.refresh;
  const alertCount = alerts.data?.filter((alert) => alert.status !== 'RESOLVED').length ?? 0;

  useEffect(() => {
    let syncing = false;

    const syncPendingReports = async () => {
      if (syncing || AppState.currentState !== 'active') {
        return;
      }

      syncing = true;

      try {
        const pending = await getOfflineQueue();

        if (pending.length) {
          await flushOfflineQueue(session.token);
        }
      } catch (exception) {
        console.error('Unable to synchronize offline reports.', exception);
      } finally {
        syncing = false;
      }
    };

    const timer = setInterval(() => {
      void syncPendingReports();
    }, 15000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncPendingReports();
      }
    });

    void syncPendingReports();

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [session.token]);

  useEffect(() => {
    if (!canReceiveRiskAlerts) {
      return undefined;
    }

    const timer = setInterval(() => {
      refreshAlerts();
    }, 10000);

    return () => clearInterval(timer);
  }, [refreshAlerts, canReceiveRiskAlerts]);

  const renderScreen = () => {
    if (activeTab === 'patrols') {
      return <ManagePatrolsScreen session={session} />;
    }

    if (activeTab === 'alerts') {
      return <RiskAlertsScreen session={session} />;
    }

    if (activeTab === 'cases') {
      return <ResponderCasesScreen session={session} />;
    }

    if (activeTab === 'reports') {
      return <ReportHubScreen session={session} />;
    }

    if (activeTab === 'profile') {
      return <ProfileScreen session={session} />;
    }

    return <HomeScreen session={session} onNavigate={setActiveTab} />;
  };

  return (
    <AppFrame>
      <View className="flex-1">
        <View className="border-b border-slate-200 bg-white px-4 py-3">
          <PageTitle
            eyebrow={mobileEyebrow(session.role)}
            title="Wildlife Field App"
            subtitle={session.fullName}
          />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: bottomNavOffset }}>
          <View className="gap-4 p-4">{renderScreen()}</View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-2 pt-2 shadow-lg"
          style={{ paddingBottom: bottomInset }}
        >
          <View className="flex-row gap-1">
            {visibleTabs.map((item) => {
              const selected = item.key === activeTab;
              const isAlertTab = item.key === 'alerts';
              const activeClass = isAlertTab ? 'bg-red-600' : 'bg-forest-600';
              const inactiveText = isAlertTab && alertCount > 0 ? 'text-red-700' : 'text-slate-600';

              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.key}
                  onPress={() => setActiveTab(item.key)}
                  className={cx(
                    'h-14 flex-1 items-center justify-center rounded-md',
                    selected ? activeClass : 'bg-white',
                  )}
                >
                  <View>
                    <SymbolView
                      name={item.icon}
                      size={22}
                      tintColor={selected ? '#ffffff' : isAlertTab && alertCount > 0 ? '#dc2626' : '#475569'}
                      fallback={
                        <Text className={cx('text-lg font-black', selected ? 'text-white' : inactiveText)}>
                          {item.label.charAt(0)}
                        </Text>
                      }
                    />
                    {isAlertTab && alertCount > 0 ? (
                      <View className="absolute -right-2 -top-1 min-w-4 items-center rounded-full bg-red-600 px-1">
                        <Text className="text-[10px] font-black text-white">{alertCount}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className={cx('text-xs font-bold', selected ? 'text-white' : inactiveText)}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </AppFrame>
  );
}
