let RTCView = null;

try {
  RTCView = require('react-native-webrtc').RTCView;
} catch {
  RTCView = null;
}

export function CallVideo({ stream, mirror, style, zOrder = 0 }) {
  if (!RTCView) return null;
  const url = stream?.toURL?.();
  if (!url) return null;
  return (
    <RTCView
      streamURL={url}
      mirror={Boolean(mirror)}
      objectFit="cover"
      zOrder={zOrder}
      style={style}
    />
  );
}
