# public/marca/logo.webp — procedência

Derivado de `Logo_SephirStudio_v1.png` (1672 × 941, 891 719 B), em
`~/Documents/sephir/sephir-brand/00-identidade/logo/`, que é o arquivo oficial
enviado à FAPDF em 03/09/2026.

Comando (com flatten sobre `--cor-void`):

    magick Logo_SephirStudio_v1.png \
      -background '#05070E' -flatten -alpha off \
      -resize 520x -quality 88 -strip \
      public/marca/logo.webp

520 px de largura serve o rodapé a 150 px e o 404 a 260 px em telas 2×.

## Por que achatado e sem alfa

A marca foi desenhada com halo suave em alfa, caro de codificar. Medições mostraram que o canal alfa
ocupava ~25 kB dos 33 kB do arquivo com alfa, e a marca **já** se restringe a fundo escuro (§3 do
LEIA-ME da pasta de marca). Assar o preto (#05070E) é exatamente o que o design do halo pretende:
o gradiente se dissolve no preto da página. O arquivo agora é **opaco**, técnica e esteticamente —
a restrição a fundo escuro deixou de ser recomendação e passou a ser propriedade do arquivo.

A qualidade subiu de 70 para 88, e o tamanho caiu de 33.5 kB para 8.3 kB.

**Aviso:** este arquivo é exclusivo de fundo escuro. Usá-lo sobre fundo claro produzirá resíduo
visível de preto no canvas. A versão para fundo claro precisa ser gerada — não basta inverter.
