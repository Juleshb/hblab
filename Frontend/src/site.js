import labIcon from './assets/logo-icon.png';
import studioIcon from './assets/HB-STUDIO-FULL.png';

export function configuredSite() {
  const value = String(import.meta.env.VITE_SITE || '').toLowerCase();
  return value === 'studio' || value === 'lab' ? value : '';
}

export function isStudioHost() {
  const forced = configuredSite();
  if (forced) return forced === 'studio';
  if (typeof window === 'undefined') return false;
  return window.location.hostname.toLowerCase().includes('studio');
}

export function brandForLocation(pathname) {
  if (pathname === '/studio' || pathname.startsWith('/portfolio')) return 'studio';
  if (isStudioHost()) {
    const shared = /^\/(admin|student|chat|LoginForm|SignUpForm|forgot-password|reset-password|CertificateCheck|Certficates|dashboard)/.test(pathname);
    return shared ? 'lab' : 'studio';
  }
  return 'lab';
}

export function studioHomePath() {
  return isStudioHost() ? '/' : '/studio';
}

export function labHomeHref() {
  return isStudioHost() ? 'https://hblab.rw' : '/';
}

const STUDIO_ORIGIN = 'https://studio.hblab.rw';

export function studioSiteHref() {
  if (isStudioHost()) return studioHomePath();
  return String(import.meta.env.VITE_STUDIO_URL || STUDIO_ORIGIN).replace(/\/$/, '') || STUDIO_ORIGIN;
}

export function applyBrand(brand) {
  const title = brand === 'studio' ? 'HB Studio' : 'HB-Lab';
  document.documentElement.dataset.siteTitle = title;
  const count = String(document.title || '').match(/^\((\d+\+?)\)/);
  document.title = count ? `(${count[1]}) ${title}` : title;
  const icon = document.querySelector("link[rel='icon']");
  if (icon) icon.href = brand === 'studio' ? studioIcon : labIcon;
  const ogTitle = document.querySelector("meta[property='og:title']");
  if (ogTitle) ogTitle.setAttribute('content', title);
}
