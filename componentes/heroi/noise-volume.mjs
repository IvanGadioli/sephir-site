// Derivado do exemplo `optimized-black-hole` da vgpu.
// Fonte: https://vgpu.sh/examples/optimized-black-hole
// Obtido pela skill `vgpu` v0.3.1 em 2026-09-24. Licença do projeto vgpu.

// Deterministic tiled value-noise lattice shared by the disk shader and Node rendering.
export const NOISE_VOLUME_SIZE = 64;

const FORMAT = "r8unorm";
const SEED = 13;
const fr = Math.fround;
/** @param {number} value @returns {number} */
const fract = (value) => fr(value - Math.floor(value));
const K0 = fr(0.1031);
const K1 = fr(0.103);
const K2 = fr(0.0973);
const K3 = fr(33.33);

/** @param {number} x @param {number} y @param {number} z */
function hash31(x, y, z) {
  let qx = fract(fr(x * K0));
  let qy = fract(fr(y * K1));
  let qz = fract(fr(z * K2));
  const d = fr(
    fr(fr(qx * fr(qy + K3)) + fr(qy * fr(qz + K3))) + fr(qz * fr(qx + K3))
  );
  qx = fr(qx + d);
  qy = fr(qy + d);
  qz = fr(qz + d);
  return fract(fr(fr(qx + qy) * qz));
}

/**
 * Use signed coordinates so the disk's angular axes match the original analytic noise.
 * @param {number} index @param {number} size @returns {number}
 */
function latticeCoord(index, size) {
  return index < size / 2 ? index : index - size;
}

/** @param {number} size @param {number} seed @returns {Uint8Array} */
function buildNoiseVolume(size, seed) {
  const data = new Uint8Array(size * size * size);
  const offset = seed * 1024;
  let cursor = 0;
  for (let z = 0; z < size; z++) {
    const pz = latticeCoord(z, size) + offset;
    for (let y = 0; y < size; y++) {
      const py = latticeCoord(y, size);
      for (let x = 0; x < size; x++) {
        data[cursor++] = Math.min(
          255,
          Math.round(hash31(latticeCoord(x, size), py, pz) * 255)
        );
      }
    }
  }
  return data;
}

/** @type {Map<string, Uint8Array>} */
const cache = new Map();

/** @param {number} size @param {number} seed @returns {Uint8Array} */
function noiseVolumeData(size, seed) {
  const key = `${size}:${seed}`;
  let data = cache.get(key);
  if (!data) {
    data = buildNoiseVolume(size, seed);
    cache.set(key, data);
  }
  return data;
}

/**
 * @param {import("vgpu").Gpu} gpu
 * @param {number} [size]
 * @param {string} [label]
 */
export function createNoiseVolume(
  gpu,
  size = NOISE_VOLUME_SIZE,
  label = "black-hole-noise"
) {
  // Divergência de API #3 (vgpu v0.3.1 → v0.5.0, achada na Tarefa 19): a forma antiga
  // discriminava o formato da textura por `dimension: "3d"`. A 0.5.0 usa `kind` em vez de
  // `dimension` — `TextureShape` em `@vgpu/core/dist/types.d.ts` não tem campo `dimension`
  // nenhum. Sem essa troca, `Device.createTexture` rejeita em runtime com
  // "Texture kind must be explicit" (só aparece rodando: este arquivo é `.mjs`, fora do
  // typecheck). O resto do objeto não muda — `size: [w, h, depth]` já é o formato que o
  // caso `"3d"` de `TextureShape` espera.
  const texture = gpu.device.createTexture({
    size: [size, size, size],
    kind: "3d",
    format: FORMAT,
    usage: ["texture_binding", "copy_dst"],
    label,
  });
  try {
    gpu.gpu.queue.writeTexture(
      { texture: texture.gpu },
      noiseVolumeData(size, SEED),
      { offset: 0, bytesPerRow: size, rowsPerImage: size },
      { width: size, height: size, depthOrArrayLayers: size }
    );
    return texture;
  } catch (error) {
    try {
      texture.destroy();
    } catch {
      // Preserve the upload failure that made this texture unusable.
    }
    throw error;
  }
}

/** @param {typeof import("vgpu")} vgpu @param {import("vgpu").Gpu} gpu */
export function noiseVolumeSampler(vgpu, gpu) {
  return vgpu.sampler(gpu, {
    addressModeU: "repeat",
    addressModeV: "repeat",
    addressModeW: "repeat",
    minFilter: "linear",
    magFilter: "linear",
  });
}
