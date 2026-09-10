// Declaração ambiente para import de efeito colateral de CSS (`import '...css'`
// nos root layouts). `tsconfig.json` (Tarefa 2, commit 18c0a6b) passou a
// alcançar só `app/` e `lib/`, o que deixa `next-env.d.ts` — e a declaração
// `declare module '*.css' {}` que ele puxa via `next/types/global.d.ts` — fora
// do programa de tipo do build. Este arquivo é o mínimo para o import
// compilar sem desligar `typescript.ignoreBuildErrors`.
declare module '*.css';
