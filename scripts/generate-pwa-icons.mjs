import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const outputDirectory = join(projectRoot, 'public', 'icons');

const palette = {
  paper: [245, 241, 233, 255],
  ink: [36, 35, 31, 255],
  accent: [167, 71, 47, 255],
};

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function blendPixel(pixels, size, x, y, color, coverage = 1) {
  if (x < 0 || y < 0 || x >= size || y >= size || coverage <= 0) return;
  const index = (y * size + x) * 4;
  const amount = Math.min(1, coverage);
  for (let channel = 0; channel < 3; channel += 1) {
    pixels[index + channel] = Math.round(
      pixels[index + channel] * (1 - amount) + color[channel] * amount,
    );
  }
  pixels[index + 3] = 255;
}

function fillRect(pixels, size, left, top, right, bottom, color) {
  for (let y = Math.floor(top); y < Math.ceil(bottom); y += 1) {
    for (let x = Math.floor(left); x < Math.ceil(right); x += 1) {
      const horizontal = Math.min(x + 1, right) - Math.max(x, left);
      const vertical = Math.min(y + 1, bottom) - Math.max(y, top);
      blendPixel(pixels, size, x, y, color, horizontal * vertical);
    }
  }
}

function fillCircle(pixels, size, centerX, centerY, radius, color) {
  const edge = 1.2;
  for (let y = Math.floor(centerY - radius - edge); y <= Math.ceil(centerY + radius + edge); y += 1) {
    for (let x = Math.floor(centerX - radius - edge); x <= Math.ceil(centerX + radius + edge); x += 1) {
      const distance = Math.hypot(x + 0.5 - centerX, y + 0.5 - centerY);
      blendPixel(pixels, size, x, y, color, Math.min(1, radius + edge - distance));
    }
  }
}

function fillRoundedRect(pixels, size, left, top, right, bottom, radius, color) {
  const edge = 1.2;
  for (let y = Math.floor(top - edge); y <= Math.ceil(bottom + edge); y += 1) {
    for (let x = Math.floor(left - edge); x <= Math.ceil(right + edge); x += 1) {
      const sampleX = x + 0.5;
      const sampleY = y + 0.5;
      const nearestX = Math.min(Math.max(sampleX, left + radius), right - radius);
      const nearestY = Math.min(Math.max(sampleY, top + radius), bottom - radius);
      const distance = Math.hypot(sampleX - nearestX, sampleY - nearestY);
      blendPixel(pixels, size, x, y, color, Math.min(1, radius + edge - distance));
    }
  }
}

function strokeRoundedRect(pixels, size, left, top, right, bottom, radius, stroke, color, fill) {
  fillRoundedRect(pixels, size, left, top, right, bottom, radius, color);
  fillRoundedRect(
    pixels,
    size,
    left + stroke,
    top + stroke,
    right - stroke,
    bottom - stroke,
    Math.max(1, radius - stroke),
    fill,
  );
}

function drawIcon(size, safeScale = 1) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let index = 0; index < pixels.length; index += 4) {
    pixels.set(palette.paper, index);
  }

  const center = size / 2;
  const unit = size * safeScale;
  const shift = (size - unit) / 2;
  const scaled = (value) => shift + value * unit;
  const stroke = Math.max(1, unit * 0.035);
  const radius = unit * 0.063;

  strokeRoundedRect(
    pixels,
    size,
    scaled(0.219),
    scaled(0.246),
    scaled(0.727),
    scaled(0.605),
    radius,
    stroke,
    palette.ink,
    palette.paper,
  );
  strokeRoundedRect(
    pixels,
    size,
    scaled(0.273),
    scaled(0.395),
    scaled(0.781),
    scaled(0.754),
    radius,
    stroke,
    palette.ink,
    palette.paper,
  );
  fillRoundedRect(
    pixels,
    size,
    scaled(0.383),
    scaled(0.523),
    scaled(0.602),
    scaled(0.558),
    unit * 0.018,
    palette.ink,
  );
  fillCircle(
    pixels,
    size,
    scaled(0.668),
    scaled(0.541),
    unit * 0.029,
    palette.accent,
  );

  return pixels;
}

function encodePng(size, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (size * 4 + 1);
    rows[rowOffset] = 0;
    pixels.copy(rows, rowOffset + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function generate(fileName, size, safeScale = 1, directory = outputDirectory) {
  const path = join(directory, fileName);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, encodePng(size, drawIcon(size, safeScale)));
  console.log(`Generated ${fileName} (${size}x${size})`);
}

await generate('apple-touch-icon-180.png', 180);
await generate('icon-192.png', 192);
await generate('icon-512.png', 512);
await generate('icon-maskable-512.png', 512, 0.8);

const extensionDirectory = join(projectRoot, 'extension');
await generate('icon-16.png', 16, 0.9, extensionDirectory);
await generate('icon-32.png', 32, 0.9, extensionDirectory);
await generate('icon-48.png', 48, 0.9, extensionDirectory);
await generate('icon-128.png', 128, 0.9, extensionDirectory);
