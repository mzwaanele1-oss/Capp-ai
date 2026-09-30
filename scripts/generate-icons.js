import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure Node PNG builder
function createPNG(width, height, isMaskable = false) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1; // +1 for filter byte (0)
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const scale = isMaskable ? 0.38 : 0.44;
  const outerR = width * scale;
  const innerR = width * (scale * 0.65);
  const coreR = width * (scale * 0.22);
  const coreX = cx + outerR * 0.65;
  const coreY = cy;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: Deep black / charcoal (#0a0a0f)
      let r = 10;
      let g = 10;
      let b = 15;
      let a = 255;

      // Outer squircle border for non-maskable icons
      if (!isMaskable) {
        const cornerDist = Math.hypot(
          Math.max(0, Math.abs(dx) - (width * 0.5 - 24)),
          Math.max(0, Math.abs(dy) - (height * 0.5 - 24))
        );
        if (cornerDist > 24) {
          a = 0;
        }
      }

      if (a > 0) {
        // Subtle ambient radial glow behind the letter C
        const glowFactor = Math.max(0, 1 - dist / (outerR * 1.5));
        r = Math.min(255, r + Math.floor(glowFactor * 25));
        g = Math.min(255, g + Math.floor(glowFactor * 55));
        b = Math.min(255, b + Math.floor(glowFactor * 90));

        // Angle in radians (-PI to PI)
        const angle = Math.atan2(dy, dx); // 0 is right (positive x)
        const inCutout = angle > -0.65 && angle < 0.65; // open mouth of C

        // The "C" glyph body
        if (dist >= innerR && dist <= outerR && !inCutout) {
          // Gradient from pure white at top to silver/slate at bottom
          const t = (dy + outerR) / (outerR * 2);
          const silverR = Math.floor(255 * (1 - t * 0.35));
          const silverG = Math.floor(255 * (1 - t * 0.32));
          const silverB = Math.floor(255 * (1 - t * 0.22));

          r = silverR;
          g = silverG;
          b = silverB;
        }

        // Inner Intelligence Core / Spark in the opening of the C
        const coreDist = Math.sqrt((x - coreX) * (x - coreX) + (y - coreY) * (y - coreY));
        if (coreDist <= coreR) {
          const coreT = coreDist / coreR;
          if (coreT < 0.5) {
            // White hot center
            r = 255;
            g = 255;
            b = 255;
          } else {
            // Cyan / Indigo electric energy gradient (#38bdf8 -> #6366f1)
            r = Math.floor(56 + (99 - 56) * coreT);
            g = Math.floor(189 + (102 - 189) * coreT);
            b = 248;
          }
        } else if (coreDist <= coreR * 1.8) {
          // Core glow falloff
          const glow = 1 - (coreDist - coreR) / (coreR * 0.8);
          r = Math.min(255, r + Math.floor(56 * glow * 0.6));
          g = Math.min(255, g + Math.floor(189 * glow * 0.6));
          b = Math.min(255, b + Math.floor(248 * glow * 0.6));
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Deflate IDAT chunk
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // CRC32 table & calculator
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.alloc(4 + len);
    crcBuf.write(type, 0, 4, 'ascii');
    data.copy(crcBuf, 4);
    buf.writeUInt32BE(crc32(crcBuf), 8 + len);
    return buf;
  }

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND Chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const standardSizes = [48, 72, 96, 128, 144, 152, 180, 192, 384, 512];

const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const webIconsDir = path.resolve('web', 'icons');
if (!fs.existsSync(webIconsDir)) {
  fs.mkdirSync(webIconsDir, { recursive: true });
}

for (const s of standardSizes) {
  const png = createPNG(s, s, false);
  fs.writeFileSync(path.join(publicDir, `icon-${s}x${s}.png`), png);
  console.log(`Generated icon-${s}x${s}.png`);
  if (s === 192) {
    fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png);
    fs.writeFileSync(path.join(iconsDir, 'Icon-192.png'), png);
    fs.writeFileSync(path.join(webIconsDir, 'Icon-192.png'), png);
    fs.writeFileSync(path.join(publicDir, 'Icon-192.png'), png);
  }
  if (s === 512) {
    fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png);
    fs.writeFileSync(path.join(iconsDir, 'Icon-512.png'), png);
    fs.writeFileSync(path.join(webIconsDir, 'Icon-512.png'), png);
    fs.writeFileSync(path.join(publicDir, 'Icon-512.png'), png);
  }
  if (s === 180) {
    fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png);
  }
}

// Generate maskable 512x512 with safe-zone margin
const maskable512 = createPNG(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), maskable512);
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512x512.png'), maskable512);
fs.writeFileSync(path.join(iconsDir, 'Icon-maskable-512.png'), maskable512);
fs.writeFileSync(path.join(webIconsDir, 'Icon-maskable-512.png'), maskable512);
console.log('Generated maskable icons!');
