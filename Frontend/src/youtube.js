export function youtubeId(value) {
  const text = String(value || '').trim();
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/)
    || text.match(/^[A-Za-z0-9_-]{11}$/);
  return match ? match[1] : '';
}

export function youtubeThumb(value) {
  const id = youtubeId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

export function youtubeEmbed(value) {
  const id = youtubeId(value);
  return id ? `https://www.youtube.com/embed/${id}` : '';
}
