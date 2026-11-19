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

const SITE = 'https://hblab.rw';

const publicPages = [
  {
    test: (path) => path === '/',
    path: '/',
    title: 'HBLab | Training center in Rubavu',
    description: 'HBLab is a training center in Rubavu, Gisenyi. Professional courses in software, networking, multimedia, electronics, accounting, and electrical technology, plus internships and HB Studio.',
  },
  {
    test: (path) => path === '/training' || path === '/get-started',
    path: '/training',
    title: 'Courses at a Training Center in Rubavu | HBLab',
    description: 'Join a class at HBLab, a training center in Rubavu. Software, networking, computer systems, multimedia, electronics, accounting, and electrical technology.',
  },
  {
    test: (path) => path === '/internship',
    path: '/internship',
    title: 'Internship in Rubavu | HBLab',
    description: 'Apply for an HBLab internship. Workplace experience and real projects for TVET students, university students, and graduates.',
  },
  {
    test: (path) => path === '/certificate' || path === '/CertificateCheck',
    path: '/certificate',
    title: 'Check an HBLab Certificate',
    description: 'Confirm a certificate issued by High-Technology Builder Lab Ltd.',
  },
  {
    test: (path) => path === '/careers' || path === '/carrier',
    path: '/careers',
    title: 'Careers at HBLab',
    description: 'Open roles at High-Technology Builder Lab Ltd in Rubavu, Gisenyi.',
  },
  {
    test: (path) => path === '/leadership',
    path: '/leadership',
    title: 'HBLab Leadership Team',
    description: 'Meet the HBLab team in Rubavu, led by Chief Executive Officer HABARUREMA Jules.',
  },
  {
    test: (path) => path === '/studio',
    path: '/studio',
    title: 'HB Studio | Photography, video, and podcasts',
    description: 'HB Studio produces photography, video, live streaming, and podcasts for companies, schools, and events.',
  },
  {
    test: (path) => path === '/portfolio',
    path: '/portfolio',
    title: 'HB Studio Portfolio | HBLab',
    description: 'Films, photos, and productions made by HB Studio, part of High-Technology Builder Lab Ltd.',
  },
  {
    test: (path) => path === '/privacy-policy',
    path: '/privacy-policy',
    title: 'Privacy Policy | HBLab',
    description: 'How High-Technology Builder Lab Ltd handles personal information.',
  },
  {
    test: (path) => path === '/terms-of-use',
    path: '/terms-of-use',
    title: 'Terms of Use | HBLab',
    description: 'Terms for using the HBLab website, training, and internship services.',
  },
];

function ensureMeta(attribute, name) {
  const selector = `meta[${attribute}='${name}']`;
  let node = document.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, name);
    document.head.appendChild(node);
  }
  return node;
}

function ensureLink(rel) {
  let node = document.querySelector(`link[rel='${rel}']`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  return node;
}

export function applyPageMeta(pathname) {
  const brand = brandForLocation(pathname);
  const icon = document.querySelector("link[rel='icon']");
  if (icon) icon.href = brand === 'studio' ? studioIcon : labIcon;

  const page = publicPages.find((entry) => entry.test(pathname));
  const studioHome = brand === 'studio' && (pathname === '/' || pathname === '/studio');
  const title = studioHome ? 'HB Studio | Photography, video, and podcasts' : page?.title || 'HBLab';
  const description = studioHome
    ? 'Film, photography, podcasts, and live coverage from HB Studio, a product of HBLab.'
    : page?.description || 'High-Technology Builder Lab Ltd. Technology, multimedia, and professional training in Rubavu, Gisenyi.';
  const path = studioHome ? (isStudioHost() ? '/' : '/studio') : page?.path || pathname;
  const origin = brand === 'studio' && isStudioHost() ? 'https://studio.hblab.rw' : SITE;
  const url = `${origin}${path}`;
  const indexable = Boolean(page) || studioHome;

  const count = String(document.title || '').match(/^\((\d+\+?)\)/);
  document.documentElement.dataset.siteTitle = title;
  document.title = count ? `(${count[1]}) ${title}` : title;
  ensureMeta('name', 'description').setAttribute('content', description);
  ensureMeta('name', 'robots').setAttribute('content', indexable ? 'index,follow' : 'noindex,nofollow');
  ensureLink('canonical').setAttribute('href', url);
  ensureMeta('property', 'og:title').setAttribute('content', title);
  ensureMeta('property', 'og:description').setAttribute('content', description);
  ensureMeta('property', 'og:url').setAttribute('content', url);
  ensureMeta('property', 'og:type').setAttribute('content', 'website');
  ensureMeta('name', 'twitter:card').setAttribute('content', 'summary_large_image');
  ensureMeta('name', 'twitter:title').setAttribute('content', title);
  ensureMeta('name', 'twitter:description').setAttribute('content', description);

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'EducationalOrganization'],
        name: 'High-Technology Builder Lab Ltd',
        alternateName: ['HBLab', 'HB-Lab'],
        description: 'Training center in Rubavu, Gisenyi. Professional courses, internships, software, and HB Studio.',
        url: `${SITE}/`,
        email: 'info@hblab.rw',
        telephone: '+250789028283',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Rubavu',
          addressRegion: 'Western Province',
          addressCountry: 'RW',
        },
      },
      {
        '@type': 'WebPage',
        name: title,
        description,
        url,
        isPartOf: { '@type': 'WebSite', name: 'HBLab', url: `${SITE}/` },
      },
    ],
  };
  let script = document.getElementById('hblab-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'hblab-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}
