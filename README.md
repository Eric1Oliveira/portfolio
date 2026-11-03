# Portfólio — Eric Oliveira

Dev full-stack e fundador da DumTech. Portfólio em HTML, CSS e JavaScript puros, sem build.

**Ao vivo:** https://eric1oliveira.github.io/portfolio/

## O que tem na página

- **Abertura** — o nome é iluminado por um "holofote" que segue o mouse (fonte variável Anybody).
- **Sobre** — manifesto que acende palavra por palavra com o scroll.
- **Projetos em destaque** — rolo horizontal no desktop (lista vertical no celular), com ficha de cada projeto.
- **Arquivo** — os demais projetos em linhas que abrem.
- **Trajetória**, **Ficha técnica** (stack em formato de créditos de filme) e **Contato** com formulário.

Tema claro/escuro, scroll suave, cursor próprio e linha do tempo de navegação. Com "reduzir movimento" ligado
no sistema, as animações saem e o rolo vira lista; sem JavaScript, todo o conteúdo continua visível.

## Arquivos

```
index.html            conteúdo (projetos, fichas em <template>, textos)
style.css             tokens de cor e tipo no topo, depois cada seção
main.js               interações
assets/               prints dos projetos (.webp), favicon e imagem de compartilhamento (og.jpg)
CVEricOliveira.pdf    currículo para download
```

- **Novo projeto em destaque:** copie um `<article class="shot">` no `index.html` e crie o `<template id="case-...">`
  correspondente (o botão usa `data-open="..."`). Atualize o "/ 05" do contador.
- **Novo projeto no arquivo:** copie um `<details class="row">`.
- **Formulário:** envia para o Formspree (`formspree.io/f/manbpwyv`).

## Rodar localmente

```
python -m http.server 8000
```

e abra http://localhost:8000.

## Dependências externas

Google Fonts (Anybody, Instrument Sans, Fragment Mono) e [Lenis](https://github.com/darkroomengineering/lenis) 1.3.4
para o scroll suave. Se o Lenis não carregar, a página usa o scroll normal do navegador.
