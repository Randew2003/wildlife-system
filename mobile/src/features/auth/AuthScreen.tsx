import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { roleOptions } from '@/features/app/constants';
import type { FormErrors } from '@/features/app/helpers';
import { validationSummary } from '@/features/app/helpers';
import {
  AppFrame,
  Button,
  ChoiceGroup,
  Field,
  Panel,
  PageTitle,
  Stack,
  TextLinkButton,
  ValidationBlock,
} from '@/features/app/native-ui';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types/domain';

type AuthMode = 'login' | 'register' | 'forgot';

const initialErrors: FormErrors = {};

export function AuthScreen() {
  const { login, register, forgotPassword, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rangerId, setRangerId] = useState('');
  const [role, setRole] = useState<UserRole>('RANGER');
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (mode === 'register') {
      return 'Create Field Account';
    }

    if (mode === 'forgot') {
      return 'Reset Password';
    }

    return 'Wildlife Operations Login';
  }, [mode]);

  const switchMode = (nextMode: AuthMode) => {
    clearError();
    setSuccess(null);
    setSubmitError(null);
    setErrors(initialErrors);
    setMode(nextMode);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (mode !== 'forgot') {
      if (!password.trim()) {
        nextErrors.password = 'Password is required.';
      } else if (password.length < 8) {
        nextErrors.password = 'Password must contain at least 8 characters.';
      }
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        nextErrors.fullName = 'Full name is required.';
      }

      if (role === 'RANGER' && !rangerId.trim()) {
        nextErrors.rangerId = 'Ranger ID is required for ranger accounts.';
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    setSuccess(null);
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    try {
      if (mode === 'forgot') {
        const message = await forgotPassword(email.trim());
        setSuccess(message);
        return;
      }

      if (mode === 'register') {
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
          rangerId: role === 'RANGER' ? rangerId.trim() : undefined,
        });
        return;
      }

      await login({
        email: email.trim(),
        password,
      });
    } catch (exception) {
      setSubmitError(exception instanceof Error ? exception.message : 'Unable to complete this request.');
    }
  };

  return (
    <AppFrame>
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-xl gap-5 p-5">
          <PageTitle
            eyebrow="Smart wildlife conservation"
            title={title}
            subtitle="Access patrol tracking, incident reports, high-risk alerts, and manager operations from one workspace."
          />

          <Panel>
            <Stack>
              {mode === 'register' ? (
                <>
                  <Field
                    label="Full name"
                    value={fullName}
                    onChangeText={setFullName}
                    error={errors.fullName}
                    placeholder="Nimal Perera"
                  />
                  <ChoiceGroup label="Account role" value={role} options={roleOptions} onChange={setRole} />
                  {role === 'RANGER' ? (
                    <Field
                      label="Ranger ID"
                      value={rangerId}
                      onChangeText={setRangerId}
                      error={errors.rangerId}
                      placeholder="RNG-001"
                    />
                  ) : null}
                </>
              ) : null}

              <Field
                autoCapitalize="none"
                keyboard="email-address"
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                placeholder="name@example.com"
              />

              {mode !== 'forgot' ? (
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                  placeholder="Minimum 8 characters"
                  secureTextEntry
                />
              ) : null}

              <ValidationBlock errors={validationSummary(errors)} />

              {error || submitError ? (
                <View className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <Text className="text-sm font-semibold text-red-700">{error ?? submitError}</Text>
                </View>
              ) : null}

              {success ? (
                <View className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <Text className="text-sm font-semibold text-green-700">{success}</Text>
                </View>
              ) : null}

              <Button
                label={mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset request' : 'Sign in'}
                onPress={submit}
                busy={loading}
              />

              <View className="gap-1 pt-1">
                {mode !== 'login' ? <TextLinkButton label="Back to sign in" onPress={() => switchMode('login')} /> : null}
                {mode !== 'register' ? (
                  <TextLinkButton label="Create a new account" onPress={() => switchMode('register')} />
                ) : null}
                {mode !== 'forgot' ? (
                  <TextLinkButton label="Forgot password" onPress={() => switchMode('forgot')} />
                ) : null}
              </View>
            </Stack>
          </Panel>
        </View>
      </ScrollView>
    </AppFrame>
  );
}
