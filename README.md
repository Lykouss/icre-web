# ICRE Web

Este é um projeto desenvolvido em [Next.js](https://nextjs.org/) utilizando Tailwind CSS, Supabase e integração com o gateway de pagamento Asaas.

---

## 🚀 Como Começar (Setup Local)

Siga os passos abaixo para rodar o projeto na sua máquina:

### 1. Pré-requisitos
Certifique-se de ter o **Node.js** (versão 18+ recomendada) e o **npm** instalados.

### 2. Instalação das Dependências
Clone o repositório e, no diretório raiz do projeto, instale as dependências:
```bash
npm install
```

### 3. Configuração das Variáveis de Ambiente
O projeto necessita de chaves de API e configurações específicas para funcionar. 

1. Duplique o arquivo `.env.example` e renomeie-o para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Abra o arquivo `.env.local` e preencha as variáveis de ambiente com os dados de desenvolvimento/sandbox fornecidos.
   > **Nota:** Nunca comite o arquivo `.env.local` para o repositório (ele já está configurado no `.gitignore`).

### 4. Executando o Servidor de Desenvolvimento
Inicie o servidor local:
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para visualizar o resultado.

---

## 🛠️ Diretrizes de Contribuição (Git & Branches)

Para manter o código organizado e seguro, siga o fluxo de trabalho abaixo:

1. **Nunca envie commits diretamente para a branch `main`.**
2. Crie uma nova branch a partir da `main` para as suas alterações:
   ```bash
   git checkout -b feature/suas-alteracoes-frontend
   ```
3. Realize as alterações no frontend e faça os commits com mensagens claras.
4. Envie sua branch para o repositório remoto:
   ```bash
   git push origin feature/suas-alteracoes-frontend
   ```
5. Abra um **Pull Request (PR)** no GitHub apontando da sua branch para a `main`.
6. Aguarde a revisão de código antes de realizar o merge.

---

## 📦 Estrutura de Pastas Principal

* `src/components/ui/` - Componentes reutilizáveis de interface (Shadcn UI).
* `src/features/` - Funcionalidades organizadas por módulos (Portal, Core, etc.).
* `public/` - Arquivos estáticos (imagens, ícones).
