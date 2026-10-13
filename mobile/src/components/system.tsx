import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { OfflineQueueItem } from '@/types/domain';

export const palette = {
  background: '#f7faf6',
  surface: '#ffffff',
  surfaceMuted: '#edf4ee',
  primary: '#14532d',
  primarySoft: '#dcefe2',
  primaryText: '#ffffff',
  accent: '#b7791f',
  danger: '#b42318',
  dangerSoft: '#fee4e2',
  warning: '#b54708',
  warningSoft: '#fef0c7',
  success: '#027a48',
  successSoft: '#dcfae6',
  info: '#175cd3',
  infoSoft: '#dbeafe',
  text: '#17211a',
  muted: '#607066',
  line: '#d7e2d9',
  shadow: '#0f2417',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  textStyle,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : palette.primary} /> : null}
      <Text
        numberOfLines={2}
        style={[
          styles.buttonText,
          variant !== 'primary' && styles.buttonTextSecondary,
          variant === 'danger' && styles.buttonTextDanger,
          textStyle,
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

type IconButtonProps = {
  label: string;
  icon: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
};

export function IconButton({ label, icon, onPress, disabled, variant = 'secondary' }: IconButtonProps) {
  return (
    <Button onPress={onPress} disabled={disabled} variant={variant} style={styles.iconButton}>
      <Text style={styles.iconGlyph}>{icon}</Text> {label}
    </Button>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  multiline?: boolean;
  error?: string;
  right?: ReactNode;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  multiline,
  error,
  right,
}: InputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error && styles.inputError, multiline && styles.inputShellMulti]}>
        <TextInput
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          secureTextEntry={secureTextEntry}
          style={[styles.input, multiline && styles.inputMulti]}
          value={value}
        />
        {right}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  compact,
}: {
  label?: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.segmentRow, compact && styles.segmentRowCompact]}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.segmentButton,
                selected && styles.segmentButtonSelected,
                pressed && styles.pressed,
              ]}>
              <Text
                numberOfLines={2}
                style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const content = <View style={[styles.card, style]}>{children}</View>;

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleGroup}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Screen({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <SectionHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </ScrollView>
  );
}

export function AppSafeArea({ children }: { children: ReactNode }) {
  return <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>;
}

export function StatusBadge({ value }: { value?: string | boolean | null }) {
  const text = typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : value ?? 'Unknown';
  const normalized = text.toUpperCase();
  const tone =
    normalized.includes('RESOLVED') ||
    normalized.includes('COMPLETED') ||
    normalized.includes('SYNCED') ||
    normalized.includes('ACTIVE')
      ? 'success'
      : normalized.includes('PENDING') ||
          normalized.includes('ASSIGNED') ||
          normalized.includes('REVIEW') ||
          normalized.includes('ACCEPTED')
        ? 'warning'
        : normalized.includes('DETECTED') ||
            normalized.includes('FAILED') ||
            normalized.includes('HIGH') ||
            normalized.includes('RESPONDING')
          ? 'danger'
          : 'info';

  return (
    <View
      style={[
        styles.badge,
        tone === 'success' && styles.badgeSuccess,
        tone === 'warning' && styles.badgeWarning,
        tone === 'danger' && styles.badgeDanger,
        tone === 'info' && styles.badgeInfo,
      ]}>
      <Text
        style={[
          styles.badgeText,
          tone === 'success' && styles.badgeTextSuccess,
          tone === 'warning' && styles.badgeTextWarning,
          tone === 'danger' && styles.badgeTextDanger,
          tone === 'info' && styles.badgeTextInfo,
        ]}>
        {formatLabel(text)}
      </Text>
    </View>
  );
}

export function LoadingState({ message = 'Loading latest field data...' }: { message?: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={palette.primary} />
      <Text style={styles.stateTitle}>{message}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{message}</Text>
      {action}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={[styles.stateBox, styles.errorState]}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry ? <Button onPress={onRetry} variant="secondary">Retry</Button> : null}
    </View>
  );
}

export function ToastMessage({
  message,
  tone = 'info',
}: {
  message?: string | null;
  tone?: 'success' | 'error' | 'info';
}) {
  if (!message) {
    return null;
  }

  return (
    <View
      style={[
        styles.toast,
        tone === 'success' && styles.toastSuccess,
        tone === 'error' && styles.toastError,
      ]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          <View style={styles.dialogActions}>
            <Button variant="secondary" onPress={onCancel}>Cancel</Button>
            <Button variant="danger" onPress={onConfirm}>{confirmLabel}</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function BottomNavigation<T extends string>({
  items,
  active,
  onChange,
}: {
  items: { key: T; label: string; icon: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const selected = item.key === active;

        return (
          <Pressable
            accessibilityRole="button"
            key={item.key}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [
              styles.bottomNavButton,
              selected && styles.bottomNavButtonActive,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.navIcon, selected && styles.navIconActive]}>{item.icon}</Text>
            <Text numberOfLines={1} style={[styles.bottomNavText, selected && styles.bottomNavTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Sidebar<T extends string>({
  brand,
  items,
  active,
  onChange,
  footer,
}: {
  brand: string;
  items: { key: T; label: string; icon: string }[];
  active: T;
  onChange: (key: T) => void;
  footer?: ReactNode;
}) {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarBrand}>{brand}</Text>
      <View style={styles.sidebarList}>
        {items.map((item) => {
          const selected = item.key === active;

          return (
            <Pressable
              accessibilityRole="button"
              key={item.key}
              onPress={() => onChange(item.key)}
              style={({ pressed }) => [
                styles.sidebarItem,
                selected && styles.sidebarItemActive,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.sidebarIcon, selected && styles.sidebarTextActive]}>{item.icon}</Text>
              <Text numberOfLines={1} style={[styles.sidebarText, selected && styles.sidebarTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {footer ? <View style={styles.sidebarFooter}>{footer}</View> : null}
    </View>
  );
}

export function TopHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.topHeader}>
      <View>
        <Text style={styles.topTitle}>{title}</Text>
        {subtitle ? <Text style={styles.topSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function DataGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'danger' | 'warning' | 'success' | 'info';
}) {
  return (
    <View
      style={[
        styles.metric,
        tone === 'danger' && styles.metricDanger,
        tone === 'warning' && styles.metricWarning,
        tone === 'success' && styles.metricSuccess,
        tone === 'info' && styles.metricInfo,
      ]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value ?? 'Not recorded'}</Text>
    </View>
  );
}

export function MapCard({
  title,
  points,
  zones,
}: {
  title: string;
  points: { id: string; label: string; latitude?: number | null; longitude?: number | null; tone?: string }[];
  zones?: { id: string; label: string; latitude?: number | null; longitude?: number | null; radius?: number; active?: boolean }[];
}) {
  const validPoints = points.filter(
    (point) => typeof point.latitude === 'number' && typeof point.longitude === 'number',
  );
  const validZones =
    zones?.filter((zone) => typeof zone.latitude === 'number' && typeof zone.longitude === 'number') ?? [];

  return (
    <View style={styles.mapCard}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>{title}</Text>
        <Text style={styles.mapSubtitle}>{validPoints.length + validZones.length} markers</Text>
      </View>
      <View style={styles.mapCanvas}>
        <View style={styles.mapGridLineH} />
        <View style={styles.mapGridLineV} />
        {validZones.map((zone) => (
          <View
            key={zone.id}
            style={[
              styles.zoneMarker,
              {
                left: `${normalizeLongitude(zone.longitude)}%`,
                top: `${normalizeLatitude(zone.latitude)}%`,
                width: Math.max(34, Math.min(96, (zone.radius ?? 800) / 80)),
                height: Math.max(34, Math.min(96, (zone.radius ?? 800) / 80)),
              },
              zone.active === false && styles.zoneMarkerInactive,
            ]}>
            <Text numberOfLines={1} style={styles.zoneMarkerText}>
              {zone.label}
            </Text>
          </View>
        ))}
        {validPoints.map((point) => (
          <View
            key={point.id}
            style={[
              styles.pointMarker,
              point.tone === 'danger' && styles.pointMarkerDanger,
              point.tone === 'warning' && styles.pointMarkerWarning,
              {
                left: `${normalizeLongitude(point.longitude)}%`,
                top: `${normalizeLatitude(point.latitude)}%`,
              },
            ]}>
            <Text numberOfLines={1} style={styles.pointLabel}>
              {point.label}
            </Text>
          </View>
        ))}
        {!validPoints.length && !validZones.length ? (
          <Text style={styles.mapEmpty}>No coordinate data available</Text>
        ) : null}
      </View>
    </View>
  );
}

export function QueueSummary({ queue }: { queue: OfflineQueueItem[] }) {
  return (
    <View style={styles.queueList}>
      {queue.length === 0 ? (
        <Text style={styles.stateText}>No pending sync items.</Text>
      ) : (
        queue.map((item) => (
          <View key={item.id} style={styles.queueItem}>
            <View>
              <Text style={styles.queueTitle}>{item.label}</Text>
              <Text style={styles.queueMeta}>
                {item.method} {item.endpoint}
              </Text>
            </View>
            <StatusBadge value={`Pending sync${item.attempts ? ` ${item.attempts}` : ''}`} />
          </View>
        ))
      )}
    </View>
  );
}

export function formatLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatDate(value?: string | null) {
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function compactCoordinate(value?: number | null) {
  if (typeof value !== 'number') {
    return 'Unknown';
  }

  return value.toFixed(5);
}

function normalizeLongitude(value?: number | null) {
  if (typeof value !== 'number') {
    return 50;
  }

  return Math.min(94, Math.max(4, ((value + 180) / 360) * 100));
}

function normalizeLatitude(value?: number | null) {
  if (typeof value !== 'number') {
    return 50;
  }

  return Math.min(92, Math.max(6, ((90 - value) / 180) * 100));
}

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  screenContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 104,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  sectionTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonDanger: {
    backgroundColor: palette.dangerSoft,
    borderColor: '#fecdca',
  },
  buttonDisabled: {
    opacity: 0.56,
  },
  pressed: {
    opacity: 0.75,
  },
  buttonText: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: palette.primary,
  },
  buttonTextDanger: {
    color: palette.danger,
  },
  iconButton: {
    paddingHorizontal: spacing.md,
  },
  iconGlyph: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  inputShellMulti: {
    alignItems: 'flex-start',
    minHeight: 112,
    paddingVertical: spacing.sm,
  },
  inputError: {
    borderColor: palette.danger,
  },
  input: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  inputMulti: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  fieldError: {
    color: palette.danger,
    fontSize: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  segmentRowCompact: {
    gap: spacing.xs,
  },
  segmentButton: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentButtonSelected: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  segmentText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextSelected: {
    color: palette.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeSuccess: {
    backgroundColor: palette.successSoft,
  },
  badgeWarning: {
    backgroundColor: palette.warningSoft,
  },
  badgeDanger: {
    backgroundColor: palette.dangerSoft,
  },
  badgeInfo: {
    backgroundColor: palette.infoSoft,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextSuccess: {
    color: palette.success,
  },
  badgeTextWarning: {
    color: palette.warning,
  },
  badgeTextDanger: {
    color: palette.danger,
  },
  badgeTextInfo: {
    color: palette.info,
  },
  stateBox: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorState: {
    backgroundColor: '#fff8f7',
  },
  stateTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  toast: {
    backgroundColor: palette.infoSoft,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
  },
  toastSuccess: {
    backgroundColor: palette.successSoft,
    borderColor: '#abefc6',
  },
  toastError: {
    backgroundColor: palette.dangerSoft,
    borderColor: '#fecdca',
  },
  toastText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 36, 23, 0.36)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalPanel: {
    backgroundColor: palette.surface,
    borderRadius: 8,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.xl,
    width: '100%',
  },
  modalTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
  },
  modalText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  bottomNav: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
  },
  bottomNavButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    gap: 2,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  bottomNavButtonActive: {
    backgroundColor: palette.primarySoft,
  },
  navIcon: {
    color: palette.muted,
    fontSize: 17,
    fontWeight: '900',
  },
  navIconActive: {
    color: palette.primary,
  },
  bottomNavText: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  bottomNavTextActive: {
    color: palette.primary,
  },
  sidebar: {
    backgroundColor: palette.primary,
    gap: spacing.xl,
    padding: spacing.xl,
    width: 264,
  },
  sidebarBrand: {
    color: palette.primaryText,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  sidebarList: {
    gap: spacing.xs,
  },
  sidebarItem: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  sidebarIcon: {
    color: '#dcefe2',
    fontSize: 14,
    fontWeight: '900',
    width: 20,
  },
  sidebarText: {
    color: '#e7f6ea',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  sidebarTextActive: {
    color: '#ffffff',
  },
  sidebarFooter: {
    marginTop: 'auto',
  },
  topHeader: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 76,
    paddingHorizontal: spacing.xl,
  },
  topTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
  },
  topSubtitle: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 160,
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  metricDanger: {
    borderColor: '#fecdca',
  },
  metricWarning: {
    borderColor: '#fedf89',
  },
  metricSuccess: {
    borderColor: '#abefc6',
  },
  metricInfo: {
    borderColor: '#bfdbfe',
  },
  metricLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '900',
  },
  detailRow: {
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    color: palette.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  detailValue: {
    color: palette.text,
    flex: 1.4,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  mapCard: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapHeader: {
    alignItems: 'center',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  mapTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900',
  },
  mapSubtitle: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  mapCanvas: {
    aspectRatio: 16 / 9,
    backgroundColor: '#eaf2e4',
    minHeight: 220,
    position: 'relative',
  },
  mapGridLineH: {
    backgroundColor: 'rgba(20, 83, 45, 0.14)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  mapGridLineV: {
    backgroundColor: 'rgba(20, 83, 45, 0.14)',
    bottom: 0,
    left: '50%',
    position: 'absolute',
    top: 0,
    width: 1,
  },
  pointMarker: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    marginLeft: -9,
    marginTop: -9,
    minWidth: 18,
    position: 'absolute',
  },
  pointMarkerDanger: {
    backgroundColor: palette.danger,
  },
  pointMarkerWarning: {
    backgroundColor: palette.warning,
  },
  pointLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    maxWidth: 84,
    paddingHorizontal: 6,
  },
  zoneMarker: {
    alignItems: 'center',
    backgroundColor: 'rgba(180, 35, 24, 0.16)',
    borderColor: 'rgba(180, 35, 24, 0.74)',
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    marginLeft: -22,
    marginTop: -22,
    position: 'absolute',
  },
  zoneMarkerInactive: {
    backgroundColor: 'rgba(96, 112, 102, 0.12)',
    borderColor: 'rgba(96, 112, 102, 0.5)',
  },
  zoneMarkerText: {
    color: palette.danger,
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: spacing.xs,
    textAlign: 'center',
  },
  mapEmpty: {
    alignSelf: 'center',
    color: palette.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 96,
  },
  queueList: {
    gap: spacing.sm,
  },
  queueItem: {
    alignItems: 'center',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  queueTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
  },
  queueMeta: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
