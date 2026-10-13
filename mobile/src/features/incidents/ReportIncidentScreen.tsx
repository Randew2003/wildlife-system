import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Image, Pressable, Text, View } from 'react-native';

import MapView, { Marker } from '../../components/MapView';
import type { MapPressEvent, MapRegion } from '../../components/MapView.types';
import { incidentOptions } from '@/features/app/constants';
import type { FormErrors } from '@/features/app/helpers';
import {
  parseNumber,
  validateLatitude,
  validateLongitude,
} from '@/features/app/helpers';
import {
  Button,
  Field,
  MessageBanner,
  MiniMap,
  Panel,
  SectionTitle,
  Stack,
  StatusPill,
} from '@/features/app/native-ui';
import { ApiError, incidentApi } from '@/services/api';
import {
  enqueueOffline,
  flushOfflineQueue,
  getOfflineQueue,
  recordOfflineQueueFailure,
} from '@/services/offline';
import type {
  AuthSession,
  IncidentStatus,
  IncidentType,
  LocationSource,
  WildlifeIncidentPayload,
} from '@/types/domain';

type SubmissionConfirmation = {
  reference: string;
  incidentId: number | null;
  status: IncidentStatus;
  offline: boolean;
};

const manualMapRegion: MapRegion = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 0.65,
  longitudeDelta: 0.65,
};

export function ReportIncidentScreen({
  session,
  onSubmitted,
}: {
  session: AuthSession;
  onSubmitted?: () => void;
}) {
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [incidentTypeExpanded, setIncidentTypeExpanded] = useState(false);
  const [photoActionsExpanded, setPhotoActionsExpanded] = useState(false);
  const [manualLocationExpanded, setManualLocationExpanded] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pickingPhotos, setPickingPhotos] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<SubmissionConfirmation | null>(null);

  useEffect(() => {
    if (!confirmation?.offline) {
      return undefined;
    }

    let active = true;

    const refreshQueuedStatus = async () => {
      try {
        const queue = await getOfflineQueue();
        const queuedReport = queue.find((item) => item.id === confirmation.reference);

        if (active) {
          const nextStatus: IncidentStatus = queuedReport
            ? queuedReport.attempts > 0
              ? 'SYNC_FAILED'
              : 'PENDING_SYNC'
            : 'SYNCED';

          if (nextStatus === 'SYNCED' && confirmation.status !== 'SYNCED') {
            onSubmitted?.();
          }

          setConfirmation((current) => {
            if (!current || current.reference !== confirmation.reference) {
              return current;
            }

            if (current.status === nextStatus) {
              return current;
            }

            return {
              ...current,
              status: nextStatus,
            };
          });
        }
      } catch (exception) {
        if (active) {
          setMessage(
            exception instanceof Error
              ? `Unable to check sync status: ${exception.message}`
              : 'Unable to check sync status.',
          );
        }
      }
    };

    void refreshQueuedStatus();
    const timer = setInterval(() => void refreshQueuedStatus(), 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [confirmation?.offline, confirmation?.reference, confirmation?.status, onSubmitted]);

  const clearError = (field: string) => {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const selectManualLocation = (event: MapPressEvent) => {
    const { latitude: selectedLatitude, longitude: selectedLongitude } =
      event.nativeEvent.coordinate;
    setLatitude(String(selectedLatitude));
    setLongitude(String(selectedLongitude));
    setLocationSource('MANUAL');
    setLocationMessage(null);
    clearError('latitude');
    clearError('longitude');
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const latitudeError = latitude.trim()
      ? validateLatitude(latitude)
      : 'Latitude is required.';
    const longitudeError = longitude.trim()
      ? validateLongitude(longitude)
      : 'Longitude is required.';

    if (!incidentType) {
      nextErrors.incidentType = 'Select an incident type.';
    }

    if (!photoUrls.length) {
      nextErrors.photoUrls = 'Add at least one photo as evidence.';
    } else if (photoUrls.length > 5) {
      nextErrors.photoUrls = 'You can add up to 5 photos.';
    }

    if (latitudeError) {
      nextErrors.latitude = latitudeError;
    }

    if (longitudeError) {
      nextErrors.longitude = longitudeError;
    }

    if (latitudeError || longitudeError || !locationSource) {
      setManualLocationExpanded(true);
      if (!locationSource && !latitudeError && !longitudeError) {
        nextErrors.latitude = 'Select a location using GPS or the map.';
      }
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    } else if (description.length > 500) {
      nextErrors.description = 'Description must be 500 characters or fewer.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const addPhotos = async (source: 'camera' | 'gallery') => {
    const remainingSlots = 5 - photoUrls.length;

    if (remainingSlots <= 0) {
      return;
    }

    setPickingPhotos(true);
    setMessage(null);

    try {
      const currentPermission =
        source === 'camera'
          ? await ImagePicker.getCameraPermissionsAsync()
          : await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setErrors((current) => ({
          ...current,
          photoUrls:
            source === 'camera'
              ? 'Camera permission is required to take an evidence photo.'
              : 'Photo library permission is required to attach evidence.',
        }));
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsMultipleSelection: true,
              selectionLimit: remainingSlots,
              quality: 0.8,
            });

      if (!result.canceled) {
        setPhotoUrls((current) => [
          ...current,
            ...new Set(result.assets.map((asset) => asset.uri).filter((uri) => !current.includes(uri))),
        ].slice(0, 5));
        clearError('photoUrls');
      }
    } catch (exception) {
      setErrors((current) => ({
        ...current,
        photoUrls:
          exception instanceof Error
            ? `Unable to ${source === 'camera' ? 'take a photo' : 'open photos'}: ${exception.message}`
            : `Unable to ${source === 'camera' ? 'take a photo' : 'open photos'}. Please try again.`,
      }));
    } finally {
      setPickingPhotos(false);
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    setLocationMessage(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationMessage('Location permission was denied. Enter the coordinates manually below.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
      setLocationSource('GPS');
      setManualLocationExpanded(false);
      clearError('latitude');
      clearError('longitude');
    } catch (exception) {
      const reason = exception instanceof Error ? ` ${exception.message}` : '';
      setLocationMessage(
        `Unable to get your current location. Check location services or enter coordinates manually.${reason}`,
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const savePendingReport = async (payload: WildlifeIncidentPayload) => {
    const queued = await enqueueOffline({
      label: `Wildlife incident ${payload.incidentType}`,
      endpoint: '/api/v1/incidents',
      method: 'POST',
      body: payload,
    });
    setConfirmation({
      reference: queued.id,
      incidentId: null,
      status: 'PENDING_SYNC',
      offline: true,
    });
    setPhotoUrls([]);
    setDescription('');
    setMessage(null);
    onSubmitted?.();
  };

  const submit = async () => {
    if (!validate() || !incidentType) {
      return;
    }

    const latitudeValue = parseNumber(latitude);
    const longitudeValue = parseNumber(longitude);

    if (latitudeValue === null || longitudeValue === null) {
      return;
    }

    const payload: WildlifeIncidentPayload = {
      incidentType,
      latitude: latitudeValue,
      longitude: longitudeValue,
      description: description.trim(),
      photoUrls,
    };

    setSaving(true);
    setMessage(null);
    setConfirmation(null);

    try {
      const networkState = await Network.getNetworkStateAsync().catch(() => null);
      const isOnline =
        networkState?.isConnected === true && networkState.isInternetReachable !== false;

      if (!isOnline) {
        await savePendingReport(payload);
        return;
      }

      try {
        const saved = await incidentApi.create(session.token, payload);
        setConfirmation({
          reference: String(saved.id),
          incidentId: saved.id,
          status: 'SYNCED',
          offline: false,
        });
        setDescription('');
        setPhotoUrls([]);
        onSubmitted?.();
      } catch (exception) {
        if (exception instanceof ApiError && exception.status < 500) {
          setMessage(`Incident could not be submitted: ${exception.message}`);
          return;
        }

        await savePendingReport(payload);
      }
    } catch (exception) {
      const reason = exception instanceof Error ? ` ${exception.message}` : '';
      setMessage(`Unable to save this report for synchronization.${reason}`);
    } finally {
      setSaving(false);
    }
  };

  const retrySync = async () => {
    if (!confirmation) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (confirmation.offline) {
        const networkState = await Network.getNetworkStateAsync().catch(() => null);
        const isOnline =
          networkState?.isConnected === true && networkState.isInternetReachable !== false;

        if (!isOnline) {
          const stillQueued = await recordOfflineQueueFailure(confirmation.reference);
          setConfirmation((current) =>
            current ? { ...current, status: stillQueued ? 'SYNC_FAILED' : 'SYNCED' } : current,
          );
          if (stillQueued) {
            setMessage('Sync Failed. Check your connection and retry.');
          } else {
            onSubmitted?.();
          }
          return;
        }

        const result = await flushOfflineQueue(
          session.token,
          confirmation.reference,
          '/api/v1/incidents',
        );
        const stillQueued = result.remaining.some((item) => item.id === confirmation.reference);
        setConfirmation((current) =>
          current
            ? { ...current, status: stillQueued ? 'SYNC_FAILED' : 'SYNCED' }
            : current,
        );
        if (stillQueued) {
          setMessage('Sync Failed. Check your connection and retry.');
        }
      } else if (confirmation.incidentId) {
        const synced = await incidentApi.retrySync(session.token, confirmation.incidentId);
        setConfirmation({
          ...confirmation,
          status: synced.status,
        });
      }
      onSubmitted?.();
    } catch (exception) {
      setMessage(
        exception instanceof Error
          ? `Sync Failed: ${exception.message}`
          : 'Sync Failed. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const parsedLatitude = latitude.trim() ? parseNumber(latitude) : null;
  const parsedLongitude = longitude.trim() ? parseNumber(longitude) : null;
  const validLocation =
    locationSource !== null &&
    parsedLatitude !== null &&
    parsedLongitude !== null &&
    !validateLatitude(latitude) &&
    !validateLongitude(longitude);
  const selectedIncidentType = incidentOptions.find((option) => option.value === incidentType);

  return (
    <Stack className="gap-4">
        <SectionTitle
          title="Report Wildlife Incident"
          subtitle="Record a wildlife threat or sign so park teams can respond."
        />
        <Panel className="shadow-none">
          <Stack>
            <Text className="text-sm font-semibold text-slate-800">Incident Type *</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select incident type"
              accessibilityState={{ expanded: incidentTypeExpanded }}
              disabled={saving}
              onPress={() => setIncidentTypeExpanded((expanded) => !expanded)}
              className={`min-h-12 flex-row items-center justify-between rounded-md border bg-white px-3 ${
                errors.incidentType ? 'border-red-400' : 'border-slate-300'
              }`}
            >
              <Text className={selectedIncidentType ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-500'}>
                {selectedIncidentType?.label ?? 'Select Incident Type'}
              </Text>
              <Text className="text-slate-500">{incidentTypeExpanded ? '▲' : '▼'}</Text>
            </Pressable>
            {incidentTypeExpanded ? (
              <View className="overflow-hidden rounded-md border border-slate-200 bg-white">
                {incidentOptions.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => {
                      setIncidentType(option.value);
                      setIncidentTypeExpanded(false);
                      clearError('incidentType');
                    }}
                    className={`min-h-11 justify-center border-b border-slate-100 px-3 ${
                      option.value === incidentType ? 'bg-forest-50' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        option.value === incidentType
                          ? 'font-bold text-forest-700'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {errors.incidentType ? (
              <Text className="text-xs font-semibold text-red-600">{errors.incidentType}</Text>
            ) : null}
          </Stack>
        </Panel>
        <Panel className="shadow-none">
          <Stack>
            <Text className="text-sm font-semibold text-slate-800">Photo / Evidence *</Text>
            <View className="flex-row flex-wrap gap-2">
              {photoUrls.map((uri, index) => (
                <View key={uri} className="relative">
                  <Image
                    source={{ uri }}
                    accessibilityLabel={`Incident evidence photo ${index + 1}`}
                    className="h-20 w-20 rounded-md"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    disabled={saving}
                    onPress={() => {
                      setPhotoUrls((current) => current.filter((photoUri) => photoUri !== uri));
                      clearError('photoUrls');
                    }}
                    className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white"
                  >
                    <Text className="text-sm font-bold text-slate-700">×</Text>
                  </Pressable>
                </View>
              ))}
              {photoUrls.length < 5 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add photo evidence"
                  accessibilityState={{ expanded: photoActionsExpanded }}
                  disabled={saving || pickingPhotos}
                  onPress={() => setPhotoActionsExpanded((expanded) => !expanded)}
                  className={`h-20 w-20 items-center justify-center rounded-md border border-dashed ${
                    errors.photoUrls ? 'border-red-400 bg-red-50' : 'border-forest-300 bg-forest-50'
                  }`}
                >
                  <Text className="text-xl font-semibold text-forest-700">+</Text>
                  <Text className="text-xs font-semibold text-forest-700">Add Photo</Text>
                </Pressable>
              ) : null}
            </View>
            {photoActionsExpanded ? (
              <View className="flex-row flex-wrap gap-2">
                <Button
                  label="Take Photo"
                  variant="secondary"
                  className="min-w-36 flex-1"
                  onPress={() => {
                    setPhotoActionsExpanded(false);
                    void addPhotos('camera');
                  }}
                  busy={pickingPhotos}
                  disabled={saving}
                />
                <Button
                  label="Choose from Gallery"
                  variant="secondary"
                  className="min-w-36 flex-1"
                  onPress={() => {
                    setPhotoActionsExpanded(false);
                    void addPhotos('gallery');
                  }}
                  busy={pickingPhotos}
                  disabled={saving}
                />
              </View>
            ) : null}
            <Text className="text-xs text-slate-500">JPG, PNG · Max 5 photos</Text>
            <Text className="text-right text-xs font-medium text-slate-500">
              {photoUrls.length} / 5
            </Text>
            {errors.photoUrls ? (
              <Text className="text-xs font-semibold text-red-600">{errors.photoUrls}</Text>
            ) : null}
          </Stack>
        </Panel>
        <Panel className="shadow-none">
          <Stack>
            <Text className="text-sm font-semibold text-slate-800">Location *</Text>
            <Button
              label={gettingLocation ? 'Capturing location...' : 'Use Current Location'}
              variant="secondary"
              onPress={() => void getCurrentLocation()}
              busy={gettingLocation}
              disabled={saving}
              className={errors.latitude || errors.longitude ? 'border-red-400' : ''}
            />
            {locationMessage ? (
              <View className="gap-1 rounded-md border border-red-200 bg-red-50 p-3">
                <Text className="text-sm font-bold text-red-700">GPS Unavailable</Text>
                <Text className="text-xs text-red-700">Unable to capture location</Text>
                <Text className="text-xs text-red-700">{locationMessage}</Text>
              </View>
            ) : null}
            {locationSource === 'GPS' && parsedLatitude !== null && parsedLongitude !== null ? (
              <View className="rounded-md border border-forest-100 bg-forest-50 p-3">
                <Text className="text-xs font-semibold text-forest-700">Current GPS</Text>
                <Text className="mt-1 text-sm font-medium text-slate-800">
                  {parsedLatitude.toFixed(5)}, {parsedLongitude.toFixed(5)}
                </Text>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: manualLocationExpanded }}
              disabled={saving || gettingLocation}
              onPress={() => {
                const expanding = !manualLocationExpanded;
                setManualLocationExpanded(expanding);
              }}
              className="min-h-11 justify-center rounded-md border border-slate-200 bg-white px-3"
            >
              <Text className="text-sm font-semibold text-slate-800">
                {manualLocationExpanded ? 'Hide Manual Location' : 'Select Location Manually'}
              </Text>
              {!manualLocationExpanded ? (
                <Text className="mt-1 text-xs text-slate-500">
                  Use manual coordinates if GPS is unavailable
                </Text>
              ) : null}
            </Pressable>
            {manualLocationExpanded ? (
              <View className="gap-2">
                <Text className="text-xs text-slate-600">
                  Tap the map to place a pin at the incident location.
                </Text>
                <View className="overflow-hidden rounded-lg border border-slate-200">
                  <MapView
                    accessibilityLabel="Manual incident location map"
                    initialRegion={manualMapRegion}
                    onPress={selectManualLocation}
                    scrollEnabled
                    style={{ height: 220, width: '100%' }}
                  >
                    {locationSource === 'MANUAL' && validLocation ? (
                      <Marker
                        coordinate={{
                          latitude: parsedLatitude,
                          longitude: parsedLongitude,
                        }}
                        title="Incident location"
                        description="Selected manually"
                      />
                    ) : null}
                  </MapView>
                </View>
                {locationSource === 'MANUAL' && validLocation ? (
                  <Text className="text-sm font-medium text-slate-700">
                    Selected location: {parsedLatitude.toFixed(5)}, {parsedLongitude.toFixed(5)}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {errors.latitude || errors.longitude ? (
              <Text className="text-xs font-semibold text-red-600">
                {errors.latitude ?? errors.longitude}
              </Text>
            ) : null}
            {locationSource === 'GPS' && validLocation ? (
              <MiniMap
                latitude={parsedLatitude}
                longitude={parsedLongitude}
                title="Incident location"
              />
            ) : null}
          </Stack>
        </Panel>
        <Panel className="shadow-none">
          <Stack>
            <Field
              label="Description *"
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                clearError('description');
              }}
              error={errors.description}
              multiline
              maxLength={500}
              editable={!saving}
              className="min-h-32"
              placeholder="Enter short description..."
            />
            <Text className="text-right text-xs text-slate-500">
              {description.length} / 500
            </Text>
          </Stack>
        </Panel>
        {message ? <MessageBanner message={message} tone="red" /> : null}
        <MessageBanner
          message="Offline? Your report saves on this device and syncs automatically when connected."
          tone="amber"
        />
        {confirmation ? (
          <Panel
            className={`shadow-none ${
              confirmation.status === 'SYNC_FAILED'
                ? 'border-red-200 bg-red-50'
                : confirmation.status === 'PENDING_SYNC'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-green-200 bg-green-50'
            }`}
          >
            <Stack>
              <SectionTitle
                title={
                  confirmation.status === 'SYNC_FAILED'
                  ? 'Sync Failed'
                    : confirmation.status === 'PENDING_SYNC'
                    ? 'Saved Offline'
                    : 'Incident Reported!'
                }
                subtitle={
                  confirmation.status === 'SYNC_FAILED'
                    ? 'The report is still stored locally and can be retried.'
                    : confirmation.status === 'PENDING_SYNC'
                      ? 'Incident saved on this device and will sync automatically when connection is available.'
                      : 'Synced to server'
                }
              />
              <Text className="text-sm font-semibold text-slate-800">
                Reference: {confirmation.reference}
              </Text>
              <StatusPill status={confirmation.status} />
              {(confirmation.status === 'SYNC_FAILED' && confirmation.incidentId) ||
              (confirmation.offline && confirmation.status !== 'SYNCED') ? (
                <Button label="Retry Sync" onPress={retrySync} busy={saving} />
              ) : null}
            </Stack>
          </Panel>
        ) : null}
        <Button
          label="Submit Incident"
          onPress={submit}
          busy={saving}
          disabled={gettingLocation || pickingPhotos}
          className="w-full"
        />
    </Stack>
  );
}
