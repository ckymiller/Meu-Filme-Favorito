# Meus Filmes

App pessoal pra organizar filmes em três listas: **Quero Ver**, **Já Vi** e **Desisti**.
Busca filmes em português via TMDB, salva tudo no próprio celular (sem login, sem servidor, sem nuvem).

## Como rodar

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou mais novo
- [Expo Go](https://expo.dev/go) instalado no seu celular (Android ou iOS)
- Uma chave de API do TMDB (gratuita)

### 2. Pegue uma chave do TMDB

1. Crie uma conta em <https://www.themoviedb.org/signup>
2. Vá em <https://www.themoviedb.org/settings/api>
3. Solicite uma chave para "Developer" (uso pessoal). É instantâneo.
4. Copie a chave da seção **API Key (v3 auth)**.

### 3. Configure e instale

```bash
git clone <url-do-seu-repo> meus-filmes
cd meus-filmes
cp .env.example .env
# Abra .env e cole sua chave TMDB em EXPO_PUBLIC_TMDB_API_KEY
npm install
```

### 4. Rode o app

```bash
npm run start
```

Vai abrir um QR code no terminal. Abra o **Expo Go** no celular e leia o QR code.

> Quer testar no navegador? Use `npm run web`.
> Quer rodar em emulador? Use `npm run ios` (Mac) ou `npm run android`.

## Como usar

- Toque no botão **+** pra buscar e adicionar um filme.
- Toque longo (ou no botão `⋮`) num filme pra mover entre listas ou remover.
- O ícone de grade no topo alterna entre lista e grade.
- Tudo é salvo localmente no seu celular. Trocar de celular = começar do zero.

## Sobre a chave da API

A chave do TMDB fica embutida no app gerado (variáveis `EXPO_PUBLIC_*` ficam visíveis no bundle).
Como esse app é pra **uso pessoal** e a chave é **gratuita e sem custo por uso**, isso não é problema.
Não publique builds desse app em loja pública sem mover a chave pra um proxy.

## Stack

- Expo SDK 54 + Expo Router
- React Native 0.81
- React Query (cache TMDB)
- AsyncStorage (persistência local)
- TypeScript

## Estrutura

```
app/
  (tabs)/            # 3 abas: Quero Ver / Já Vi / Desisti
  movie/[id].tsx     # Tela de detalhe do filme
  add.tsx            # Busca + adicionar manual
  settings.tsx       # Preferências e info
components/          # MovieRow, MovieGridCard, AddMovieSheet, etc
contexts/
  MoviesContext.tsx  # Estado global das listas (AsyncStorage)
lib/
  tmdb.ts            # Cliente TMDB (fetch direto da API v3)
  preferences.tsx    # Preferência de visualização (lista/grade)
```
