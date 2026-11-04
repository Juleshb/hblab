export const colors = {
  bg: '#ffffff',
  chat: '#efeae2',
  card: '#ffffff',
  text: '#111b21',
  muted: '#667781',
  faint: '#8696a0',
  line: '#e9edef',
  accent: '#1dab62',
  accentDark: '#0b6b4f',
  accentSoft: '#d9fdd3',
  bubbleMine: '#d9fdd3',
  bubbleTheirs: '#ffffff',
  chip: '#f0f2f5',
  onAccent: '#ffffff',
  danger: '#ea0038',
};

export const frame = {
  width: '100%',
  maxWidth: 480,
  alignSelf: 'center',
};

export const type = {
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  kicker: { fontSize: 13, color: colors.muted },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 18 },
};

const avatarTones = ['#00a884', '#53bdeb', '#7f66ff', '#ff7a59', '#e67e22', '#25d366'];

export function avatarColor(name) {
  const text = String(name || '');
  const index = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarTones[index % avatarTones.length];
}
