import * as Location from 'expo-location';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Text, View } from 'react-native';

import MapView, { Marker } from '../../components/MapView';
import type { MapPressEvent } from '../../components/MapView.types';
import {
  conflictTypeOptions,
  locationSourceOptions,
  sampleParkLocation,
  severityOptions,
} from '@/features/app/constants';
import type { FormErrors } from '@/features/app/helpers';
import {
  describeLocation,
  parseNumber,
  validateLatitude,
  validateLongitude,
  validationSummary,
} from '@/features/app/helpers';
import {
  Button,
  ChoiceGroup,
  Field,
  MiniMap,
  Panel,
  SectionTitle,
  Stack,
  ValidationBlock,
} from '@/features/app/native-ui';
import { conflictApi } from '@/services/api';
import { enqueueOffline, getNetworkStatus } from '@/services/offline';
import type { AuthSession, LocationSource } from '@/types/domain';

type ConflictType = (typeof conflictTypeOptions)[number]['value'];
type Severity = (typeof severityOptions)[number]['value'];

export function ConflictReportScreen({ session, onSubmitted }: { session: AuthSession; onSubmitted?: () => void }) {
  const [conflictType, setConflictType] = useState<ConflictType>('CROP_DAMAGE');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [locationSource, setLocationSource] = useState<LocationSource>('GPS');
  const [latitude, setLatitude] = useState(String(sampleParkLocation.latitude));
  const [longitude, setLongitude] = useState(String(sampleParkLocation.longitude));
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [choosingPhoto, setChoosingPhoto] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const readableLocation = describeLocation(parseNumber(latitude), parseNumber(longitude));

  const selectManualLocation = (event: MapPressEvent) => {
    const { latitude: selectedLatitude, longitude: selectedLongitude } = event.nativeEvent.coordinate;
    setLatitude(String(Number(selectedLatitude.toFixed(6))));
    setLongitude(String(Number(selectedLongitude.toFixed(6))));
    setLocationSource('MANUAL');
  };

  const pickPhoto = async () => {
    setChoosingPhoto(true);
    setMessage(null);

    try {
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setMessage('Photo library permission is required to attach a report photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (exception) {
      setMessage(exception instanceof Error ? `Unable to choose photo: ${exception.message}` : 'Unable to choose photo.');
    } finally {
      setChoosingPhoto(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setMessage(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setMessage('Location permission was denied. You can keep the demo location or enter coordinates manually.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(String(Number(position.coords.latitude.toFixed(6))));
      setLongitude(String(Number(position.coords.longitude.toFixed(6))));
      setLocationSource('GPS');
      setMessage('Current location captured.');
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : 'Unable to read current location.');
    } finally {
      setLocating(false);
    }
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const latitudeError = validateLatitude(latitude);
    const longitudeError = validateLongitude(longitude);

    if (latitudeError) {
      nextErrors.latitude = latitudeError;
    }

    if (longitudeError) {
      nextErrors.longitude = longitudeError;
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    const offline = !getNetworkStatus();
    const payload = {
      conflictType,
      severity,
      locationSource,
      latitude: parseNumber(latitude) ?? sampleParkLocation.latitude,
      longitude: parseNumber(longitude) ?? sampleParkLocation.longitude,
      description: description.trim(),
      photoUrl: photoUrl.trim() || undefined,
    };

    setSaving(true);
    setMessage(null);

    try {
      if (offline) {
        throw new Error('Network unavailable.');
      }

      const saved = await conflictApi.create(session.token, payload);
      setMessage(
        saved.possibleDuplicate
          ? `Report submitted as ${saved.status}; possible duplicate was flagged.`
          : `Report submitted as ${saved.status}.`,
      );
      setDescription('');
      setPhotoUrl('');
      onSubmitted?.();
    } catch {
      await enqueueOffline({
        label: `Conflict report ${conflictType}`,
        endpoint: '/api/conflict-reports',
        method: 'POST',
        body: payload,
      });
      setMessage('Conflict report stored locally as Pending Sync.');
      onSubmitted?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <Stack>
        <SectionTitle title="Report Conflict" subtitle="Tell the park team what happened and where help is needed." />
        <ChoiceGroup label="Conflict type" value={conflictType} options={conflictTypeOptions} onChange={setConflictType} />
        <ChoiceGroup label="Severity" value={severity} options={severityOptions} onChange={setSeverity} />
        <ChoiceGroup
          label="Location source"
          value={locationSource}
          options={locationSourceOptions}
          onChange={setLocationSource}
        />
        {locationSource === 'GPS' ? (
          <MiniMap latitude={parseNumber(latitude)} longitude={parseNumber(longitude)} title={readableLocation} />
        ) : null}
        <View className="rounded-lg border border-forest-100 bg-forest-50 p-3">
          <Text className="text-xs font-semibold uppercase text-forest-700">Report location</Text>
          <Text className="mt-1 text-base font-bold text-slate-950">{readableLocation}</Text>
          <Text className="mt-1 text-xs text-slate-600">Coordinates are stored in the background for response routing.</Text>
        </View>
        <Button label="Use My Current Location" onPress={useCurrentLocation} busy={locating} variant="secondary" />
        {locationSource === 'MANUAL' ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-800">Choose the report location</Text>
            <Text className="text-xs text-slate-600">Tap the map to place the pin where the conflict happened.</Text>
            <View className="overflow-hidden rounded-lg border border-slate-200">
              <MapView
                accessibilityLabel="Choose conflict report location"
                initialRegion={{
                  latitude: parseNumber(latitude) ?? sampleParkLocation.latitude,
                  longitude: parseNumber(longitude) ?? sampleParkLocation.longitude,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
                onPress={selectManualLocation}
                style={{ height: 240, width: '100%' }}
              >
                <Marker
                  coordinate={{
                    latitude: parseNumber(latitude) ?? sampleParkLocation.latitude,
                    longitude: parseNumber(longitude) ?? sampleParkLocation.longitude,
                  }}
                  title="Conflict location"
                  description="Tap elsewhere on the map to move the pin"
                />
              </MapView>
            </View>
            <Text className="text-xs text-slate-600">
              Selected coordinates: {parseNumber(latitude)?.toFixed(6)}, {parseNumber(longitude)?.toFixed(6)}
            </Text>
          </View>
        ) : null}
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          multiline
          placeholder="What happened and what help is needed"
        />
        <View className="gap-2 rounded-lg border border-slate-200 p-3">
          <Text className="text-sm font-semibold text-slate-800">Photo evidence (optional)</Text>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              accessibilityLabel="Selected conflict report photo"
              className="h-40 w-full rounded-md"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-xs text-slate-500">Choose a photo from your gallery to attach it to this report.</Text>
          )}
          <Button
            label={photoUrl ? 'Choose a Different Photo' : 'Choose Photo from Gallery'}
            onPress={pickPhoto}
            busy={choosingPhoto}
            disabled={saving}
            variant="secondary"
          />
          {photoUrl ? (
            <Button
              label="Remove Photo"
              onPress={() => setPhotoUrl('')}
              disabled={saving || choosingPhoto}
              variant="ghost"
            />
          ) : null}
        </View>
        <ValidationBlock errors={validationSummary(errors)} />
        {message ? (
          <View className="rounded-lg border border-sky-200 bg-sky-50 p-3">
            <Text className="text-sm font-semibold text-sky-700">{message}</Text>
          </View>
        ) : null}
        <Button label="Send Report" onPress={submit} busy={saving} />
      </Stack>
    </Panel>
  );
}
