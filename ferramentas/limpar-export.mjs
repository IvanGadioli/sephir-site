import { rmSync } from 'node:fs';

// As duas remoções abaixo têm UM critério só: **rota duplicada**. Nenhuma delas
// é sobre peso.
//
// Isto começou dizendo "peso morto", e a revisão final (I6) pegou a incoerência:
// este arquivo removia `out/404/` com a justificativa escrita "peso morto… nada
// linka para /404/" — um HTML de 2,3 kB — e deixava intactos 184 kB de payload
// RSC em `.txt`, metade disso duplicata byte a byte. Duas decisões sobre a mesma
// pergunta, com dois critérios, em quinze linhas. O critério de peso era o
// errado dos dois: os `.txt` são payload legítimo do roteador cliente e ficam,
// e estes dois diretórios sairiam mesmo se pesassem zero.
//
// O que os une é serem endereços que o host jamais consulta:

// `_not-found/` é a rota que o Next emite ao lado do `404.html` que o host
// serve de fato. Nenhum link aponta para ela e o Cloudflare Pages nunca a
// consulta — é o mesmo documento por um segundo endereço.
rmSync(new URL('../out/_not-found', import.meta.url), { recursive: true, force: true });

// `trailingSlash: true` duplica a rota /404 como diretório (out/404/index.html),
// idêntico byte a byte ao out/404.html que o host consulta. Nada linka para
// /404/, e a cópia quebraria a comparação estrita de HTML_ESPERADOS
// (lib/rotas.ts) que a Tarefa 16 faz contra a árvore de out/.
rmSync(new URL('../out/404', import.meta.url), { recursive: true, force: true });

console.log('export limpo: _not-found e 404/ removidos (rotas duplicadas, não peso)');
