# Projeto de Gestão de Faturas - Homolog Solar

Este é um sistema de gerenciamento de faturas desenvolvido para administrar clientes, integradores e suas respectivas faturas de energia. A aplicação é construída com um frontend em React e um backend em PHP.

## Tecnologias Utilizadas

-   **Frontend:** React (com Vite), TypeScript, React Router
-   **Backend:** PHP
-   **Banco de Dados:** MySQL
-   **Estilização:** CSS puro

## Estrutura do Projeto

O projeto é dividido em duas partes principais dentro da pasta `faturas/`:

-   `api/`: Contém todo o backend em PHP, responsável pela lógica de negócio e comunicação com o banco de dados.
-   `gestao-fatura/`: Contém todo o frontend em React, responsável pela interface do usuário.

---

## ⚙️ Configuração de Ambiente

Para alternar entre os ambientes de **desenvolvimento (localhost)** e **produção (servidor online)**, você precisa ajustar as configurações do backend e do frontend.

### 1. Backend (API - PHP)

A configuração do backend é controlada por um único arquivo.

-   **Arquivo Chave:** `faturas/config.php`

Dentro deste arquivo, a constante `APP_ENV` determina qual ambiente será carregado:

-   **Para Desenvolvimento:**
    ```php
    define('APP_ENV', 'development');
    ```
    Isso fará com que o sistema carregue as credenciais do banco de dados do arquivo `faturas/config.dev.php`.

-   **Para Produção:**
    ```php
    define('APP_ENV', 'production');
    ```
    Isso fará com que o sistema carregue as credenciais do arquivo `faturas/config.prod.php`.

> **⚠️ Importante:** Os arquivos `config.dev.php` e `config.prod.php` contêm informações sensíveis (senhas de banco de dados) e **não devem ser versionados** no Git.

### 2. Frontend (React + Vite)

A configuração do frontend depende de dois fatores: a URL da API e o caminho base da aplicação.

#### URL da API

A URL que o React usa para se comunicar com o PHP é definida em arquivos de ambiente na pasta `faturas/gestao-fatura/`.

-   **Para Desenvolvimento:**
    -   Arquivo: `.env.development`
    -   Variável: `VITE_API_BASE_URL=http://localhost/faturas/api/`

-   **Para Produção:**
    -   Arquivo: `.env.production`
    -   Variável: `VITE_API_BASE_URL=https://seu-dominio.com/api/`

#### Caminho Base (Build de Produção)

Para que a aplicação funcione corretamente em um subdomínio ou subpasta no servidor de produção, o caminho base precisa ser configurado.

-   **Arquivo Chave:** `faturas/gestao-fatura/vite.config.ts`

-   **Para Desenvolvimento:** A propriedade `base` não é necessária ou pode ser comentada.
    ```typescript
    export default defineConfig({
      plugins: [react()],
      // base: '/' // Comentado ou removido
    })
    ```

-   **Para Produção (em um subdomínio):** A propriedade `base` deve ser `'/'`.
    ```typescript
    export default defineConfig({
      plugins: [react()],
      base: '/',
    })
    ```

---

## 🚀 Guia Rápido: Trocando de Ambiente

### Para voltar ao Ambiente de DESENVOLVIMENTO (Localhost):

1.  **Backend:** No arquivo `faturas/config.php`, defina:
    ```php
    define('APP_ENV', 'development');
    ```
2.  **Frontend:** No arquivo `faturas/gestao-fatura/vite.config.ts`, remova ou comente a linha `base`.
3.  **Router:** No arquivo `faturas/gestao-fatura/src/App.tsx`, certifique-se de que o componente `<Router>` não tenha a propriedade `basename`.
4.  **Servidor:** Inicie o servidor de desenvolvimento do React com `npm run dev` na pasta `faturas/gestao-fatura/`.

### Para preparar para o Ambiente de PRODUÇÃO (Deploy):

1.  **Backend:** No arquivo `faturas/config.php`, defina:
    ```php
    define('APP_ENV', 'production');
    ```
2.  **Frontend:** No arquivo `faturas/gestao-fatura/vite.config.ts`, configure a propriedade `base` de acordo com seu deploy (ex: `base: '/'` para um subdomínio).
3.  **Build:** Gere os arquivos de produção rodando `npm run build` na pasta `faturas/gestao-fatura/`.
4.  **Deploy:** Siga os passos de estruturação de arquivos e deploy conforme orientado para a sua hospedagem.