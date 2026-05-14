# Meus Filmes

App web pessoal pra organizar filmes em três listas: **Quero Ver**, **Já Vi** e **Desisti**.  
Funciona direto no navegador — sem conta, sem login, sem servidor. Pode ser publicado gratuitamente no **GitHub Pages**.

## ✨ Funcionalidades

- Busca de filmes em português via TMDB
- Três listas: Quero Ver / Já Vi / Desisti
- Visualização em lista ou grade
- Sinopse e informações de cada filme
- Dados salvos no seu navegador (localStorage)
- Tema escuro/claro automático
- Funciona no celular e no computador

---

## 🚀 Publicar no GitHub Pages (recomendado)

### 1. Fork / clone este repositório

```bash
git clone https://github.com/SEU_USUARIO/meus-filmes.git
cd meus-filmes
```

### 2. Pegue uma chave do TMDB (gratuita)

1. Crie uma conta em <https://www.themoviedb.org/signup>
2. Vá em <https://www.themoviedb.org/settings/api>
3. Solicite uma chave "Developer" (aprovação instantânea)
4. Copie a **API Key (v3 auth)**

### 3. Configure o GitHub Secret

No seu repositório do GitHub:

1. Vá em **Settings → Secrets and variables → Actions**
2. Clique em **New repository secret**
3. Nome: `VITE_TMDB_API_KEY`
4. Valor: sua chave do TMDB
5. Salve

### 4. Ative o GitHub Pages

1. Vá em **Settings → Pages**
2. Source: **GitHub Actions**
3. Salve

### 5. Faça um push para `main`

```bash
git push origin main
```

O GitHub Actions vai fazer o build e publicar automaticamente.  
O site fica disponível em: `https://SEU_USUARIO.github.io/meus-filmes/`

---

## 💻 Rodar localmente (para desenvolver)

```bash
# Pré-requisito: Node.js 20+

npm install
cp .env.example .env
# Abra .env e cole sua chave TMDB em VITE_TMDB_API_KEY

npm run dev
```

Abra <http://localhost:5173> no navegador.

---

## 📁 Estrutura

```
src/
  components/     # MovieRow, MovieGridCard, Layout, etc
  contexts/       # MoviesContext (lista), PreferencesContext (view mode)
  lib/
    tmdb.ts       # Cliente TMDB com React Query
    storage.ts    # localStorage helpers
  pages/          # HomePage, AddPage, MovieDetailPage, SettingsPage
  App.tsx         # Rotas (HashRouter)
  main.tsx        # Entry point
  styles.css      # Design tokens + estilos globais
.github/
  workflows/
    deploy.yml    # GitHub Actions: build + deploy automático
```

---

## Sobre a chave da API

A chave do TMDB fica embutida no bundle estático — não há como esconder em um site sem servidor.  
A chave do TMDB é gratuita e sem custo por uso, então isso é aceitável para uso pessoal.  
Se quiser protegê-la, considere usar um proxy serverless (Cloudflare Workers, Vercel Edge, etc).

---

## Stack

- React 19 + TypeScript
- Vite 6 (build)
- TanStack Query v5 (cache TMDB)
- React Router v7 (HashRouter)
- localStorage (persistência local)
- GitHub Actions (CI/CD)
- GitHub Pages (hospedagem)
