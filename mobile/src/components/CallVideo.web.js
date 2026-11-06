import { useEffect, useRef } from 'react';
import { View } from 'react-native';

export function CallVideo({ stream, muted = true, mirror, style }) {
  const host = useRef(null);
  useEffect(() => {
    const parent = host.current;
    if (!parent || typeof document === 'undefined') return undefined;
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = Boolean(muted);
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    if (mirror) video.style.transform = 'scaleX(-1)';
    parent.appendChild(video);
    video.srcObject = stream || null;
    if (stream) video.play().catch(() => {});
    return () => {
      video.srcObject = null;
      video.remove();
    };
  }, [stream, muted, mirror]);
  return <View ref={host} style={style} />;
}
