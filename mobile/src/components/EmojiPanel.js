import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EMOJI_GROUPS, recentEmojis, rememberEmoji, subscribeRecent } from '../emojis';
import { LiftInput, useScrollToEnd } from '../keyboard';
import { colors } from '../theme';

export function useEmojiInsert(value, onChange) {
  const cursor = useRef(null);
  const valueRef = useRef(value);
  const lockUntil = useRef(0);
  valueRef.current = value;
  const [selection, setSelection] = useState(null);

  function onSelectionChange(event) {
    if (Date.now() < lockUntil.current) return;
    cursor.current = event.nativeEvent.selection.end;
    if (selection) setSelection(null);
  }

  function insert(emoji) {
    const current = valueRef.current;
    const at = cursor.current == null ? current.length : Math.max(0, Math.min(cursor.current, current.length));
    const next = `${current.slice(0, at)}${emoji}${current.slice(at)}`;
    const pos = at + emoji.length;
    cursor.current = pos;
    valueRef.current = next;
    lockUntil.current = Date.now() + 250;
    onChange(next);
    setSelection({ start: pos, end: pos });
    rememberEmoji(emoji);
  }

  return { insert, onSelectionChange, selection };
}

export function EmojiPanel({ onPick }) {
  const [group, setGroup] = useState(EMOJI_GROUPS[0].id);
  const [recent, setRecent] = useState(recentEmojis);

  useEffect(() => subscribeRecent(setRecent), []);

  const emojis = group === 'recent' ? recent : EMOJI_GROUPS.find((item) => item.id === group)?.emojis || [];

  return (
    <View style={styles.panel}>
      <FlatList
        key={group}
        data={emojis}
        keyExtractor={(item, index) => `${item}-${index}`}
        numColumns={8}
        style={styles.list}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={item} onPress={() => onPick(item)} style={styles.cell}>
            <Text style={styles.emoji}>{item}</Text>
          </Pressable>
        )}
      />
      <View style={styles.tabs}>
        <Tab icon="time-outline" label="Recent" active={group === 'recent'} onPress={() => setGroup('recent')} />
        {EMOJI_GROUPS.map((item) => (
          <Tab
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={group === item.id}
            onPress={() => setGroup(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

function Tab({ icon, label, active, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.tab}>
      <Ionicons name={icon} size={22} color={active ? colors.accentDark : colors.faint} />
    </Pressable>
  );
}

export function EmojiButton({ open, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? 'Show keyboard' : 'Emoji'}
      onPress={onPress}
      hitSlop={6}
      style={styles.button}
    >
      <Ionicons name={open ? 'keypad-outline' : 'happy-outline'} size={24} color={colors.muted} />
    </Pressable>
  );
}

export function EmojiTextField({ value, onChangeText, style, ...inputProps }) {
  const [open, setOpen] = useState(false);
  const scrollToEnd = useScrollToEnd();
  const { insert, onSelectionChange, selection } = useEmojiInsert(value, onChangeText);

  function toggle() {
    setOpen((current) => {
      if (!current) scrollToEnd?.();
      return !current;
    });
  }

  return (
    <View style={style}>
      <View style={styles.field}>
        <EmojiButton open={open} onPress={toggle} />
        <LiftInput
          {...inputProps}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setOpen(false)}
          onSelectionChange={onSelectionChange}
          {...(selection ? { selection } : null)}
          style={styles.fieldInput}
        />
      </View>
      {open ? <EmojiPanel onPick={insert} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { height: 280, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  list: { flex: 1 },
  cell: { width: '12.5%', height: 44, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingVertical: 4,
    backgroundColor: colors.chip,
  },
  tab: { padding: 6 },
  button: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.chip,
    borderRadius: 22,
    paddingLeft: 4,
    paddingRight: 8,
  },
  fieldInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: colors.text,
  },
});
