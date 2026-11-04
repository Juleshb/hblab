import { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../auth';
import { Boot } from '../components/ui';
import { markWelcomeSeen } from '../session';
import { colors, frame } from '../theme';

const SLIDES = [
  {
    key: 'chats',
    image: require('../../assets/welcome-chats.jpg'),
    title: 'Talk with your people',
    body: 'Personal chats stay between you and one person. Swipe a message to reply, tap it to react, and watch the ticks turn blue when it is read.',
  },
  {
    key: 'teams',
    image: require('../../assets/welcome-teams.jpg'),
    title: 'Stay with your teams',
    body: 'Department rooms and project groups keep the whole team in one conversation, with the same replies, reactions, and read ticks.',
  },
  {
    key: 'updates',
    image: require('../../assets/welcome-updates.jpg'),
    title: 'Hear what matters',
    body: 'Notices collect in Updates, and new messages show up while you are in the app so you do not miss the thread.',
  },
];

export default function WelcomeScreen() {
  const { ready, token } = useAuth();
  const router = useRouter();
  const scrollRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [page, setPage] = useState(0);
  const width = box.width;
  const artSize = Math.max(180, Math.min(320, box.width - 8, box.height - 168));
  const last = page >= SLIDES.length - 1;

  if (!ready) return <Boot />;
  if (token) return <Redirect href="/(app)/(tabs)/messages" />;

  async function finish() {
    await markWelcomeSeen();
    router.replace('/login');
  }

  function goTo(index) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, index));
    setPage(next);
    if (width > 0) scrollRef.current?.scrollTo({ x: width * next, animated: true });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.column}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <Image source={require('../../assets/logo-icon.png')} style={styles.mark} accessibilityIgnoresInvertColors />
            <Text style={styles.brandText}>Hb-lab</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={finish} hitSlop={8}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View
          style={styles.pager}
          onLayout={(event) => {
            const { width: nextWidth, height } = event.nativeEvent.layout;
            setBox((current) => (
              current.width === nextWidth && current.height === height
                ? current
                : { width: nextWidth, height }
            ));
          }}
        >
          {width > 0 ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                const next = Math.round(event.nativeEvent.contentOffset.x / width);
                if (next !== page && next >= 0 && next < SLIDES.length) setPage(next);
              }}
            >
              {SLIDES.map((slide) => (
                <View key={slide.key} style={[styles.page, { width }]}>
                  <View style={[styles.art, { width: artSize, height: artSize }]}>
                    <Image source={slide.image} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
                  </View>
                  <Text style={styles.title}>{slide.title}</Text>
                  <Text style={styles.body}>{slide.body}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((slide, index) => (
              <Pressable key={slide.key} accessibilityRole="button" accessibilityLabel={`Page ${index + 1}`} onPress={() => goTo(index)} hitSlop={8}>
                <View style={[styles.dot, index === page && styles.dotOn]} />
              </Pressable>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={() => (last ? finish() : goTo(page + 1))} style={styles.button}>
            <Text style={styles.buttonText}>{last ? 'Get started' : 'Next'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.wash },
  column: { ...frame, flex: 1, paddingHorizontal: 20 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 36, height: 36, borderRadius: 10 },
  brandText: { color: colors.accentDark, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  skip: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  pager: { flex: 1, overflow: 'hidden' },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 4 },
  art: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#efeae2',
    marginBottom: 18,
  },
  image: { width: '100%', height: '100%' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footer: { paddingTop: 8, paddingBottom: 12, gap: 14, backgroundColor: colors.wash },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentMuted },
  dotOn: { width: 22, backgroundColor: colors.accent },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 15,
  },
  buttonText: { color: colors.onAccent, fontSize: 16, fontWeight: '800' },
});
