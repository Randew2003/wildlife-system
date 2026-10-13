import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { compactCoordinate, formatLabel, statusTone } from '@/features/app/helpers';
import type { PatrolLocation } from '@/types/domain';

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function AppFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SafeAreaView className={cx('flex-1 bg-slate-100', className)} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cx('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      {children}
    </View>
  );
}

export function Stack({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cx('gap-3', className)}>{children}</View>;
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cx('flex-row flex-wrap items-center gap-2', className)}>{children}</View>;
}

export function MessageBanner({
  message,
  tone = 'sky',
}: {
  message?: string | null;
  tone?: 'green' | 'amber' | 'red' | 'sky';
}) {
  if (!message) {
    return null;
  }

  const tones = {
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
  };

  return (
    <View className={cx('rounded-lg border p-3', tones[tone])}>
      <Text className={cx('text-sm font-semibold', tones[tone])}>{message}</Text>
    </View>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="gap-1">
      {eyebrow ? <Text className="text-xs font-semibold uppercase text-forest-700">{eyebrow}</Text> : null}
      <Text className="text-2xl font-bold text-slate-950">{title}</Text>
      {subtitle ? <Text className="text-sm leading-5 text-slate-600">{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-lg font-bold text-slate-950">{title}</Text>
        {subtitle ? <Text className="text-sm leading-5 text-slate-600">{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
  className?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  className,
}: ButtonProps) {
  const base =
    'min-h-11 flex-row items-center justify-center rounded-md px-4 py-3 active:opacity-80';
  const variants = {
    primary: 'bg-forest-600',
    secondary: 'border border-slate-300 bg-white',
    danger: 'bg-red-600',
    ghost: 'bg-slate-100',
  };
  const textVariants = {
    primary: 'text-white',
    secondary: 'text-slate-900',
    danger: 'text-white',
    ghost: 'text-slate-800',
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      className={cx(base, variants[variant], (disabled || busy) && 'opacity-60', className)}
    >
      {busy ? <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#0f172a' : '#ffffff'} /> : null}
      <Text className={cx('text-center text-sm font-bold', textVariants[variant], busy && 'ml-2')}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ActionTile({
  title,
  detail,
  onPress,
  tone = 'green',
  disabled = false,
}: {
  title: string;
  detail?: string;
  onPress?: () => void;
  tone?: 'green' | 'amber' | 'red' | 'sky' | 'slate';
  disabled?: boolean;
}) {
  const tones = {
    green: {
      shell: 'border-forest-100 bg-forest-50',
      badge: 'bg-forest-600',
      text: 'text-forest-700',
    },
    amber: {
      shell: 'border-amber-200 bg-amber-50',
      badge: 'bg-amber-500',
      text: 'text-amber-800',
    },
    red: {
      shell: 'border-red-200 bg-red-50',
      badge: 'bg-red-600',
      text: 'text-red-700',
    },
    sky: {
      shell: 'border-sky-200 bg-sky-50',
      badge: 'bg-sky-600',
      text: 'text-sky-700',
    },
    slate: {
      shell: 'border-slate-200 bg-slate-50',
      badge: 'bg-slate-500',
      text: 'text-slate-700',
    },
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={cx(
        'min-h-24 min-w-40 flex-1 rounded-lg border p-4 active:opacity-80',
        tones[tone].shell,
        disabled && 'opacity-60',
      )}
    >
      <View className="flex-row items-center gap-3">
        <View className={cx('h-9 w-9 items-center justify-center rounded-full', tones[tone].badge)}>
          <Text className="text-base font-black text-white">{title.charAt(0)}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-slate-950">{title}</Text>
          {detail ? <Text className={cx('mt-1 text-xs font-semibold leading-4', tones[tone].text)}>{detail}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  helper?: string;
  keyboard?: KeyboardTypeOptions;
};

export function Field({ label, error, helper, keyboard, className, ...props }: FieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-semibold text-slate-800">{label}</Text>
      <TextInput
        {...props}
        keyboardType={keyboard}
        placeholderTextColor="#94a3b8"
        className={cx(
          'min-h-11 rounded-md border bg-white px-3 py-2 text-base text-slate-950',
          error ? 'border-red-400' : 'border-slate-300',
          props.multiline && 'min-h-24 text-top',
          className,
        )}
      />
      {error ? <Text className="text-xs font-semibold text-red-600">{error}</Text> : null}
      {!error && helper ? <Text className="text-xs text-slate-500">{helper}</Text> : null}
    </View>
  );
}

export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  value: T;
  options: readonly { label: string; value: T }[];
  onChange: (value: T) => void;
  error?: string;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-slate-800">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => onChange(option.value)}
              className={cx(
                'rounded-md border px-3 py-2',
                selected ? 'border-forest-600 bg-forest-50' : 'border-slate-300 bg-white',
              )}
            >
              <Text className={cx('text-sm font-semibold', selected ? 'text-forest-700' : 'text-slate-700')}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-xs font-semibold text-red-600">{error}</Text> : null}
    </View>
  );
}

export function StatusPill({ status, className }: { status?: string | null; className?: string }) {
  const tone = statusTone(status);
  const tones = {
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <View className={cx('self-start rounded-md border px-2.5 py-1', tones[tone], className)}>
      <Text className={cx('text-xs font-bold', tones[tone])}>{formatLabel(status)}</Text>
    </View>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'green' | 'amber' | 'red' | 'sky' | 'slate';
}) {
  const tones = {
    green: 'border-green-200 bg-green-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
    sky: 'border-sky-200 bg-sky-50',
    slate: 'border-slate-200 bg-slate-50',
  };

  return (
    <View className={cx('min-w-36 flex-1 rounded-lg border p-4', tones[tone])}>
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <Text className="mt-2 text-2xl font-bold text-slate-950">{value}</Text>
      {detail ? <Text className="mt-1 text-xs text-slate-600">{detail}</Text> : null}
    </View>
  );
}

export function DataCard({
  title,
  subtitle,
  status,
  rows,
  actions,
}: {
  title: string;
  subtitle?: string;
  status?: string | null;
  rows?: { label: string; value: string | number | null | undefined }[];
  actions?: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-slate-950">{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm text-slate-600">{subtitle}</Text> : null}
        </View>
        {status ? <StatusPill status={status} /> : null}
      </View>
      {rows?.length ? (
        <View className="gap-2">
          {rows.map((row) => (
            <View className="flex-row justify-between gap-4" key={`${row.label}-${row.value}`}>
              <Text className="text-sm text-slate-500">{row.label}</Text>
              <Text className="min-w-0 flex-1 text-right text-sm font-semibold text-slate-800">
                {String(row.value ?? 'Not set')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {actions ? <View className="flex-row flex-wrap gap-2">{actions}</View> : null}
    </View>
  );
}

export function NotificationCard({
  title,
  subtitle,
  status,
  time,
  detail,
  rows,
  actions,
  tone = 'red',
}: {
  title: string;
  subtitle?: string;
  status?: string | null;
  time?: string;
  detail?: string;
  rows?: { label: string; value: string | number | null | undefined }[];
  actions?: ReactNode;
  tone?: 'red' | 'amber' | 'green' | 'sky' | 'slate';
}) {
  const tones = {
    red: {
      shell: 'border-red-200 bg-red-50',
      icon: 'bg-red-600',
      halo: 'bg-red-100',
      text: 'text-red-700',
      dot: 'bg-red-600',
    },
    amber: {
      shell: 'border-amber-200 bg-amber-50',
      icon: 'bg-amber-500',
      halo: 'bg-amber-100',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
    },
    green: {
      shell: 'border-green-200 bg-green-50',
      icon: 'bg-green-600',
      halo: 'bg-green-100',
      text: 'text-green-700',
      dot: 'bg-green-600',
    },
    sky: {
      shell: 'border-sky-200 bg-sky-50',
      icon: 'bg-sky-600',
      halo: 'bg-sky-100',
      text: 'text-sky-700',
      dot: 'bg-sky-600',
    },
    slate: {
      shell: 'border-slate-200 bg-white',
      icon: 'bg-slate-600',
      halo: 'bg-slate-100',
      text: 'text-slate-600',
      dot: 'bg-slate-500',
    },
  };

  return (
    <View className={cx('gap-3 rounded-lg border p-4', tones[tone].shell)}>
      <View className="flex-row gap-3">
        <View className={cx('h-12 w-12 items-center justify-center rounded-full', tones[tone].halo)}>
          <View className={cx('h-7 w-7 items-center justify-center rounded-full', tones[tone].icon)}>
            <View className="h-2.5 w-2.5 rounded-full bg-white" />
          </View>
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-start justify-between gap-2">
            <Text className="min-w-0 flex-1 text-base font-bold text-slate-950">{title}</Text>
            {status ? <StatusPill status={status} /> : null}
          </View>
          {subtitle ? <Text className="mt-1 text-sm leading-5 text-slate-700">{subtitle}</Text> : null}
          {time ? <Text className={cx('mt-1 text-xs font-semibold', tones[tone].text)}>{time}</Text> : null}
        </View>
      </View>
      {detail ? <Text className="text-sm leading-5 text-slate-700">{detail}</Text> : null}
      {rows?.length ? (
        <View className="gap-2 rounded-lg bg-white/70 p-3">
          {rows.map((row) => (
            <View className="flex-row justify-between gap-4" key={`${row.label}-${row.value}`}>
              <Text className="text-xs font-semibold uppercase text-slate-500">{row.label}</Text>
              <Text className="min-w-0 flex-1 text-right text-sm font-bold text-slate-900">
                {String(row.value ?? 'Not set')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {actions ? <View className="flex-row flex-wrap gap-2">{actions}</View> : null}
    </View>
  );
}

export function MiniMap({
  latitude,
  longitude,
  title = 'Location',
}: {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
}) {
  return (
    <View className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
      <View className="h-40 justify-between p-4">
        <View className="absolute left-0 top-0 h-full w-full opacity-70">
          <View className="absolute left-8 top-4 h-36 w-0.5 bg-slate-700" />
          <View className="absolute left-20 top-0 h-40 w-0.5 bg-slate-700" />
          <View className="absolute left-0 top-10 h-0.5 w-full bg-slate-700" />
          <View className="absolute left-0 top-24 h-0.5 w-full bg-slate-700" />
          <View className="absolute bottom-5 right-7 h-24 w-24 rounded-full border border-amber-300/70" />
          <View className="absolute left-28 top-12 h-20 w-20 rounded-full border border-forest-100/70" />
        </View>
        <View className="z-10 flex-row items-start justify-between gap-3">
          <View>
            <Text className="text-xs font-semibold uppercase text-slate-300">{title}</Text>
            <Text className="mt-1 text-sm font-bold text-white">{compactCoordinate(latitude, longitude)}</Text>
          </View>
          <View className="rounded-md bg-white/15 px-2 py-1">
            <Text className="text-xs font-bold text-white">Live map</Text>
          </View>
        </View>
        <View className="z-10 self-center rounded-full border-4 border-white bg-red-500 p-2 shadow" />
      </View>
    </View>
  );
}

export function RouteMap({
  title = 'Assigned route',
  routeSummary,
  startLatitude,
  startLongitude,
  endLatitude,
  endLongitude,
  currentLatitude,
  currentLongitude,
  recordedLocations = [],
}: {
  title?: string;
  routeSummary?: string;
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  recordedLocations?: PatrolLocation[];
}) {
  const hasRoute =
    typeof startLatitude === 'number' &&
    typeof startLongitude === 'number' &&
    typeof endLatitude === 'number' &&
    typeof endLongitude === 'number';

  return (
    <View className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
      <View className="h-56 p-4">
        <View className="absolute left-0 top-0 h-full w-full opacity-70">
          <View className="absolute left-8 top-0 h-full w-0.5 bg-slate-800" />
          <View className="absolute left-24 top-0 h-full w-0.5 bg-slate-800" />
          <View className="absolute right-16 top-0 h-full w-0.5 bg-slate-800" />
          <View className="absolute left-0 top-12 h-0.5 w-full bg-slate-800" />
          <View className="absolute left-0 top-28 h-0.5 w-full bg-slate-800" />
          <View className="absolute bottom-8 left-0 h-0.5 w-full bg-slate-800" />
        </View>

        <View className="z-10 flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-semibold uppercase text-slate-300">{title}</Text>
            <Text className="mt-1 text-sm font-bold text-white">
              {hasRoute
                ? routeSummary ?? `${compactCoordinate(startLatitude, startLongitude)} -> ${compactCoordinate(endLatitude, endLongitude)}`
                : 'Route coordinates not set'}
            </Text>
          </View>
          <View className="rounded-md bg-white/15 px-2 py-1">
            <Text className="text-xs font-bold text-white">Route map</Text>
          </View>
        </View>

        {hasRoute ? (
          <>
            <View className="absolute left-12 top-40 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
            <View className="absolute right-12 top-20 h-4 w-4 rounded-full border-2 border-white bg-red-500" />
            <View
              className="absolute left-20 top-32 h-1 rounded-full bg-amber-300"
              style={{
                width: 210,
                transform: [{ rotate: '-24deg' }],
              }}
            />
            <View
              className="absolute right-20 top-24 h-1 rounded-full bg-amber-300"
              style={{
                width: 95,
                transform: [{ rotate: '24deg' }],
              }}
            />
            {recordedLocations.slice(0, 6).map((location, index) => (
              <View
                className="absolute h-2.5 w-2.5 rounded-full border border-white bg-sky-400"
                key={location.id}
                style={{
                  left: 78 + index * 26,
                  top: 136 - index * 10,
                }}
              />
            ))}
            {typeof currentLatitude === 'number' && typeof currentLongitude === 'number' ? (
              <View className="absolute left-1/2 top-1/2 h-5 w-5 rounded-full border-4 border-white bg-sky-500" />
            ) : null}
            <View className="absolute bottom-3 left-4 flex-row gap-3">
              <Text className="text-xs font-bold text-green-200">Start</Text>
              <Text className="text-xs font-bold text-amber-200">Route</Text>
              <Text className="text-xs font-bold text-sky-200">GPS</Text>
              <Text className="text-xs font-bold text-red-200">End</Text>
            </View>
          </>
        ) : (
          <View className="absolute inset-x-4 bottom-4 rounded-lg bg-white/10 p-3">
            <Text className="text-sm font-semibold text-white">
              Add start and end coordinates when creating the route from the manager dashboard.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function EmptyBlock({ title, detail }: { title: string; detail?: string }) {
  return (
    <View className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
      <Text className="text-base font-bold text-slate-900">{title}</Text>
      {detail ? <Text className="mt-1 text-sm leading-5 text-slate-600">{detail}</Text> : null}
    </View>
  );
}

export function LoadingBlock({ label = 'Loading data' }: { label?: string }) {
  return (
    <View className="items-center justify-center rounded-lg border border-slate-200 bg-white p-6">
      <ActivityIndicator color="#276749" />
      <Text className="mt-3 text-sm font-semibold text-slate-600">{label}</Text>
    </View>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <Text className="text-sm font-semibold text-red-700">{message}</Text>
      {onRetry ? <Button label="Retry" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function ValidationBlock({ errors }: { errors: string[] }) {
  if (!errors.length) {
    return null;
  }

  return (
    <View className="gap-1 rounded-lg border border-red-200 bg-red-50 p-3">
      {errors.map((error) => (
        <Text className="text-sm font-semibold text-red-700" key={error}>
          {error}
        </Text>
      ))}
    </View>
  );
}

export function TextLinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="py-2">
      <Text className="text-center text-sm font-bold text-forest-700">{label}</Text>
    </Pressable>
  );
}
