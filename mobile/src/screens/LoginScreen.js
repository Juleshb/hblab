import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useRouter } from 'expo-router';
import { api } from '../api';
import { useAuth } from '../auth';
import { Boot, ErrorText } from '../components/ui';
import { apiError } from '../format';
import { KeyboardSafe, KeyboardScroll, LiftInput, useKeyboardOverlap } from '../keyboard';
import { colors, frame } from '../theme';

export default function LoginScreen() {
  const { ready, token, login } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const keyboard = useKeyboardOverlap();

  if (!ready) return <Boot />;
  if (token) return <Redirect href="/(app)/(tabs)/messages" />;

  function switchMode(next) {
    setMode(next);
    setError('');
    setNotice('');
    setShowPassword(false);
  }

  async function submit() {
    if (!email.includes('@') || !password) {
      setError('Enter the email and password you use for HBMS.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      router.replace('/(app)/(tabs)/messages');
    } catch (err) {
      setError(apiError(err, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    if (!email.includes('@')) {
      setError('Enter the email on your HBMS account.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      setNotice(response.data?.message || 'If an account uses that email, a reset link is on its way.');
      setMode('sent');
    } catch (err) {
      setError(apiError(err, 'Could not send the reset email'));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    if (!resetToken.trim()) {
      setError('Paste the reset code from the email.');
      return;
    }
    if (nextPassword.length < 8) {
      setError('Use at least 8 characters for the new password.');
      return;
    }
    if (nextPassword !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/auth/reset-password', {
        token: resetToken.trim(),
        password: nextPassword,
      });
      setPassword('');
      setNextPassword('');
      setConfirmPassword('');
      setResetToken('');
      setNotice(response.data?.message || 'Password updated. You can sign in.');
      setMode('signin');
    } catch (err) {
      setError(apiError(err, 'Could not update the password'));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'signin' ? 'Welcome back' : mode === 'reset' ? 'New password' : 'Reset password';
  const lead = mode === 'signin'
    ? 'Sign in to your chats, tasks, and updates.'
    : mode === 'reset'
      ? 'Paste the code from the email, then choose a new password.'
      : mode === 'sent'
        ? 'Check your inbox for a link. It expires in one hour.'
        : 'We will email a reset link to this address.';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardSafe>
        <KeyboardScroll contentContainerStyle={[styles.content, keyboard > 0 && styles.contentLifted]} lift={false}>
          <View style={styles.hero}>
            <View style={styles.mark}><Text style={styles.markText}>HB</Text></View>
            <Text style={styles.kicker}>HBMS</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.lead}>{lead}</Text>
          </View>
          <View style={styles.card}>
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <ErrorText>{error}</ErrorText>
            {mode === 'signin' || mode === 'forgot' ? (
              <Field label="Email" icon="mail-outline">
                <LiftInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="you@company.com"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
              </Field>
            ) : null}
            {mode === 'signin' ? (
              <Field label="Password" icon="lock-closed-outline">
                <LiftInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Your password"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
                <Pressable accessibilityRole="button" onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </Field>
            ) : null}
            {mode === 'reset' ? (
              <>
                <Field label="Reset code" icon="key-outline">
                  <LiftInput
                    value={resetToken}
                    onChangeText={setResetToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Paste the code from the email"
                    placeholderTextColor={colors.faint}
                    style={styles.input}
                  />
                </Field>
                <Field label="New password" icon="lock-closed-outline">
                  <LiftInput
                    value={nextPassword}
                    onChangeText={setNextPassword}
                    secureTextEntry={!showPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.faint}
                    style={styles.input}
                  />
                  <Pressable accessibilityRole="button" onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                  </Pressable>
                </Field>
                <Field label="Confirm password" icon="checkmark-circle-outline">
                  <LiftInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Repeat the new password"
                    placeholderTextColor={colors.faint}
                    style={styles.input}
                  />
                </Field>
              </>
            ) : null}
            {mode === 'signin' ? (
              <Pressable accessibilityRole="button" onPress={() => switchMode('forgot')} style={styles.forgot}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            ) : null}
            {mode === 'signin' ? (
              <Pressable accessibilityRole="button" onPress={submit} disabled={busy} style={[styles.button, busy && styles.buttonOff]}>
                <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
              </Pressable>
            ) : null}
            {mode === 'forgot' ? (
              <Pressable accessibilityRole="button" onPress={sendReset} disabled={busy} style={[styles.button, busy && styles.buttonOff]}>
                <Text style={styles.buttonText}>{busy ? 'Sending…' : 'Send reset link'}</Text>
              </Pressable>
            ) : null}
            {mode === 'reset' ? (
              <Pressable accessibilityRole="button" onPress={savePassword} disabled={busy} style={[styles.button, busy && styles.buttonOff]}>
                <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Update password'}</Text>
              </Pressable>
            ) : null}
            {mode === 'sent' ? (
              <Pressable accessibilityRole="button" onPress={() => switchMode('reset')} style={styles.button}>
                <Text style={styles.buttonText}>I have a reset code</Text>
              </Pressable>
            ) : null}
            {mode !== 'signin' ? (
              <Pressable accessibilityRole="button" onPress={() => switchMode('signin')} style={styles.back}>
                <Ionicons name="arrow-back" size={16} color={colors.accentDark} />
                <Text style={styles.backText}>Back to sign in</Text>
              </Pressable>
            ) : null}
          </View>
        </KeyboardScroll>
      </KeyboardSafe>
    </SafeAreaView>
  );
}

function Field({ label, icon, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fieldRow}>
        <Ionicons name={icon} size={18} color={colors.muted} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#e7f6ee' },
  content: { ...frame, flexGrow: 1, justifyContent: 'center', padding: 20 },
  contentLifted: { justifyContent: 'flex-start', paddingTop: 12 },
  hero: { marginBottom: 18 },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  markText: { color: colors.onAccent, fontSize: 24, fontWeight: '800' },
  kicker: { color: colors.accentDark, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  title: { marginTop: 4, fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.6 },
  lead: { marginTop: 8, color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
    shadowColor: '#0b3b2e',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  notice: { color: colors.accentDark, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  field: { marginBottom: 12 },
  label: { marginBottom: 6, color: colors.muted, fontSize: 12, fontWeight: '700' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.chip,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 16, color: colors.text },
  forgot: { alignSelf: 'flex-end', marginBottom: 8 },
  forgotText: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
  button: {
    marginTop: 6,
    backgroundColor: colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonOff: { opacity: 0.6 },
  buttonText: { color: colors.onAccent, fontSize: 16, fontWeight: '800' },
  back: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  backText: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
});
