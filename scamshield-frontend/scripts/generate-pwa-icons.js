/**
 * Generates PWA icons programmatically using Canvas API
 * Run with: node scripts/generate-pwa-icons.js
 * Requires: npm install canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, size, size);

  // Shield shape
  const centerX = size / 2;
  const shieldHeight = size * 0.75;
  const shieldWidth = size * 0.65;
  const top = size * 0.1;

  ctx.beginPath();
  ctx.moveTo(centerX, top);
  ctx.lineTo(centerX + shieldWidth / 2, top + shieldHeight * 0.25);
  ctx.lineTo(centerX + shieldWidth / 2, top + shieldHeight * 0.6);
  ctx.quadraticCurveTo(centerX, top + shieldHeight, centerX, top + shieldHeight);
  ctx.quadraticCurveTo(centerX, top + shieldHeight, centerX - shieldWidth / 2, top + shieldHeight * 0.6);
  ctx.lineTo(centerX - shieldWidth / 2, top + shieldHeight * 0.25);
  ctx.closePath();
  ctx.fillStyle = '#3B82F6';
  ctx.fill();

  // Checkmark
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX - size * 0.15, centerX);
  ctx.lineTo(centerX - size * 0.03, centerX + size * 0.12);
  ctx.lineTo(centerX + size * 0.18, centerX - size * 0.1);
  ctx.stroke();

  // Save
  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filename, buffer);
  console.log(`Generated: icon-${size}x${size}.png`);
});

console.log('All PWA icons generated successfully!');