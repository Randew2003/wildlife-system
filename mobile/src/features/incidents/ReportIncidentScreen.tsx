import { useState } from 'react';
import { Text, View } from 'react-native';

import { incidentOptions, sampleParkLocation } from '@/features/app/constants';
import type { FormErrors } from '@/features/app/helpers';
import {
  normalizePhotoList,
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
  Row,
  SectionTitle,
  Stack,
  ValidationBlock,
} from '@/features/app/native-ui';
import { enqueueOffline, getNetworkStatus } from '@/services/offline';
import { ApiError, incidentApi } from '@/services/api';
import type { AuthSession, IncidentType } from '@/types/domain';

export function ReportIncidentScreen({ session, onSubmitted }: { session: AuthSession; onSubmitted?: () => void }) {
  const [incidentType, setIncidentType] = useState<IncidentType>('SNARE');
  const [latitude, setLatitude] = useState(String(sampleParkLocation.latitude));
  const [longitude, setLongitude] = useState(String(sampleParkLocation.longitude));
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validate = () => {
    const nextErrors: FormErrors = {};
    const latitudeError = validateLatitude(latitude);
    const longitudeError = validateLongitude(longitude);
    const photos = normalizePhotoList(photoUrls);

    if (latitudeError) {
      nextErrors.latitude = latitudeError;
    }

    if (longitudeError) {
      nextErrors.longitude = longitudeError;
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!photos.length) {
      nextErrors.photoUrls = 'Add at least one photo URL for evidence.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      incidentType,
      latitude: parseNumber(latitude) ?? sampleParkLocation.latitude,
      longitude: parseNumber(longitude) ?? sampleParkLocation.longitude,
      description: description.trim(),
      photoUrls: normalizePhotoList(photoUrls),
    };

    setSaving(true);
    setMessage(null);

    try {
      if (!getNetworkStatus()) {
        throw new Error('Network unavailable.');
      }

      const saved = await incidentApi.create(session.token, payload);
      setMessage(`Incident saved as ${saved.status}.`);
      setDescription('');
      setPhotoUrls('');
      onSubmitted?.();
    } catch (exception) {
      if (exception instanceof ApiError && exception.status < 500) {
        setMessage(`Incident could not be submitted: ${exception.message}`);
        return;
      }

      await enqueueOffline({
        label: `Wildlife incident ${incidentType}`,
        endpoint: '/api/v1/incidents',
        method: 'POST',
        body: payload,
      });
      setMessage('Incident stored locally as Pending Sync.');
      onSubmitted?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <Stack>
        <SectionTitle title="Report Wildlife Incident" subtitle="Incident type, evidence, location, and sync status." />
        <ChoiceGroup label="Incident type" value={incidentType} options={incidentOptions} onChange={setIncidentType} />
        <MiniMap latitude={parseNumber(latitude)} longitude={parseNumber(longitude)} title="Incident location" />
        <Row>
          <Field
            label="Latitude"
            value={latitude}
            onChangeText={setLatitude}
            error={errors.latitude}
            keyboard="numeric"
          />
          <Field
            label="Longitude"
            value={longitude}
            onChangeText={setLongitude}
            error={errors.longitude}
            keyboard="numeric"
          />
        </Row>
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          multiline
          placeholder="Short incident description"
        />
        <Field
          label="Photo URLs"
          value={photoUrls}
          onChangeText={setPhotoUrls}
          error={errors.photoUrls}
          helper="Separate multiple photos with commas."
          placeholder="https://example.com/photo-1.jpg"
        />
        <ValidationBlock errors={validationSummary(errors)} />
        {message ? (
          <View className="rounded-lg border border-sky-200 bg-sky-50 p-3">
            <Text className="text-sm font-semibold text-sky-700">{message}</Text>
          </View>
        ) : null}
        <Button label="Submit Incident" onPress={submit} busy={saving} />
      </Stack>
    </Panel>
  );
}
