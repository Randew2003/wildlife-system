import { Text, View } from 'react-native';

import { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { AuthSession } from '@/types/domain';
import { useOfflineQueueState } from '@/features/app/hooks';
import { formatDate, formatLabel } from '@/features/app/helpers';
import {
  Button,
  DataCard,
  EmptyBlock,
  Panel,
  Row,
  SectionTitle,
  Stack,
  StatusPill,
} from '@/features/app/native-ui';

export function ProfileScreen({ session }: { session: AuthSession }) {
  const { logout } = useAuth();
  const queue = useOfflineQueueState(session.token);

  return (
    <Stack>
      <Panel>
        <Stack>
          <SectionTitle title="Profile" subtitle={session.email} />
          <Row>
            <StatusPill status={formatLabel(session.role)} />
            {session.rangerId ? <StatusPill status={session.rangerId} /> : null}
          </Row>
          <DataCard
            title={session.fullName}
            subtitle="Authenticated account"
            rows={[
              { label: 'User ID', value: session.userId },
              { label: 'Role', value: formatLabel(session.role) },
              { label: 'API', value: API_BASE_URL },
            ]}
          />
          <Button label="Sign out" onPress={logout} variant="danger" />
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle
            title="Offline Synchronization"
            subtitle={`${queue.queue.length} queued item${queue.queue.length === 1 ? '' : 's'}`}
            action={
              <Button
                label="Sync"
                onPress={queue.syncNow}
                busy={queue.syncing}
                disabled={!queue.queue.length}
                variant="secondary"
              />
            }
          />
          {queue.message ? (
            <View className="rounded-lg border border-sky-200 bg-sky-50 p-3">
              <Text className="text-sm font-semibold text-sky-700">{queue.message}</Text>
            </View>
          ) : null}
          {queue.queue.length ? (
            queue.queue.map((item) => (
              <DataCard
                key={item.id}
                title={item.label}
                subtitle={item.endpoint}
                status="Pending Sync"
                rows={[
                  { label: 'Method', value: item.method },
                  { label: 'Attempts', value: item.attempts },
                  { label: 'Created', value: formatDate(item.createdAt) },
                ]}
              />
            ))
          ) : (
            <EmptyBlock title="No pending offline records" detail="Saved patrols and reports are synchronized." />
          )}
        </Stack>
      </Panel>
    </Stack>
  );
}
