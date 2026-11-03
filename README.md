# Portfólio — Eric Oliveira

Dev full-stack e fundador da DumTech. HTML, CSS e JavaScript puros, sem build, com um canteiro 3D em three.js.

**Ao vivo:** https://eric1oliveira.github.io/portfolio/

## O conceito

Um canteiro de 1.600 blocos atrás da página. A cada seção os blocos se desmontam e se montam de baixo para cima
numa forma que usa um dado real do projeto:

| Seção | Forma |
| --- | --- |
| Início | cidade de pilares, com uma varredura laranja |
| DumTech Hub | 7 torres = 7 módulos, núcleo laranja = licença |
| Delivery | disco = área de entrega, pino = loja, rota laranja |
| CMV Pro | bloco de 1.400 = preço do prato; 319 laranja = custo (22,8%) |
| DUM OS | ilhas = empresas, prédios = projetos |
| AuditSync | 1.070 blocos = 1.070 termos, laranja = divergência, 4 colunas = 4 bases |
| Mais builds | 6 prédios; passar o mouse numa linha acende o dela |
| Testes | cubo que acende uma camada por verificação aprovada |
| Currículo | 3 degraus: formação, suporte N2, DumTech |
| Contato | terreno marcado e material separado |

No celular a página vira app: barra inferior, projetos num baralho que se arrasta com o dedo e ficha que sobe
de baixo e fecha arrastando ou pelo botão Voltar do celular. O canteiro inclina com o celular (no iPhone, depois de
tocar em "Mover o canteiro com o celular").

Com "reduzir movimento" ligado, nada se mexe e tudo aparece. Se o WebGL ou a CDN do three.js falharem, a página
funciona igual, com um fundo quadriculado no lugar do 3D.

## Arquivos

```
index.html            conteúdo: seções, projetos e as fichas (<template id="t-...">)
style.css             tokens de cor e tipo no topo, depois cada seção; celular no bloco @media (max-width: 820px)
main.js               interações: scroll, HUD, baralho, ficha, vistoria, formulário
world.js              o canteiro 3D: formas (FORMS), câmera de cada forma (SCENE) e shaders
assets/               prints (.webp), favicon e imagem de compartilhamento (og.jpg)
CVEricOliveira.pdf    currículo para download
```

- **Novo projeto em destaque:** copie um `<article class="proj">` e crie o `<template id="t-...">` (o botão usa
  `data-open="..."`). Para ele ter forma própria, crie a função em `FORMS` e a câmera em `SCENE` no `world.js` e
  aponte `data-form` para ela; o texto do rodapé vem de `data-caption`. Atualize os contadores "/05".
- **Novo projeto em "Mais builds":** copie um `<li>` da lista `.rows` e o `<template>` dele. O `data-group` é o
  prédio que acende (0–5); com mais de seis, aumente a lista `sizes` da forma `field`.
- **Nova verificação na vistoria:** copie um `<li>` do `.runner__list`; o resumo e o cubo se ajustam sozinhos.
- **Formulário:** envia para o Formspree (`formspree.io/f/manbpwyv`).

## Rodar localmente

```
python -m http.server 8000
```

e abra http://localhost:8000 (o 3D usa módulos ES, então não funciona abrindo o arquivo direto).

## Dependências externas

Google Fonts (Archivo e Martian Mono), [three.js](https://threejs.org) 0.170.0 pelo jsDelivr e
[Lenis](https://github.com/darkroomengineering/lenis) 1.3.4 para o scroll suave no computador.
