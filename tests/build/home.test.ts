import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

let html = '';

describe('a home em /pt/', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    html = readFileSync('out/pt/index.html', 'utf8');
  }, 300_000);

  it('estampa o produto como h1, nunca a empresa nem a fase', () => {
    expect(html).toMatch(/<h1[^>]*>Iniciativa Sephir<\/h1>/);
    expect(html).not.toMatch(/<h1[^>]*>Sephir Studio</);
    expect(html).not.toMatch(/<h1[^>]*>Semente Cósmica</);
  });

  it('traz o selo de fase como selo, não como título', () => {
    expect(html).toContain('fase Semente Cósmica · rumo à 1.0');
  });

  it('traz a ficha técnica do herói', () => {
    expect(html).toContain('Unreal Engine 5');
    expect(html).toContain('cônicas emendadas');
  });

  it('carrega o pôster como imagem do herói', () => {
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"/);
  });

  it('tem as três seções numeradas, com a âncora que o menu usa', () => {
    expect(html).toContain('id="o-que-e"');
    expect(html).toContain('Estado atual');
    expect(html).toContain('Como é feito');
  });

  it('lista os sete itens do estado atual', () => {
    // Ancorado em `class="..."` (a marcação real do DOM), não na substring
    // nua: o Next App Router embute uma segunda cópia de cada `className`
    // como JSON de hidratação (`\"className\":\"...\"`) num <script> no fim
    // da página, e a busca nua contaria as duas. Ver task-10-report.md.
    const existe = html.match(/class="[^"]*linha__rotulo--existe[^"]*"/g) ?? [];
    const construcao = html.match(/class="[^"]*linha__rotulo--construcao[^"]*"/g) ?? [];
    const ausente = html.match(/class="[^"]*linha__rotulo--ausente[^"]*"/g) ?? [];
    expect(existe).toHaveLength(3);
    expect(construcao).toHaveLength(1);
    expect(ausente).toHaveLength(3);
  });

  it('desenha a grade dos oito portões, com quatro cumpridos', () => {
    // Mesma razão do teste acima: ancora em `class="..."` para não contar a
    // cópia em JSON de hidratação.
    const cumpridos = html.match(/class="[^"]*portao--cumprido[^"]*"/g) ?? [];
    expect(cumpridos).toHaveLength(4);
  });

  it('fecha com o rodapé e o CNPJ', () => {
    expect(html).toContain('CNPJ 63.037.641/0001-30');
  });

  it('não carrega fonte de CDN de terceiro', () => {
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });
});
