
# Twitch Chat Overlay

Overlay leve para chat da Twitch, perfeito para streamers com apenas um monitor.

## Sobre o projeto

Este aplicativo permite abrir o chat da Twitch em uma janela flutuante, transparente e sempre no topo, facilitando a leitura do chat durante a live sem precisar alternar de janela. Ideal para quem tem apenas um monitor!

## Principais recursos

- **Transparência ajustável**
- **Sempre no topo** (opcional)
- **Modo click-through** (permitir cliques atravessarem a janela)
- **Tema escuro/claro do chat**
- **Histórico de canais recentes**
- **Reset de tamanho da janela**
- **Limpeza de elementos desnecessários do chat**

## Instalação

1. Baixe o instalador mais recente na seção [Releases](https://github.com/seu-usuario/seu-repo/releases) (arquivo `.msi` ou `.exe`).
2. Execute o instalador e siga as instruções.
3. Abra o aplicativo pelo menu iniciar.

> **Requisitos:**
> - Windows 10 ou superior
> - Não requer login na Twitch

## Como usar

1. Digite o nome do canal da Twitch que deseja acompanhar.
2. Clique em **Abrir Chat**.
3. Ajuste as configurações de transparência, tema, click-through e sempre no topo conforme sua preferência.
4. Para voltar ao menu, clique em **Voltar**.

## Desenvolvimento

Este projeto utiliza [Tauri 2](https://tauri.app/) com HTML, CSS e JavaScript puro.

### Rodando localmente

```bash
npm install
npx tauri dev
```

### Build para produção

```bash
npx tauri build
```

## Créditos

- Desenvolvido por Lucas
- Ícones: Twitch, Tauri, JavaScript

---

## Ambiente de desenvolvimento recomendado

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
