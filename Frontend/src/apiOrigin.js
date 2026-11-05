const configured = import.meta.env.VITE_BACKEND_URL;
export const apiOrigin = String(configured || 'https://api.hblab.rw').replace(/\/$/, '');

export const wsOrigin = apiOrigin.replace(/^http/, 'ws');
