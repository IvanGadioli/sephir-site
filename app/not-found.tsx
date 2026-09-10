// Achado fora dos dois fatos medidos no portão 04 (ver relatório da Tarefa 2):
// sem ISTO, o Next embute o seu fallback padrão em inglês
// ("This page could not be found.") no payload RSC de TODAS as páginas —
// index.html, pt/index.html e nao-encontrado/index.html — não só na que ele
// mesmo gera. É dado inerte (só usado por notFound() em navegação
// client-side, que este site estático nunca dispara), mas ainda assim texto
// cru no HTML, e a Tarefa 2 reprova nisso.
//
// Este arquivo não é nenhum dos dois padrões descartados no plano: não tem
// <html> próprio (não aninha), e não fica dentro de um grupo (não vira
// 404.html — quem vira é (casca)/nao-encontrado/, via poda). É um componente
// simples na raiz de app/, sem app/layout.tsx ao lado — e por isso nunca
// produz um documento próprio que sobreviva à poda: gera out/_not-found/,
// que ferramentas/podar.mjs remove como sempre removeu.
export default function NaoEncontradoPadrao() {
  return null;
}
