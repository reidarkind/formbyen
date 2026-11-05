import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rot = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(rot, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#BFE3F2"/>
  <rect y="50" width="64" height="14" fill="#8CC47A"/>
  <rect x="4" y="36" width="10" height="6" fill="#6FB1D8" transform="rotate(-8 9 39)"/>
  <rect x="50" y="36" width="10" height="6" fill="#FFD66B" transform="rotate(8 55 39)"/>
  <polygon points="20,18 32,6 44,18" fill="#C8553D" stroke="#3B2F2A" stroke-width="2" stroke-linejoin="round"/>
  <rect x="22" y="18" width="20" height="32" fill="#E8B27A" stroke="#3B2F2A" stroke-width="2"/>
  <circle cx="32" cy="30" r="7" fill="#FFF8EA" stroke="#3B2F2A" stroke-width="2"/>
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

function png(stor, valg = {}) {
  const piksler = Buffer.alloc(stor * stor * 4);
  const sett = (x, y, farge) => {
    if (x < 0 || y < 0 || x >= stor || y >= stor) return;
    const i = (y * stor + x) * 4;
    piksler[i] = farge[0];
    piksler[i + 1] = farge[1];
    piksler[i + 2] = farge[2];
    piksler[i + 3] = 255;
  };
  const fyll = (x0, y0, x1, y1, farge) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) sett(x, y, farge);
  };
  const skive = (cx, cy, r, farge) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) sett(x, y, farge);
      }
    }
  };
  const himmel = [0xbf, 0xe3, 0xf2];
  const gress = [0x8c, 0xc4, 0x7a];
  const tak = [0xc8, 0x55, 0x3d];
  const vegg = [0xe8, 0xb2, 0x7a];
  const kontur = [0x3b, 0x2f, 0x2a];
  const urskive = [0xff, 0xf8, 0xea];
  const sol = [0xff, 0xd6, 0x6b];
  const bla = [0x6f, 0xb1, 0xd8];
  const s = (n) => Math.round(stor * n);
  for (let y = 0; y < stor; y++) for (let x = 0; x < stor; x++) sett(x, y, y > s(0.78) ? gress : himmel);
  const inn = valg.tett ? 0.12 : 0.06;
  if (!valg.bareTårn) {
    const stabler = [
      [inn, [bla, sol, gress]],
      [1 - inn - 0.16, [vegg, tak, sol]],
    ];
    for (const [x0, farger] of stabler) {
      farger.forEach((farge, i) => {
        const y0 = 0.5 + i * 0.09;
        fyll(s(x0), s(y0), s(x0 + 0.16), s(y0 + 0.08), farge);
      });
    }
  }
  const takTopp = s(0.1);
  const takBunn = s(0.28);
  for (let y = takTopp; y <= takBunn; y++) {
    const t = (y - takTopp) / Math.max(1, takBunn - takTopp);
    fyll(s(0.5 - t * 0.22), y, s(0.5 + t * 0.22), y, tak);
  }
  fyll(s(0.3), takBunn, s(0.7), s(0.78), vegg);
  fyll(s(0.3), takBunn, s(0.7), takBunn + s(0.015), kontur);
  fyll(s(0.3), s(0.78) - s(0.015), s(0.7), s(0.78), kontur);
  fyll(s(0.3), takBunn, s(0.3) + s(0.015), s(0.78), kontur);
  fyll(s(0.7) - s(0.015), takBunn, s(0.7), s(0.78), kontur);
  skive(s(0.5), s(0.48), s(0.13), urskive);
  skive(s(0.5), s(0.48), s(0.13), kontur);
  skive(s(0.5), s(0.48), s(0.11), urskive);
  fyll(s(0.49), s(0.4), s(0.51), s(0.48), kontur);
  fyll(s(0.5), s(0.47), s(0.58), s(0.49), kontur);
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

writeFileSync(join(rot, "ikon-32.png"), png(32, { bareTårn: true }));
writeFileSync(join(rot, "ikon-192.png"), png(192));
writeFileSync(join(rot, "ikon-512.png"), png(512));
writeFileSync(join(rot, "ikon-maskable-512.png"), png(512, { tett: true }));
writeFileSync(join(rot, "apple-touch-icon.png"), png(180));
