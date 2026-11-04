import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
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
import { ConnectLoader, isOfflineError } from '../offline';
import { colors, frame } from '../theme';

export default function LoginScreen() {
  const { ready, token, login } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [step, setStep] = useState('email');
  const [missing, setMissing] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const keyboard = useKeyboardOverlap();
  const [attempt, setAttempt] = useState(0);
  const enter = useRef(new Animated.Value(0)).current;
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const swap = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const drift = (value, duration) => Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const first = drift(floatA, 4600);
    const second = drift(floatB, 5400);
    first.start();
    second.start();
    return () => {
      first.stop();
      second.stop();
    };
  }, [enter, floatA, floatB]);

  useEffect(() => {
    swap.setValue(0);
    Animated.timing(swap, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, step, swap]);

  useEffect(() => {
    if (!connecting || mode !== 'signin' || !email.includes('@') || !password) return undefined;
    const timer = setTimeout(async () => {
      try {
        await login(email.trim(), password);
        router.replace('/(app)/(tabs)/messages');
      } catch (err) {
        if (isOfflineError(err)) setAttempt((value) => value + 1);
        else {
          setConnecting(false);
          setError(apiError(err, 'Could not sign in') || 'Could not sign in');
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [attempt, connecting, email, login, mode, password, router]);

  if (!ready) return <Boot />;
  if (token) return <Redirect href="/(app)/(tabs)/messages" />;

  function switchMode(next) {
    setMode(next);
    setError('');
    setNotice('');
    setMissing(null);
    setConnecting(false);
    setShowPassword(false);
  }

  async function continueEmail() {
    if (!email.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    setBusy(true);
    setError('');
    setMissing(null);
    setConnecting(false);
    try {
      const response = await api.post('/auth/check-email', { email: email.trim() });
      if (response.data?.exists) {
        setStep('password');
      } else {
        setMissing(response.data?.contact || 'info@hblab.rw');
      }
    } catch (err) {
      if (isOfflineError(err)) setConnecting(true);
      else setError(apiError(err, 'Could not check that email') || 'Could not check that email');
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!email.includes('@') || !password) {
      setError('Enter the email and password you use for Hb-lab.');
      return;
    }
    setBusy(true);
    setError('');
    setConnecting(false);
    try {
      await login(email.trim(), password);
      router.replace('/(app)/(tabs)/messages');
    } catch (err) {
      if (isOfflineError(err)) setConnecting(true);
      else setError(apiError(err, 'Could not sign in') || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    if (!email.includes('@')) {
      setError('Enter the email on your Hb-lab account.');
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

  const title = mode === 'signin'
    ? (step === 'password' ? 'Enter your password' : 'Welcome back')
    : mode === 'reset' ? 'New password' : 'Reset password';
  const lead = mode === 'signin'
    ? (step === 'password' ? email.trim() : 'Start with the email on your Hb-lab account.')
    : mode === 'reset'
      ? 'Paste the code from the email, then choose a new password.'
      : mode === 'sent'
        ? 'Check your inbox for a link. It expires in one hour.'
        : 'We will email a reset link to this address.';
  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  const formRise = swap.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const orbA = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const orbB = floatB.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orbA, { transform: [{ translateY: orbA }] }]} />
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orbB, { transform: [{ translateY: orbB }] }]} />
      <KeyboardSafe>
        <KeyboardScroll contentContainerStyle={[styles.content, keyboard > 0 && styles.contentLifted]} lift={false}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/welcome')} style={styles.toWelcome} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color={colors.accentDark} />
            <Text style={styles.toWelcomeText}>Back</Text>
          </Pressable>
          <Animated.View style={[styles.hero, { opacity: enter, transform: [{ translateY: rise }] }]}>
            <View style={styles.logoRing}>
              <Image source={require('../../assets/logo-icon.png')} style={styles.mark} accessibilityIgnoresInvertColors />
            </View>
            <Text style={styles.kicker}>Hb-lab</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.lead}>{lead}</Text>
          </Animated.View>
          <Animated.View style={[styles.card, { opacity: swap, transform: [{ translateY: formRise }] }]}>
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {connecting ? <ConnectLoader /> : <ErrorText>{error}</ErrorText>}
            {mode === 'signin' && step === 'email' ? (
              <View style={styles.steps}>
                <Text style={styles.stepOn}>1  Email</Text>
                <Text style={styles.stepOff}>2  Password</Text>
              </View>
            ) : null}
            {mode === 'signin' && step === 'password' ? (
              <View style={styles.steps}>
                <Text style={styles.stepOff}>1  Email</Text>
                <Text style={styles.stepOn}>2  Password</Text>
              </View>
            ) : null}
            {missing ? (
              <Pressable accessibilityRole="button" onPress={() => Linking.openURL(`mailto:${missing}`)} style={styles.missing}>
                <Text style={styles.missingTitle}>This email is not registered</Text>
                <Text style={styles.missingBody}>Contact an admin to register your account.</Text>
                <Text style={styles.missingMail}>{missing}</Text>
              </Pressable>
            ) : null}
            {(mode === 'forgot' || (mode === 'signin' && step === 'email')) ? (
              <Field label="Email" icon="mail-outline">
                <LiftInput
                  value={email}
                  onChangeText={(value) => { setEmail(value); setMissing(null); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="you@company.com"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
              </Field>
            ) : null}
            {mode === 'signin' && step === 'password' ? (
              <Field label="Password" icon="lock-closed-outline">
                <LiftInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Your password"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
                <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
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
                  <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
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
            {mode === 'signin' && step === 'password' ? (
              <Pressable accessibilityRole="button" onPress={() => switchMode('forgot')} style={styles.forgot}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            ) : null}
            {mode === 'signin' && step === 'email' ? <ActionButton label={busy ? 'Checking…' : 'Continue'} busy={busy} onPress={continueEmail} /> : null}
            {mode === 'signin' && step === 'password' ? <ActionButton label={busy ? 'Signing in…' : 'Sign in'} busy={busy} onPress={submit} /> : null}
            {mode === 'signin' && step === 'password' ? (
              <Pressable accessibilityRole="button" onPress={() => { setStep('email'); setError(''); setMissing(null); }} style={styles.back}>
                <Ionicons name="arrow-back" size={16} color={colors.accentDark} />
                <Text style={styles.backText}>Use a different email</Text>
              </Pressable>
            ) : null}
            {mode === 'forgot' ? <ActionButton label={busy ? 'Sending…' : 'Send reset link'} busy={busy} onPress={sendReset} /> : null}
            {mode === 'reset' ? <ActionButton label={busy ? 'Saving…' : 'Update password'} busy={busy} onPress={savePassword} /> : null}
            {mode === 'sent' ? <ActionButton label="I have a reset code" onPress={() => switchMode('reset')} /> : null}
            {mode !== 'signin' ? (
              <Pressable accessibilityRole="button" onPress={() => switchMode('signin')} style={styles.back}>
                <Ionicons name="arrow-back" size={16} color={colors.accentDark} />
                <Text style={styles.backText}>Back to sign in</Text>
              </Pressable>
            ) : null}
          </Animated.View>
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
        <Ionicons name={icon} size={18} color={colors.accent} />
        {children}
      </View>
    </View>
  );
}

function ActionButton({ label, busy, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        disabled={busy}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        style={[styles.button, busy && styles.buttonOff]}
      >
        {busy ? <ActivityIndicator color={colors.onAccent} /> : null}
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.wash, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  orbA: { width: 220, height: 220, top: -70, right: -60, backgroundColor: '#d5e4df' },
  orbB: { width: 180, height: 180, bottom: -50, left: -70, backgroundColor: '#dce8e4' },
  content: { ...frame, flexGrow: 1, justifyContent: 'center', padding: 24 },
  toWelcome: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginBottom: 8, minHeight: 40 },
  toWelcomeText: { color: colors.accentDark, fontSize: 16, fontWeight: '800' },
  contentLifted: { justifyContent: 'flex-start', paddingTop: 12 },
  hero: { alignItems: 'center', marginBottom: 22 },
  logoRing: {
    width: 92,
    height: 92,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 14,
    shadowColor: '#193a2f',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  mark: { width: 68, height: 68, borderRadius: 20 },
  kicker: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 6, fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -0.8, textAlign: 'center' },
  lead: { marginTop: 8, color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 20,
    shadowColor: '#193a2f',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  notice: {
    color: colors.accentDark,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stepOn: {
    flex: 1,
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    color: colors.accentDark,
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 8,
  },
  stepOff: {
    flex: 1,
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.chip,
    color: colors.faint,
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 8,
  },
  missing: {
    backgroundColor: '#f7f3ea',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  missingTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  missingBody: { marginTop: 4, color: colors.muted, fontSize: 14, lineHeight: 20 },
  missingMail: { marginTop: 8, color: colors.accent, fontSize: 15, fontWeight: '800' },
  field: { marginBottom: 14 },
  label: { marginBottom: 6, marginLeft: 4, color: colors.muted, fontSize: 12, fontWeight: '700' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.wash,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#d5e3de',
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 10 },
  forgotText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  button: {
    marginTop: 4,
    backgroundColor: colors.accent,
    borderRadius: 18,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonOff: { opacity: 0.7 },
  buttonText: { color: colors.onAccent, fontSize: 16, fontWeight: '800' },
  back: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  backText: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
});
