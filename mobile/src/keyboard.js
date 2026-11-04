import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

let keyboardHeight = 0;
let windowBeforeKeyboard = Dimensions.get('window').height;
const subscribers = new Set();

function overlapNow() {
  if (!keyboardHeight) return 0;
  const shrunk = windowBeforeKeyboard - Dimensions.get('window').height;
  if (shrunk > keyboardHeight * 0.6) return 0;
  return keyboardHeight;
}

function publish(next) {
  subscribers.forEach((listener) => listener(next));
}

let listening = false;
function listen() {
  if (listening) return;
  listening = true;
  const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
  Keyboard.addListener(show, (event) => {
    if (!keyboardHeight) windowBeforeKeyboard = Dimensions.get('window').height;
    const height = event?.endCoordinates?.height || 0;
    const screenY = event?.endCoordinates?.screenY;
    const cover = screenY > 0 ? Math.max(0, Dimensions.get('screen').height - screenY) : 0;
    keyboardHeight = Math.max(height, cover);
    publish(overlapNow());
  });
  Keyboard.addListener(hide, () => {
    keyboardHeight = 0;
    windowBeforeKeyboard = Dimensions.get('window').height;
    publish(0);
  });
  Dimensions.addEventListener('change', () => publish(overlapNow()));
}

export function useKeyboardOverlap() {
  const [overlap, setOverlap] = useState(overlapNow);
  useEffect(() => {
    listen();
    const listener = (value) => setOverlap(value);
    subscribers.add(listener);
    setOverlap(overlapNow());
    return () => subscribers.delete(listener);
  }, []);
  return overlap;
}

export function KeyboardSafe({ children, style }) {
  const insets = useSafeAreaInsets();
  const overlap = useKeyboardOverlap();
  return (
    <View style={[{ flex: 1, paddingBottom: Math.max(insets.bottom, overlap) }, style]}>
      {children}
    </View>
  );
}

const RevealContext = createContext(null);
const ScrollEndContext = createContext(null);

export function useScrollToEnd() {
  return useContext(ScrollEndContext);
}

function revealField(scrollRef, offsetRef, fieldRef, attempt) {
  const wait = attempt === 0 ? 280 : 140;
  setTimeout(() => {
    if (!keyboardHeight && attempt < 3) {
      revealField(scrollRef, offsetRef, fieldRef, attempt + 1);
      return;
    }
    const node = fieldRef.current;
    if (!node?.measureInWindow) return;
    node.measureInWindow((_x, y, _width, height) => {
      const top = Dimensions.get('window').height - overlapNow();
      const overflow = y + height + 28 - top;
      if (overflow > 8 && scrollRef.current?.scrollTo) {
        scrollRef.current.scrollTo({
          y: Math.max(0, offsetRef.current + overflow),
          animated: true,
        });
      }
    });
  }, wait);
}

export function KeyboardScroll({ children, style, contentContainerStyle, onScroll, lift = true, ...props }) {
  const scrollRef = useRef(null);
  const offsetRef = useRef(0);
  const overlap = useKeyboardOverlap();
  const reveal = useCallback((fieldRef) => {
    revealField(scrollRef, offsetRef, fieldRef, 0);
  }, []);
  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 60);
  }, []);

  return (
    <ScrollEndContext.Provider value={scrollToEnd}>
    <RevealContext.Provider value={reveal}>
      <ScrollView
        ref={scrollRef}
        style={[{ flex: 1 }, style]}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          offsetRef.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
        scrollEventThrottle={16}
        {...props}
      >
        {children}
        {lift && overlap > 0 ? <View style={{ height: overlap }} /> : null}
      </ScrollView>
    </RevealContext.Provider>
    </ScrollEndContext.Provider>
  );
}

export function LiftInput({ onFocus, inputRef, ...props }) {
  const reveal = useContext(RevealContext);
  const ref = useRef(null);
  const setRef = (node) => {
    ref.current = node;
    if (typeof inputRef === 'function') inputRef(node);
    else if (inputRef) inputRef.current = node;
  };
  return (
    <TextInput
      {...props}
      ref={setRef}
      cursorColor={colors.accent}
      selectionColor={colors.accent}
      onFocus={(event) => {
        reveal?.(ref);
        onFocus?.(event);
      }}
    />
  );
}
