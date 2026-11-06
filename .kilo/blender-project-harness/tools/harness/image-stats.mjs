import zlib from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function paeth(left, up, upperLeft) {
  const p = left + up - upperLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upperLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upperLeft;
}

function readChunks(buffer) {
  const chunks = [];
  let at = PNG_SIGNATURE.length;
  while (at + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(at);
    const type = buffer.toString('ascii', at + 4, at + 8);
    const start = at + 8;
    const end = start + length;
    if (end + 4 > buffer.length) throw new Error('truncated PNG chunk');
    chunks.push({ type, data: buffer.subarray(start, end) });
    at = end + 4;
    if (type === 'IEND') break;
  }
  return chunks;
}

function decodeRows(data, width, height, channels, bitDepth) {
  if (bitDepth !== 8) return null;
  const stride = width * channels;
  const rows = Buffer.alloc(stride * height);
  let at = 0;
  for (let y = 0; y < height; y += 1) {
    if (at >= data.length) return null;
    const filter = data[at];
    at += 1;
    if (at + stride > data.length) return null;
    for (let x = 0; x < stride; x += 1) {
      const raw = data[at + x];
      const left = x >= channels ? rows[y * stride + x - channels] : 0;
      const up = y > 0 ? rows[(y - 1) * stride + x] : 0;
      const upperLeft = x >= channels && y > 0 ? rows[(y - 1) * stride + x - channels] : 0;
      let value;
      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) value = raw + paeth(left, up, upperLeft);
      else return null;
      rows[y * stride + x] = value & 0xff;
    }
    at += stride;
  }
  return rows;
}

export function pngStats(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return { supported: false, reason: 'not a PNG' };
  }
  try {
    const chunks = readChunks(buffer);
    const header = chunks.find((chunk) => chunk.type === 'IHDR')?.data;
    if (!header || header.length < 13) return { supported: false, reason: 'missing IHDR' };
    const width = header.readUInt32BE(0);
    const height = header.readUInt32BE(4);
    const bitDepth = header[8];
    const colorType = header[9];
    const interlace = header[12];
    if (!width || !height || width * height > 50_000_000) return { supported: false, reason: 'unsupported dimensions' };
    if (interlace !== 0) return { supported: false, reason: 'interlaced PNG' };
    const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : colorType === 0 ? 1 : colorType === 4 ? 2 : null;
    if (!channels) return { supported: false, reason: 'unsupported color type' };
    const compressed = Buffer.concat(chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data));
    if (!compressed.length) return { supported: false, reason: 'missing IDAT' };
    const data = zlib.inflateSync(compressed);
    const rows = decodeRows(data, width, height, channels, bitDepth);
    if (!rows) return { supported: false, reason: 'unsupported PNG encoding' };
    const histogram = new Uint32Array(256);
    let total = 0;
    let sum = 0;
    let dark = 0;
    let bright = 0;
    let minimum = 1;
    let maximum = 0;
    const stride = width * channels;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const at = y * stride + x * channels;
        const r = rows[at];
        const g = channels >= 3 ? rows[at + 1] : r;
        const b = channels >= 3 ? rows[at + 2] : r;
        const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const bucket = Math.max(0, Math.min(255, Math.round(luma * 255)));
        histogram[bucket] += 1;
        total += 1;
        sum += luma;
        if (luma < 0.02) dark += 1;
        if (luma > 0.95) bright += 1;
        if (luma < minimum) minimum = luma;
        if (luma > maximum) maximum = luma;
      }
    }
    if (!total) return { supported: false, reason: 'empty PNG' };
    let seen = 0;
    let p05 = 0;
    let p95 = 0;
    for (let i = 0; i < histogram.length; i += 1) {
      seen += histogram[i];
      if (!p05 && seen >= total * 0.05) p05 = i / 255;
      if (!p95 && seen >= total * 0.95) { p95 = i / 255; break; }
    }
    return {
      supported: true,
      width,
      height,
      mean: Number((sum / total).toFixed(6)),
      min: Number(minimum.toFixed(6)),
      max: Number(maximum.toFixed(6)),
      p05: Number(p05.toFixed(6)),
      p95: Number(p95.toFixed(6)),
      darkRatio: Number((dark / total).toFixed(6)),
      brightRatio: Number((bright / total).toFixed(6)),
    };
  } catch (error) {
    return { supported: false, reason: String(error.message) };
  }
}
