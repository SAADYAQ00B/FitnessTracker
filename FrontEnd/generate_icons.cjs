const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const RES_DIR = path.join(__dirname, 'android/app/src/main/res');

// Density configurations
const MIPMAP_CONFIG = [
  { folder: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
  { folder: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
  { folder: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
  { folder: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
  { folder: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
];

async function main() {
  console.log('--- Generating Android Icons ---');

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
      emblemBuffer[i] = 16;
      emblemBuffer[i + 1] = 24;
      emblemBuffer[i + 2] = 20;
      emblemBuffer[i + 3] = 255;
    }
  }

  // Trimmed emblem
  const trimmedEmblemBuffer = await sharp(emblemBuffer, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png()
    .toBuffer();

  const trimmedMeta = await sharp(trimmedEmblemBuffer).metadata();
  console.log(`Trimmed emblem: ${trimmedMeta.width}x${trimmedMeta.height}`);

  for (const config of MIPMAP_CONFIG) {
    const targetDir = path.join(RES_DIR, config.folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. ic_launcher_foreground.png (fgSize x fgSize, transparent bg, emblem in safe zone ~60%)
    const fgTargetW = Math.round(config.fgSize * 0.60);
    const resizedFgEmblem = await sharp(trimmedEmblemBuffer)
      .resize({ width: fgTargetW, fit: 'inside' })
      .toBuffer();

    await sharp({
      create: {
        width: config.fgSize,
        height: config.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resizedFgEmblem, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    // 2. ic_launcher.png (iconSize x iconSize, rounded squircle, #99D29E background)
    const iconTargetW = Math.round(config.iconSize * 0.72);
    const resizedIconEmblem = await sharp(trimmedEmblemBuffer)
      .resize({ width: iconTargetW, fit: 'inside' })
      .toBuffer();

    const roundedCornerSvg = Buffer.from(
      `<svg><rect x="0" y="0" width="${config.iconSize}" height="${config.iconSize}" rx="${Math.round(config.iconSize * 0.22)}" fill="#99D29E"/></svg>`
    );

    const squircleBg = await sharp(roundedCornerSvg).png().toBuffer();

    await sharp(squircleBg)
      .composite([{ input: resizedIconEmblem, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 3. ic_launcher_round.png (iconSize x iconSize, circular, #99D29E background)
    const roundTargetW = Math.round(config.iconSize * 0.65);
    const resizedRoundEmblem = await sharp(trimmedEmblemBuffer)
      .resize({ width: roundTargetW, fit: 'inside' })
      .toBuffer();

    const circleSvg = Buffer.from(
      `<svg><circle cx="${config.iconSize / 2}" cy="${config.iconSize / 2}" r="${config.iconSize / 2}" fill="#99D29E"/></svg>`
    );
    const circleBg = await sharp(circleSvg).png().toBuffer();

    await sharp(circleBg)
      .composite([{ input: resizedRoundEmblem, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    console.log(`Generated icons for ${config.folder}`);
  }

  console.log('All launcher icons generated successfully!');
}

main().catch(console.error);
