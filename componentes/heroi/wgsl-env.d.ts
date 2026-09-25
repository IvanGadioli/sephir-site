// A vgpu 0.5.0 não exporta `@vgpu/wgsl/types` (o caminho que o brief da
// Tarefa 18 citava, herdado do exemplo v0.3.1). O `exports` map do pacote
// instalado só declara `@vgpu/wgsl/wgsl-types` — confirmado com
// `npx vgpu docs cat nextjs` e por leitura direta de
// `node_modules/@vgpu/wgsl/package.json`. Divergência de API #1, registrada
// no report da Tarefa 18 para a Tarefa 19.
/// <reference types="@vgpu/wgsl/wgsl-types" />
