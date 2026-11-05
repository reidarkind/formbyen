import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rot = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(rot, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#BFE3F2"/>
  <rect y="46" width="64" height="18" fill="#8CC47A"/>
  <polygon points="8,32 32,12 56,32" fill="#C8553D" stroke="#3B2F2A" stroke-width="2" stroke-linejoin="round"/>
  <rect x="18" y="32" width="28" height="20" fill="#E8B27A" stroke="#3B2F2A" stroke-width="2"/>
  <rect x="28" y="40" width="8" height="12" fill="#3B2F2A"/>
  <rect x="22" y="36" width="6" height="6" fill="#FFD66B" stroke="#3B2F2A" stroke-width="1"/>
</svg>
`;
writeFileSync(join(rot, "ikon.svg"), svg);

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const lengde = Buffer.alloc(4);
  lengde.writeUInt32BE(data.length);
  const navn = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([navn, data])));
  return Buffer.concat([lengde, navn, data, crc]);
}

function png(stor) {
  const piksler = Buffer.alloc(stor * stor * 4);
  const sett = (x, y, farge) => {
    if (x < 0 || y < 0 || x >= stor || y >= stor) return;
    const i = (y * stor + x) * 4;
    piksler[i] = farge[0];
    piksler[i + 1] = farge[1];
    piksler[i + 2] = farge[2];
    piksler[i + 3] = 255;
  };
  const himmel = [0xbf, 0xe3, 0xf2];
  const gress = [0x8c, 0xc4, 0x7a];
  const tak = [0xc8, 0x55, 0x3d];
  const vegg = [0xe8, 0xb2, 0x7a];
  const kontur = [0x3b, 0x2f, 0x2a];
  const vindu = [0xff, 0xd6, 0x6b];
  for (let y = 0; y < stor; y++) {
    for (let x = 0; x < stor; x++) sett(x, y, y > stor * 0.72 ? gress : himmel);
  }
  const topp = Math.round(stor * 0.22);
  const takBunn = Math.round(stor * 0.5);
  const venstre = Math.round(stor * 0.18);
  const hoyre = Math.round(stor * 0.82);
  for (let y = topp; y <= takBunn; y++) {
    const t = (y - topp) / (takBunn - topp);
    const x0 = Math.round(stor * 0.5 - t * (stor * 0.5 - venstre));
    const x1 = Math.round(stor * 0.5 + t * (hoyre - stor * 0.5));
    for (let x = x0; x <= x1; x++) sett(x, y, tak);
  }
  const veggTopp = takBunn - Math.round(stor * 0.02);
  const veggBunn = Math.round(stor * 0.82);
  const vx0 = Math.round(stor * 0.3);
  const vx1 = Math.round(stor * 0.7);
  for (let y = veggTopp; y <= veggBunn; y++) {
    for (let x = vx0; x <= vx1; x++) sett(x, y, vegg);
  }
  const ramme = Math.max(2, Math.round(stor * 0.015));
  for (let t = 0; t < ramme; t++) {
    for (let x = vx0; x <= vx1; x++) {
      sett(x, veggTopp + t, kontur);
      sett(x, veggBunn - t, kontur);
    }
    for (let y = veggTopp; y <= veggBunn; y++) {
      sett(vx0 + t, y, kontur);
      sett(vx1 - t, y, kontur);
    }
  }
  const dorX0 = Math.round(stor * 0.46);
  const dorX1 = Math.round(stor * 0.54);
  for (let y = Math.round(stor * 0.62); y <= veggBunn; y++) {
    for (let x = dorX0; x <= dorX1; x++) sett(x, y, kontur);
  }
  const vinduY0 = Math.round(stor * 0.56);
  const vinduY1 = Math.round(stor * 0.64);
  for (let y = vinduY0; y <= vinduY1; y++) {
    for (let x = Math.round(stor * 0.36); x <= Math.round(stor * 0.42); x++) sett(x, y, vindu);
  }
  const rader = [];
  for (let y = 0; y < stor; y++) {
    rader.push(Buffer.concat([Buffer.from([0]), piksler.subarray(y * stor * 4, (y + 1) * stor * 4)]));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(stor, 0);
  ihdr.writeUInt32BE(stor, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rader))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(join(rot, "ikon-192.png"), png(192));
writeFileSync(join(rot, "ikon-512.png"), png(512));
writeFileSync(join(rot, "apple-touch-icon.png"), png(180));
