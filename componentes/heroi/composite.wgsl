// Derivado do exemplo `optimized-black-hole` da vgpu.
// Fonte: https://vgpu.sh/examples/optimized-black-hole
// Obtido pela skill `vgpu` v0.3.1 em 2026-09-24. Licença do projeto vgpu.
//
// Alteração de valor deliberada (Tarefa 19, decisão do titular): o upstream traz
// `const SATURATION: f32 = 0.0`, aqui é `1.0`. Com 0.0, `mix(vec3f(luma), color,
// SATURATION)` descarta inteiro o gradiente térmico do disco calculado logo acima
// em `tonemap()` — e esse gradiente (`#FF8F2B` no calor médio, `#FFF0D4` no calor
// alto) bate quase exatamente com `--cor-amber` (`#E8963A`) e `--cor-stardust`
// (`#F4EFE6`) da marca. O shader já computava a paleta do projeto; a constante em
// 0.0 é que jogava essa cor fora, saindo em cinza puro. É a única alteração de
// valor (não só de forma de API) em código de terceiro nesta rodada.

// Combine bloom levels, tone map, vignette, and convert to display output.

struct Composite {
  params: vec4f,
}

@group(0) @binding(0) var<uniform> composite: Composite;
@group(0) @binding(1) var scene: texture_2d<f32>;
@group(0) @binding(2) var bloomNear: texture_2d<f32>;
@group(0) @binding(3) var bloomMedium: texture_2d<f32>;
@group(0) @binding(4) var bloomFar: texture_2d<f32>;
@group(0) @binding(5) var linearSampler: sampler;

const EXPOSURE: f32 = 1.15;
const SATURATION: f32 = 1.0;

fn aces(x: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((x * (a * x + vec3f(b))) / (x * (c * x + vec3f(d)) + vec3f(e)), vec3f(0.0), vec3f(1.0));
}

fn tonemap(linearColor: vec3f, uv: vec2f) -> vec3f {
  var color = aces(linearColor * EXPOSURE);

  let centered = uv - vec2f(0.5);
  let vignette = 1.0 - smoothstep(0.55, 1.15, length(centered) * 1.6);
  color *= mix(0.72, 1.0, vignette);

  color = pow(color, vec3f(1.0 / 2.2));
  let luma = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  return mix(vec3f(luma), color, SATURATION);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let sceneColor = textureSample(scene, linearSampler, uv).rgb;
  let bloom =
    textureSample(bloomNear, linearSampler, uv).rgb * 0.50 +
    textureSample(bloomMedium, linearSampler, uv).rgb * 0.32 +
    textureSample(bloomFar, linearSampler, uv).rgb * 0.18;
  let hdr = sceneColor + bloom * composite.params.x;
  return vec4f(tonemap(hdr, uv), 1.0);
}
