import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'assets/images/generated-visuals');
const tmpDir = join(root, 'assets/images/generated-visuals/.tmp');

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const categorySpecs = {
  meditation: {
    label: 'Meditation',
    palette: ['#eef6ee', '#d9e8db', '#7ea58b', '#31473a', '#f8f3df'],
    motif: 'rings',
  },
  bible: {
    label: 'Bible Verse',
    palette: ['#f7f0e4', '#ead8bd', '#d4b477', '#5b4a33', '#fff9ea'],
    motif: 'pages',
  },
  quote: {
    label: 'Daily Quotes',
    palette: ['#edf5f8', '#d6e7ee', '#88afc5', '#30475b', '#fbfdff'],
    motif: 'quote',
  },
};

const styleSpecs = {
  calm: {
    label: 'Calm',
    blur: 24,
    opacity: 0.34,
    lineOpacity: 0.28,
  },
  iphone: {
    label: 'iPhone',
    blur: 14,
    opacity: 0.42,
    lineOpacity: 0.34,
  },
  nature: {
    label: 'Nature',
    blur: 18,
    opacity: 0.38,
    lineOpacity: 0.3,
  },
};

function flowLines(accent, soft, opacity) {
  return `
    <path d="M-80 238 C160 92 330 390 595 210 S875 116 1098 260" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="4"/>
    <path d="M-110 612 C160 450 362 748 610 545 S854 398 1114 560" fill="none" stroke="${soft}" stroke-opacity="${opacity * 0.8}" stroke-width="6"/>
    <path d="M-40 790 C210 660 404 910 700 748 S980 640 1120 730" fill="none" stroke="${accent}" stroke-opacity="${opacity * 0.42}" stroke-width="3"/>
  `;
}

function categoryMotif(category, style, colors) {
  const [, soft, accent, deep, light] = colors;

  if (category.motif === 'pages') {
    return `
      <g transform="translate(512 492) rotate(${style === 'iphone' ? -8 : -4})">
        <path d="M-238 -164 C-76 -204 12 -152 12 -34 L12 188 C-102 128 -196 126 -298 174 L-298 -76 C-298 -122 -278 -150 -238 -164Z" fill="${light}" fill-opacity="0.72" stroke="${accent}" stroke-opacity="0.24" stroke-width="3"/>
        <path d="M238 -164 C76 -204 -12 -152 -12 -34 L-12 188 C102 128 196 126 298 174 L298 -76 C298 -122 278 -150 238 -164Z" fill="${light}" fill-opacity="0.64" stroke="${accent}" stroke-opacity="0.24" stroke-width="3"/>
        <path d="M-150 -64 C-86 -82 -46 -78 -2 -52" stroke="${deep}" stroke-opacity="0.18" stroke-width="5" stroke-linecap="round"/>
        <path d="M42 -64 C100 -82 154 -78 218 -52" stroke="${deep}" stroke-opacity="0.16" stroke-width="5" stroke-linecap="round"/>
        <path d="M0 -180 L0 198" stroke="${accent}" stroke-opacity="0.32" stroke-width="2"/>
      </g>
    `;
  }

  if (category.motif === 'quote') {
    return `
      <g transform="translate(514 504)">
        <rect x="-210" y="-172" width="420" height="344" rx="58" fill="${light}" fill-opacity="0.42" stroke="${accent}" stroke-opacity="0.25" stroke-width="3"/>
        <path d="M-96 -42 C-138 -34 -160 -6 -160 38 C-160 84 -132 112 -92 112 C-52 112 -24 82 -24 38 C-24 4 -42 -20 -70 -28 C-62 -68 -34 -94 8 -106 L-4 -136 C-62 -122 -92 -90 -96 -42Z" fill="${deep}" fill-opacity="0.38"/>
        <path d="M82 -42 C40 -34 18 -6 18 38 C18 84 46 112 86 112 C126 112 154 82 154 38 C154 4 136 -20 108 -28 C116 -68 144 -94 186 -106 L174 -136 C116 -122 86 -90 82 -42Z" fill="${accent}" fill-opacity="0.38"/>
      </g>
    `;
  }

  return `
    <g transform="translate(512 512)">
      <circle r="210" fill="none" stroke="${accent}" stroke-opacity="0.2" stroke-width="3"/>
      <circle r="144" fill="none" stroke="${soft}" stroke-opacity="0.42" stroke-width="8"/>
      <circle r="68" fill="${light}" fill-opacity="0.5"/>
      <path d="M-16 126 C-76 38 -48 -80 70 -158 C116 -50 104 52 -16 126Z" fill="${accent}" fill-opacity="0.46"/>
      <path d="M-12 112 C16 36 42 -28 74 -122" stroke="${deep}" stroke-opacity="0.34" stroke-width="6" stroke-linecap="round"/>
    </g>
  `;
}

function styleLayer(styleName, colors) {
  const [, soft, accent, deep, light] = colors;

  if (styleName === 'iphone') {
    return `
      <rect x="140" y="150" width="744" height="724" rx="118" fill="${light}" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.42" stroke-width="3"/>
      <rect x="230" y="102" width="564" height="98" rx="49" fill="${deep}" fill-opacity="0.12"/>
      <rect x="222" y="772" width="580" height="42" rx="21" fill="#ffffff" fill-opacity="0.36"/>
      <circle cx="792" cy="256" r="118" fill="${soft}" fill-opacity="0.28"/>
    `;
  }

  if (styleName === 'nature') {
    return `
      <path d="M-20 730 C190 575 360 728 535 610 C715 488 878 540 1068 405 L1068 1060 L-20 1060Z" fill="${soft}" fill-opacity="0.46"/>
      <path d="M-40 862 C210 704 400 846 618 726 C800 625 936 672 1108 562 L1108 1068 L-40 1068Z" fill="${accent}" fill-opacity="0.18"/>
      <circle cx="804" cy="230" r="84" fill="${light}" fill-opacity="0.72"/>
      <path d="M730 236 C790 196 842 196 896 230" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="5"/>
    `;
  }

  return `
    <circle cx="512" cy="512" r="330" fill="${light}" fill-opacity="0.2"/>
    <circle cx="512" cy="512" r="246" fill="none" stroke="${soft}" stroke-opacity="0.28" stroke-width="14"/>
    <circle cx="512" cy="512" r="118" fill="none" stroke="${accent}" stroke-opacity="0.24" stroke-width="5"/>
  `;
}

function svgFor(styleName, categoryName) {
  const category = categorySpecs[categoryName];
  const style = styleSpecs[styleName];
  const [background, soft, accent, deep, light] = category.palette;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${style.blur}"/>
    </filter>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="48%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="${background}"/>
  <circle cx="282" cy="194" r="332" fill="${light}" opacity="0.72"/>
  <circle cx="836" cy="812" r="420" fill="${soft}" opacity="0.62"/>
  <circle cx="860" cy="184" r="238" fill="${accent}" opacity="0.08"/>
  <g filter="url(#softBlur)" opacity="${style.opacity}">
    <circle cx="232" cy="224" r="180" fill="${light}"/>
    <circle cx="824" cy="300" r="168" fill="${accent}"/>
    <circle cx="402" cy="846" r="210" fill="${soft}"/>
  </g>
  ${styleLayer(styleName, category.palette)}
  ${flowLines(accent, light, style.lineOpacity)}
  ${categoryMotif(category, styleName, category.palette)}
  <rect x="-120" y="468" width="1264" height="54" rx="27" fill="url(#shine)" opacity="0.22" transform="rotate(-18 512 512)"/>
  <circle cx="190" cy="744" r="8" fill="${light}" opacity="0.75"/>
  <circle cx="840" cy="674" r="6" fill="${accent}" opacity="0.34"/>
  <circle cx="720" cy="140" r="5" fill="${deep}" opacity="0.16"/>
</svg>`;
}

const manifest = {};

for (const styleName of Object.keys(styleSpecs)) {
  manifest[styleName] = {};

  for (const categoryName of Object.keys(categorySpecs)) {
    const basename = `${styleName}-${categoryName}`;
    const svgPath = join(tmpDir, `${basename}.svg`);
    const jpgPath = join(outDir, `${basename}.jpg`);
    writeFileSync(svgPath, svgFor(styleName, categoryName));
    execFileSync('magick', [svgPath, '-resize', '768x768', '-strip', '-quality', '84', jpgPath], {
      stdio: 'inherit',
    });
    manifest[styleName][categoryName] = `assets/images/generated-visuals/${basename}.jpg`;
  }
}

writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
rmSync(tmpDir, { recursive: true, force: true });
