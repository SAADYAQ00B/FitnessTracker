const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const RES_DIR = path.join(__dirname, 'android/app/src/main/res');

const SPLASH_TARGETS = [
  // Default fallback
  { folder: 'drawable', width: 1080, height: 1920, isPortrait: true },

  // Portrait densities
  { folder: 'drawable-port-xxxhdpi', width: 1080, height: 1920, isPortrait: true },
  { folder: 'drawable-port-xxhdpi', width: 960, height: 1600, isPortrait: true },
  { folder: 'drawable-port-xhdpi', width: 720, height: 1280, isPortrait: true },
  { folder: 'drawable-port-hdpi', width: 480, height: 800, isPortrait: true },
  { folder: 'drawable-port-mdpi', width: 320, height: 480, isPortrait: true },

  // Landscape densities
  { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1080, isPortrait: false },
  { folder: 'drawable-land-xxhdpi', width: 1600, height: 960, isPortrait: false },
  { folder: 'drawable-land-xhdpi', width: 1280, height: 720, isPortrait: false },
  { folder: 'drawable-land-hdpi', width: 800, height: 480, isPortrait: false },
  { folder: 'drawable-land-mdpi', width: 480, height: 320, isPortrait: false },
];

async function main() {
  console.log('--- Generating High-Resolution Splash Screens ---');

  // 1. Extract emblem with transparent background
  const { data, info } = await sharp('app-logo.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const emblemBuffer = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 120 && g > 160 && b > 120) {
      emblemBuffer[i] = 0;
      emblemBuffer[i + 1] = 0;
      emblemBuffer[i + 2] = 0;
      emblemBuffer[i + 3] = 0;
    } else {
      emblemBuffer[i] = 15;
      emblemBuffer[i + 1] = 23;
      emblemBuffer[i + 2] = 20;
      emblemBuffer[i + 3] = 255;
    }
  }

  const trimmedEmblemBuffer = await sharp(emblemBuffer, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png()
    .toBuffer();

  const emblemMeta = await sharp(trimmedEmblemBuffer).metadata();
  const emblemAspect = emblemMeta.width / emblemMeta.height; // ~1.66

  for (const target of SPLASH_TARGETS) {
    const targetDir = path.join(RES_DIR, target.folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const W = target.width;
    const H = target.height;

    // Scale calculations
    const scale = target.isPortrait ? (W / 1080) : (H / 1080);
    const emblemW = Math.round((target.isPortrait ? 380 : 300) * scale);
    const emblemH = Math.round(emblemW / emblemAspect);

    const titleSize = Math.max(14, Math.round(44 * scale));
    const titleLetterSpacing = Math.max(2, Math.round(6 * scale));
    const taglineSize = Math.max(9, Math.round(16 * scale));
    const taglineLetterSpacing = Math.max(1, Math.round(4 * scale));

    const gap1 = Math.round(36 * scale); // emblem to title
    const gap2 = Math.round(22 * scale); // title to tagline

    const totalBlockH = emblemH + gap1 + titleSize + gap2 + taglineSize;
    const startY = Math.round((H - totalBlockH) / 2);

    const emblemX = Math.round((W - emblemW) / 2);
    const emblemY = startY;

    const titleY = emblemY + emblemH + gap1 + Math.round(titleSize * 0.85);
    const taglineY = titleY + gap2 + Math.round(taglineSize * 0.85);

    // Resize emblem
    const resizedEmblem = await sharp(trimmedEmblemBuffer)
      .resize({ width: emblemW, height: emblemH, fit: 'fill' })
      .toBuffer();

    // Render SVG Typography
    const svgTypography = Buffer.from(`
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <text 
          x="${W / 2}" 
          y="${titleY}" 
          text-anchor="middle" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="${titleSize}px" 
          font-weight="900" 
          letter-spacing="${titleLetterSpacing}px" 
          fill="#0c1e15"
        >FITNESSTRACKER</text>
        <text 
          x="${W / 2}" 
          y="${taglineY}" 
          text-anchor="middle" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="${taglineSize}px" 
          font-weight="700" 
          letter-spacing="${taglineLetterSpacing}px" 
          fill="#1b4332"
          opacity="0.85"
        >TRACK  •  TRAIN  •  TRANSFORM</text>
      </svg>
    `);

    // Composite over #99D29E background
    await sharp({
      create: {
        width: W,
        height: H,
        channels: 4,
        background: { r: 153, g: 210, b: 158, alpha: 1 }, // #99D29E
      },
    })
      .composite([
        { input: resizedEmblem, left: emblemX, top: emblemY },
        { input: svgTypography, left: 0, top: 0 },
      ])
      .png()
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`✓ Generated splash for ${target.folder} (${W}x${H})`);
  }

  console.log('All splash screens generated successfully!');
}

main().catch(console.error);
