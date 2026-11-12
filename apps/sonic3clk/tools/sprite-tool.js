#!/usr/bin/env node
/* eslint-env node */
/**
 * Sonic 3 Clock Sprite & Background Asset Tool
 *
 * Commands:
 *   node tools/sprite-tool.js extract
 *     Decodes all current buffers in apps/sonic3clk/app.js into PNG files in apps/sonic3clk/assets/
 *     and writes apps/sonic3clk/assets/manifest.json with exact dimensions and metadata.
 *
 *   node tools/sprite-tool.js pack
 *     Reads PNG files from apps/sonic3clk/assets/ (using manifest.json), encodes them into
 *     Espruino heatshrink-compressed base64 buffers (4-bit MAC16 for Sonic, 8-bit Web for bg),
 *     and updates apps/sonic3clk/app.js automatically!
 *
 *   node tools/sprite-tool.js encode <file.png> [sprite|bg]
 *     Prints the heatshrink base64 object snippet for a single PNG file.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "../../..");
const APP_DIR = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(APP_DIR, "assets");
const APP_JS = path.join(APP_DIR, "app.js");

const heatshrink = require(path.join(ROOT_DIR, "webtools/heatshrink.js"));
const imageconverter = require(path.join(ROOT_DIR, "webtools/imageconverter.js"));
imageconverter.setHeatShrink(heatshrink);

const MAC16 = [
  0x000000, 0x444444, 0x888888, 0xbbbbbb,
  0x996633, 0x663300, 0x006600, 0x00aa00,
  0x0099ff, 0x0000cc, 0x330099, 0xff0099,
  0xdd0000, 0xff6600, 0xffff00, 0xffffff,
];

const SONIC_PALETTE = [
  0x000000, // 0: Black
  0x000000, // 1: Transparent
  0x888888, // 2: Grey
  0xbbbbbb, // 3: Light Grey
  0xC86018, // 4: Skin Shadow (#C86018 - warm caramel shadow)
  0x883808, // 5: Deep Skin Crease Shadow (#883808 - warm brown)
  0x006600, // 6: Green
  0x00aa00, // 7: Bright Green
  0x00B8FF, // 8: Highlight Blue (#00B8FF - bright electric azure, 0% Red)
  0x0055FF, // 9: Body Blue (#0055FF - vivid cobalt blue, 0% Red)
  0x330099, // 10: Deep Purple
  0xff0099, // 11: Pink
  0xFC0000, // 12: Shoe Red (#FC0000)
  0xFFA848, // 13: Skin Peach (#FFA848 - vibrant golden peach)
  0xffff00, // 14: Buckle Yellow (#ffff00)
  0xffffff  // 15: White (#ffffff)
];

const BG_PALETTE = [
  0x000000, // 0: Black outline / deep shadow
  0x240000, // 1: Soil / deep root shadow
  0x008800, // 2: Deep canopy shadow (rich forest green)
  0x00B400, // 3: Mid canopy green
  0x00E000, // 4: Lush emerald canopy green
  0x44FC00, // 5: Vibrant lime canopy highlight
  0x24FC24, // 6: Bright mint canopy highlight
  0x6C2400, // 7: Dark trunk bark shadow
  0xC05000, // 8: Warm trunk brown
  0xF07800, // 9: Bright golden trunk wood
  0xFFD800, // 10: Golden sand / grass flower
  0xFFFF00, // 11: Vibrant sunny yellow
  0x0055FF, // 12: Vibrant blue flower
  0x00B8FF, // 13: Bright azure flower highlight
  0x00FCFC, // 14: Electric cyan flower center
  0xFFFFFF  // 15: White cloud / sparkle
];

const WEB = [
  0x000000,0x000033,0x000066,0x000099,0x0000cc,0x0000ff,0x003300,0x003333,0x003366,0x003399,0x0033cc,0x0033ff,0x006600,0x006633,0x006666,0x006699,0x0066cc,0x0066ff,0x009900,0x009933,0x009966,0x009999,0x0099cc,0x0099ff,0x00cc00,0x00cc33,0x00cc66,0x00cc99,0x00cccc,0x00ccff,0x00ff00,0x00ff33,0x00ff66,0x00ff99,0x00ffcc,0x00ffff,
  0x330000,0x330033,0x330066,0x330099,0x3300cc,0x3300ff,0x333300,0x333333,0x333366,0x333399,0x3333cc,0x3333ff,0x336600,0x336633,0x336666,0x336699,0x3366cc,0x3366ff,0x339900,0x339933,0x339966,0x339999,0x3399cc,0x3399ff,0x33cc00,0x33cc33,0x33cc66,0x33cc99,0x33cccc,0x33ccff,0x33ff00,0x33ff33,0x33ff66,0x33ff99,0x33ffcc,0x33ffff,
  0x660000,0x660033,0x660066,0x660099,0x6600cc,0x6600ff,0x663300,0x663333,0x663366,0x663399,0x6633cc,0x6633ff,0x666600,0x666633,0x666666,0x666699,0x6666cc,0x6666ff,0x669900,0x669933,0x669966,0x669999,0x6699cc,0x6699ff,0x66cc00,0x66cc33,0x66cc66,0x66cc99,0x66cccc,0x66ccff,0x66ff00,0x66ff33,0x66ff66,0x66ff99,0x66ffcc,0x66ffff,
  0x990000,0x990033,0x990066,0x990099,0x9900cc,0x9900ff,0x993300,0x993333,0x993366,0x993399,0x9933cc,0x9933ff,0x996600,0x996633,0x996666,0x996699,0x9966cc,0x9966ff,0x999900,0x999933,0x999966,0x999999,0x9999cc,0x9999ff,0x99cc00,0x99cc33,0x99cc66,0x99cc99,0x99cccc,0x99ccff,0x99ff00,0x99ff33,0x99ff66,0x99ff99,0x99ffcc,0x99ffff,
  0xcc0000,0xcc0033,0xcc0066,0xcc0099,0xcc00cc,0xcc00ff,0xcc3300,0xcc3333,0xcc3366,0xcc3399,0xcc33cc,0xcc33ff,0xcc6600,0xcc6633,0xcc6666,0xcc6699,0xcc66cc,0xcc66ff,0xcc9900,0xcc9933,0xcc9966,0xcc9999,0xcc99cc,0xcc99ff,0xcccc00,0xcccc33,0xcccc66,0xcccc99,0xcccccc,0xccccff,0xccff00,0xccff33,0xccff66,0xccff99,0xccffcc,0xccffff,
  0xff0000,0xff0033,0xff0066,0xff0099,0xff00cc,0xff00ff,0xff3300,0xff3333,0xff3366,0xff3399,0xff33cc,0xff33ff,0xff6600,0xff6633,0xff6666,0xff6699,0xff66cc,0xff66ff,0xff9900,0xff9933,0xff9966,0xff9999,0xff99cc,0xff99ff,0xffcc00,0xffcc33,0xffcc66,0xffcc99,0xffcccc,0xffccff,0xffff00,0xffff33,0xffff66,0xffff99,0xffffcc,0xffffff,
];

function decodeBufferToRGBA(b64, width, height, bpp, transparent, type = "sprite") {
  const compressed = Uint8Array.from(Buffer.from(b64, "base64"));
  const raw = heatshrink.decompress(compressed);
  const palette = bpp === 4 ? (type === "sprite" ? SONIC_PALETTE : MAC16) : WEB;
  const rgba = Buffer.alloc(width * height * 4);

  let p = 0;
  let nibits = 0;
  let nidata = 0;
  for (let i = 0; i < width * height; i++) {
    while (nibits < bpp) {
      nidata = (nidata << 8) | (raw[p++] || 0);
      nibits += 8;
    }
    const c = (nidata >> (nibits - bpp)) & ((1 << bpp) - 1);
    nibits -= bpp;

    if (c === transparent) {
      rgba[i * 4 + 0] = 0;
      rgba[i * 4 + 1] = 0;
      rgba[i * 4 + 2] = 0;
      rgba[i * 4 + 3] = 0;
    } else {
      const rgb = palette[c] !== undefined ? palette[c] : 0;
      rgba[i * 4 + 0] = (rgb >> 16) & 255;
      rgba[i * 4 + 1] = (rgb >> 8) & 255;
      rgba[i * 4 + 2] = rgb & 255;
      rgba[i * 4 + 3] = 255;
    }
  }
  return rgba;
}

function writeRGBAtoPNG(rgba, width, height, outPath) {
  execFileSync(
    "magick",
    ["-size", `${width}x${height}`, "-depth", "8", "rgba:-", outPath],
    { input: rgba }
  );
}

function readPNGtoRGBA(inPath) {
  const info = execFileSync("magick", ["identify", "-format", "%w %h", inPath])
    .toString()
    .trim()
    .split(" ");
  const width = parseInt(info[0], 10);
  const height = parseInt(info[1], 10);
  const rgba = execFileSync("magick", [inPath, "-depth", "8", "rgba:-"]);
  return { width, height, rgba: new Uint8Array(rgba) };
}

function lookupColor(palette, r, g, b) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i];
    if (p === null) continue; // reserved transparent index
    const pr = (p >> 16) & 255;
    const pg = (p >> 8) & 255;
    const pb = p & 255;
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function encodePNGToHeatshrinkB64(inPath, type = "sprite", targetBpp, targetTransparent) {
  const { width, height, rgba } = readPNGtoRGBA(inPath);
  const bpp = targetBpp !== undefined ? targetBpp : (type === "bg" ? 4 : 4);
  const transparent = targetTransparent !== undefined ? targetTransparent : (type === "bg" ? undefined : 1);

  // Build palette where the transparent index is excluded from opaque pixel matching
  const basePalette = type === "sprite" ? SONIC_PALETTE : (type === "bg" ? BG_PALETTE : (bpp === 4 ? MAC16 : WEB));
  const palette = basePalette.slice();
  if (transparent !== undefined && transparent < palette.length) {
    palette[transparent] = null;
  }

  const bitData = new Uint8Array(Math.ceil((width * height * bpp) / 8));
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4 + 0];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    const a = rgba[i * 4 + 3];

    let c;
    if (transparent !== undefined && a < 128) {
      c = transparent;
    } else {
      c = lookupColor(palette, r, g, b);
    }
    if (bpp === 4) {
      bitData[i >> 1] |= c << (i & 1 ? 0 : 4);
    } else {
      bitData[i] = c;
    }
  }

  const compressed = heatshrink.compress(bitData);
  const b64 = Buffer.from(compressed).toString("base64");
  return { width, height, bpp, transparent, b64 };
}

function parseAppJs() {
  const code = fs.readFileSync(APP_JS, "utf8");
  // Extract the declarations between `const defaultSonic =` and `const topSpeed =`
  const match = code.match(/const defaultSonic =[\s\S]*?(?=\nconst topSpeed =)/);
  if (!match) {
    throw new Error("Could not find sprite/bg definitions in app.js");
  }
  const snippet = match[0]
    .replace(/require\("heatshrink"\)\.decompress\(atob\("([^"]+)"\)\)/g, '"$1"');
  const fn = new Function(`${snippet}\nreturn { defaultSonic, startingBuffers, stoppingBuffers, waitingBuffers, bg };`);
  return fn();
}

function extract() {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const data = parseAppJs();
  const manifest = {
    defaultSonic: null,
    startingBuffers: [],
    stoppingBuffers: [],
    waitingBuffers: [],
    bg: null,
  };

  // 1. defaultSonic
  {
    const file = "defaultSonic.png";
    const rgba = decodeBufferToRGBA(data.defaultSonic.buffer, data.defaultSonic.width, data.defaultSonic.height, 4, 1);
    writeRGBAtoPNG(rgba, data.defaultSonic.width, data.defaultSonic.height, path.join(ASSETS_DIR, file));
    manifest.defaultSonic = {
      file,
      width: data.defaultSonic.width,
      height: data.defaultSonic.height,
      bpp: 4,
      transparent: 1,
    };
  }

  // 2. startingBuffers
  data.startingBuffers.forEach((item, idx) => {
    const file = `starting_${String(idx).padStart(2, "0")}.png`;
    const rgba = decodeBufferToRGBA(item.buffer, item.width, item.height, 4, 1);
    writeRGBAtoPNG(rgba, item.width, item.height, path.join(ASSETS_DIR, file));
    manifest.startingBuffers.push({
      index: idx,
      role: idx < 6 ? "walk/accelerate buildup" : "full-speed run loop (frames 6-9 loop)",
      file,
      width: item.width,
      height: item.height,
    });
  });

  // 3. stoppingBuffers
  data.stoppingBuffers.forEach((item, idx) => {
    const file = `stopping_${String(idx).padStart(2, "0")}.png`;
    const rgba = decodeBufferToRGBA(item.buffer, item.width, item.height, 4, 1);
    writeRGBAtoPNG(rgba, item.width, item.height, path.join(ASSETS_DIR, file));
    manifest.stoppingBuffers.push({
      index: idx,
      file,
      width: item.width,
      height: item.height,
    });
  });

  // 4. waitingBuffers
  data.waitingBuffers.forEach((item, idx) => {
    const file = `waiting_${String(idx).padStart(2, "0")}.png`;
    const rgba = decodeBufferToRGBA(item.buffer, item.width, item.height, 4, 1);
    writeRGBAtoPNG(rgba, item.width, item.height, path.join(ASSETS_DIR, file));
    manifest.waitingBuffers.push({
      index: idx,
      file,
      width: item.width,
      height: item.height,
      offset: item.offset,
    });
  });

  // 5. bg
  {
    const file = "bg.png";
    const rgba = decodeBufferToRGBA(data.bg.buffer, data.bg.width, data.bg.height, data.bg.bpp, data.bg.transparent);
    writeRGBAtoPNG(rgba, data.bg.width, data.bg.height, path.join(ASSETS_DIR, file));
    manifest.bg = {
      file,
      width: data.bg.width,
      height: data.bg.height,
      bpp: data.bg.bpp,
      transparent: data.bg.transparent,
    };
  }

  fs.writeFileSync(path.join(ASSETS_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Extracted 15 Sonic frames + 1 background image to ${ASSETS_DIR}`);
}

function pack() {
  const manifestPath = path.join(ASSETS_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const def = encodePNGToHeatshrinkB64(path.join(ASSETS_DIR, manifest.defaultSonic.file), "sprite");
  const starting = manifest.startingBuffers.map((item) => ({
    ...item,
    ...encodePNGToHeatshrinkB64(path.join(ASSETS_DIR, item.file), "sprite"),
  }));
  const stopping = manifest.stoppingBuffers.map((item) => ({
    ...item,
    ...encodePNGToHeatshrinkB64(path.join(ASSETS_DIR, item.file), "sprite"),
  }));
  const waiting = manifest.waitingBuffers.map((item) => ({
    ...item,
    ...encodePNGToHeatshrinkB64(path.join(ASSETS_DIR, item.file), "sprite"),
  }));
  const bgEnc = encodePNGToHeatshrinkB64(
    path.join(ASSETS_DIR, manifest.bg.file),
    "bg",
    manifest.bg.bpp || 4,
    manifest.bg.transparent
  );

  let block = `const defaultSonic = {\n  width: ${def.width},\n  height: ${def.height},\n  buffer: require("heatshrink").decompress(atob("${def.b64}")),\n};\n\n`;

  block += `const startingBuffers = [\n`;
  for (const s of starting) {
    block += `  {\n    width: ${s.width},\n    height: ${s.height},\n    buffer: require("heatshrink").decompress(atob("${s.b64}")),\n  },\n`;
  }
  block += `];\n\n`;

  block += `const stoppingBuffers = [\n`;
  for (const s of stopping) {
    block += `  {\n    width: ${s.width},\n    height: ${s.height},\n    buffer: require("heatshrink").decompress(atob("${s.b64}")),\n  },\n`;
  }
  block += `];\n\n`;

  block += `const waitingBuffers = [\n`;
  for (const w of waiting) {
    const offsetLine = w.offset !== undefined ? `    offset: ${w.offset},\n` : "";
    block += `  {\n    width: ${w.width},\n    height: ${w.height},\n${offsetLine}    buffer: require("heatshrink").decompress(atob("${w.b64}")),\n  },\n`;
  }
  block += `];\n\n`;

  const transLine = bgEnc.transparent !== undefined ? `  transparent: ${bgEnc.transparent},\n` : "";
  block += `const bgPalette = new Uint16Array(E.toArrayBuffer(E.toFlatString(atob("AAAAIEAEoAUAB+BH5CcgaYDCwPPA/uD/vwLfBf8H//8="))));\n`;
  block += `const bg = {\n  width: ${bgEnc.width},\n  height: ${bgEnc.height},\n  bpp: ${bgEnc.bpp},\n  palette: bgPalette,\n${transLine}  buffer: require("heatshrink").decompress(atob("${bgEnc.b64}")),\n};`;

  let code = fs.readFileSync(APP_JS, "utf8");
  code = code.replace(/const bgWidth = \d+;/, `const bgWidth = ${bgEnc.width};`);
  code = code.replace(
    /const sonicPalette = new Uint16Array\(E\.toArrayBuffer\(E\.toFlatString\(atob\("[^"]+"\)\)\)\);/,
    'const sonicPalette = new Uint16Array(E.toArrayBuffer(E.toFlatString(atob("AAAAAFGM170Dy8GJIANABd8FvwITMBP4APhJ/eD///8="))));'
  );
  code = code.replace(/g\.setTheme\(\{ bg: "[^"]+", fg: "#fff", dark: true \}\)\.clear\(\);/, 'g.setTheme({ bg: "#008800", fg: "#fff", dark: true }).clear();');
  code = code.replace(/const defaultSonic =[\s\S]*?(?=\n\nconst topSpeed =)/, block);
  fs.writeFileSync(APP_JS, code);
  console.log(`Updated ${APP_JS} from PNGs in ${ASSETS_DIR}`);
}

const cmd = process.argv[2] || "extract";
if (cmd === "extract") {
  extract();
} else if (cmd === "pack") {
  pack();
} else if (cmd === "encode") {
  const file = process.argv[3];
  const type = process.argv[4] || "sprite";
  const res = encodePNGToHeatshrinkB64(file, type);
  console.log(
    `{\n  width: ${res.width},\n  height: ${res.height},\n  buffer: require("heatshrink").decompress(atob("${res.b64}")),\n}`
  );
} else {
  console.error("Usage: node sprite-tool.js [extract|pack|encode <file.png> [sprite|bg]]");
  process.exit(1);
}
