import { Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { isManagerRole } from '@/features/app/helpers';
import { AppFrame, LoadingBlock } from '@/features/app/native-ui';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { ManagerDashboard } from '@/features/dashboard/ManagerDashboard';
import { MobileShell } from '@/features/mobile/MobileShell';

export function WildlifeApp() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <AppFrame>
        <View className="flex-1 items-center justify-center p-6">
          <LoadingBlock label="Restoring secure session" />
          <Text className="mt-4 text-center text-sm text-slate-500">Wildlife operations workspace</Text>
        </View>
      </AppFrame>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (isManagerRole(session.role)) {
    return <ManagerDashboard session={session} />;
  }

  return <MobileShell session={session} />;
}
