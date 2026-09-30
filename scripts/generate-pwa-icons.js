import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Standard CRC32 table & calculator for valid PNG chunks
 */
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Generates an RGBA PNG with a solid black background (#000000)
 * and a crisp, anti-aliased white 'C' logo.
 */
function generateIconPNG(size, isMaskable = false) {
  const width = size;
  const height = size;
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1; // +1 for PNG filter byte (0)
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;

  // Scale parameters based on whether this is maskable (safe-zone) or standard
  const scale = isMaskable ? 0.30 : 0.36;
  const outerR = width * scale;
  const strokeWidth = width * (isMaskable ? 0.095 : 0.115);
  const innerR = outerR - strokeWidth;
  const midR = (outerR + innerR) / 2;
  const capR = strokeWidth / 2;

  // Cutout angle for the opening of the letter C (+/- 42 degrees)
  const cutAngle = (42 * Math.PI) / 180;
  const cosCut = Math.cos(cutAngle);
  const sinCut = Math.sin(cutAngle);

  // Centers of the rounded end caps at top-right and bottom-right tips of the C
  const topCapX = cx + midR * cosCut;
  const topCapY = cy - midR * sinCut;
  const btmCapX = cx + midR * cosCut;
  const btmCapY = cy + midR * sinCut;

  let offset = 0;

  // 2x2 supersampling for smooth edge anti-aliasing
  const subOffsets = [
    [-0.25, -0.25],
    [0.25, -0.25],
    [-0.25, 0.25],
    [0.25, 0.25],
  ];

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: 0 (None)

    for (let x = 0; x < width; x++) {
      let whiteCoverage = 0;

      for (let s = 0; s < 4; s++) {
        const px = x + 0.5 + subOffsets[s][0];
        const py = y + 0.5 + subOffsets[s][1];

        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy);

        // Check if inside the main circular arc body
        let inGlyph = false;
        if (dist >= innerR && dist <= outerR) {
          const angle = Math.atan2(dy, dx); // [-PI, PI], 0 is positive x
          if (angle < -cutAngle || angle > cutAngle) {
            inGlyph = true;
          }
        }

        // Check if inside the rounded end caps
        if (!inGlyph) {
          const dTop = Math.hypot(px - topCapX, py - topCapY);
          if (dTop <= capR) {
            inGlyph = true;
          } else {
            const dBtm = Math.hypot(px - btmCapX, py - btmCapY);
            if (dBtm <= capR) {
              inGlyph = true;
            }
          }
        }

        if (inGlyph) {
          whiteCoverage += 0.25;
        }
      }

      // Background is solid black (#000000), white logo blends smoothly
      const cVal = Math.round(255 * whiteCoverage);

      rawData[offset++] = cVal; // R
      rawData[offset++] = cVal; // G
      rawData[offset++] = cVal; // B
      rawData[offset++] = 255;  // A (Always 255 opaque, no transparency to satisfy PWABuilder)
    }
  }

  // Compress raw image data via zlib
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // PNG Signature (RFC 2083 standard 8-byte header)
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk: width, height, 8 bit-depth, RGBA (6), deflated (0), filter (0), no interlace (0)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND Chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * Main execution: generate 192x192 and 512x512 icons and write to all required directories
 */
function main() {
  console.log('🎨 Generating PWA icons (black background #000000 with white "C" logo)...');

  const targets = [
    path.resolve('web', 'icons'),
    path.resolve('public', 'icons'),
    path.resolve('dist', 'icons'),
    path.resolve('build', 'web', 'icons'),
  ];

  for (const dir of targets) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Generate 192x192
  console.log('🔨 Rendering 192x192 icon...');
  const png192 = generateIconPNG(192, false);

  // Generate 512x512 standard
  console.log('🔨 Rendering 512x512 icon...');
  const png512 = generateIconPNG(512, false);

  // Generate 512x512 maskable (safe-zone padded)
  console.log('🔨 Rendering 512x512 maskable icon...');
  const pngMaskable512 = generateIconPNG(512, true);

  // Write files to web/icons/ as requested
  const writeLocations = [
    { dir: 'web/icons', name: 'Icon-192.png', buffer: png192 },
    { dir: 'web/icons', name: 'Icon-512.png', buffer: png512 },
    { dir: 'web/icons', name: 'Icon-maskable-512.png', buffer: pngMaskable512 },

    // Also mirror to public/icons for Vite dev & static serving
    { dir: 'public/icons', name: 'Icon-192.png', buffer: png192 },
    { dir: 'public/icons', name: 'Icon-512.png', buffer: png512 },
    { dir: 'public/icons', name: 'Icon-maskable-512.png', buffer: pngMaskable512 },

    // Also mirror directly in public/ for standard PWA naming
    { dir: 'public', name: 'pwa-192x192.png', buffer: png192 },
    { dir: 'public', name: 'pwa-512x512.png', buffer: png512 },
    { dir: 'public', name: 'pwa-maskable-512x512.png', buffer: pngMaskable512 },
    { dir: 'public', name: 'apple-touch-icon.png', buffer: generateIconPNG(180, false) },

    // Mirror to dist/icons if dist exists
    { dir: 'dist/icons', name: 'Icon-192.png', buffer: png192 },
    { dir: 'dist/icons', name: 'Icon-512.png', buffer: png512 },
    { dir: 'dist/icons', name: 'Icon-maskable-512.png', buffer: pngMaskable512 },
    { dir: 'dist', name: 'pwa-192x192.png', buffer: png192 },
    { dir: 'dist', name: 'pwa-512x512.png', buffer: png512 },

    // Mirror to build/web/icons if build exists
    { dir: 'build/web/icons', name: 'Icon-192.png', buffer: png192 },
    { dir: 'build/web/icons', name: 'Icon-512.png', buffer: png512 },
    { dir: 'build/web/icons', name: 'Icon-maskable-512.png', buffer: pngMaskable512 },
  ];

  for (const item of writeLocations) {
    const fullDirPath = path.resolve(item.dir);
    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
    }
    const fullFilePath = path.join(fullDirPath, item.name);
    fs.writeFileSync(fullFilePath, item.buffer);
    const stats = fs.statSync(fullFilePath);
    console.log(`✅ Saved ${item.dir}/${item.name} (${stats.size} bytes, image/png)`);
  }

  // Validate PNG signature on web/icons/Icon-192.png & web/icons/Icon-512.png
  const check192 = fs.readFileSync(path.resolve('web/icons/Icon-192.png'));
  const is192Valid = check192[0] === 0x89 && check192[1] === 0x50 && check192[2] === 0x4e && check192[3] === 0x47;

  const check512 = fs.readFileSync(path.resolve('web/icons/Icon-512.png'));
  const is512Valid = check512[0] === 0x89 && check512[1] === 0x50 && check512[2] === 0x4e && check512[3] === 0x47;

  if (is192Valid && is512Valid) {
    console.log('\n🎉 SUCCESS: All icons generated and validated with true PNG magic headers and image/png format.');
  } else {
    console.error('❌ ERROR: PNG validation failed.');
    process.exit(1);
  }
}

main();
