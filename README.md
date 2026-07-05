# Discord Registration Bot

Este é um bot profissional de registro para Discord desenvolvido com as tecnologias mais recentes, utilizando exclusivamente a nova especificação de **Components V2** (Containers, Sections, Separators, etc.) da API do Discord e **Discord.js v14**.

O sistema é multi-servidor (cada servidor tem sua própria configuração) e possui persistência em banco de dados **MySQL** usando **Prisma ORM**.

---

## 🛠️ Tecnologias Utilizadas

*   **Node.js 22+**
*   **TypeScript**
*   **Discord.js v14 (latest)**
*   **Discord API Components V2**
*   **Prisma ORM**
*   **MySQL**
*   **Zod** (Validação de schemas)
*   **Docker & Docker Compose**
*   **PM2** (Gerenciamento de processos)

---

## 📂 Estrutura do Projeto

O bot foi desenvolvido seguindo uma arquitetura modular e limpa:

```text
src/
  ├── app.ts                  # Ponto de entrada (Bootstrap)
  ├── client.ts               # Inicializador do Client do Discord
  ├── types/                  # Definições globais de tipos
  ├── config/                 # Validadores e leitores de variáveis (.env)
  ├── database/               # Instância do cliente do Prisma
  ├── utils/                  # Funções utilitárias (Data, Permissões, Sanitização, Logs)
  ├── events/                 # Eventos do Discord (ready, interactionCreate)
  ├── commands/               # Comandos (/registro, /config)
  ├── interactions/           # Handlers de botões, modais e seletores
  └── modules/                # Regras de negócio e repositórios (registro, config)
```

---

## 🚀 Instalação e Execução

### Pré-requisitos
*   Node.js v22 ou superior instalado.
*   Instância do MySQL ativa (ou Docker para rodar via container).

### 1. Clonar o Repositório e Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente (.env)

Copie o arquivo `.env.example` para `.env`:

```bash
copy .env.example .env
```

Preencha as variáveis de ambiente com suas credenciais:

```env
DISCORD_TOKEN=seu_token_de_bot_aqui
DISCORD_CLIENT_ID=seu_client_id_do_aplicativo_aqui

# Opcional: ID de um servidor de testes para atualização imediata dos comandos.
# Se vazio, os comandos serão registrados globalmente (leva até 1 hora).
DEVELOPMENT_GUILD_ID=123456789012345678

# URL de conexão do MySQL
DATABASE_URL="mysql://root:rootpassword@localhost:3306/bloodlines_db"
```

### 3. Rodar Migrations do Banco de Dados

Crie as tabelas necessárias no banco MySQL executando o Prisma:

```bash
npx prisma db push
```
ou, para criar e aplicar migrations formais de desenvolvimento:
```bash
npx prisma migrate dev --name init
```

### 4. Compilar e Iniciar o Bot

#### Modo de Desenvolvimento (Hot Reload)
```bash
npm run dev
```

#### Modo de Produção (Compilar e Iniciar)
```bash
npm run build
npm start
```

---

## 🐳 Executando com Docker

Você pode subir toda a estrutura (MySQL + Bot) utilizando apenas o Docker:

1.  Certifique-se de preencher o arquivo `.env` com seu `DISCORD_TOKEN` e `DISCORD_CLIENT_ID`.
2.  Inicie os containers:

```bash
docker-compose up -d --build
```

O compose inicializará o banco MySQL 8.0, aguardará o container estar saudável e iniciará o bot automaticamente.

---

## ⚙️ Executando com PM2

Se preferir rodar em produção de forma nativa e monitorar com PM2, utilize o arquivo de configuração fornecido:

```bash
# Compila o projeto
npm run build

# Inicia o processo com o PM2
pm2 start ecosystem.config.js

# Salva a lista de processos para inicialização no boot
pm2 save
```

---

## 📖 Como Usar o Bot

### Configuração do Servidor

Apenas administradores ou membros com a permissão **Gerenciar Servidor (ManageGuild)** podem configurar o bot.

1.  Execute `/config registro` no servidor para abrir o painel administrativo V2.
2.  **Definir Canal de Logs (📜):** Clique no botão e selecione o canal onde deseja que todos os logs de registro e erros sejam documentados.
3.  **Definir Canal do Painel (📌):** Selecione o canal onde o painel público de registro será enviado. O bot enviará o painel lá automaticamente após a seleção.
4.  **Adicionar Cargos (➕):** Clique no botão, selecione o cargo desejado. O cargo será adicionado na lista e será aplicado ao usuário no momento em que ele se registrar. Você pode adicionar quantos cargos desejar.
5.  **Remover Cargos (➖):** Selecione o cargo que deseja remover da lista automática de registro.

### Fluxo de Registro do Usuário

1.  O usuário entra no canal público configurado e vê o **Painel de Registro** (Container V2 com o botão `📝 Registrar`).
2.  Ao clicar no botão, um **Modal de Registro** é aberto.
3.  O usuário preenche:
    *   **Nome do Personagem** (Mínimo de 3 e máximo de 32 caracteres)
    *   **ID do Personagem** (Apenas números, máximo de 10 caracteres)
4.  O bot realiza as validações (verificando se o ID já existe ou se o usuário já possui registro).
5.  Se tudo for válido, o bot:
    *   Salva o registro no banco de dados.
    *   Altera o nickname do usuário para: `#ID Nome do Personagem` (ex: `#4085 Kael Drakhar`).
    *   Aplica todos os cargos configurados para registro.
    *   Responde de forma privada (**ephemeral**) confirmando o sucesso.
    *   Envia um log detalhado no canal de logs configurado.

### Comandos Adicionais

*   `/registro atualizar`: Permite que um usuário atualize seus dados de Nome e ID. O bot alterará o nickname e atualizará os dados no banco e no log de auditoria.
*   `/registro consultar [usuario]`: Permite consultar as informações de registro (Nome, ID, cargos aplicados, data) de si mesmo ou de outro usuário (apenas administradores).
*   `/registro remover <usuario> [remover_cargos] [resetar_nickname]`: Comando administrativo para deletar um registro do banco de dados, com a opção de reverter o nickname e remover os cargos de registro aplicados ao usuário.
*   `/registro reenviar-painel`: Reenvia o painel de registro no canal configurado caso ele tenha sido apagado.
*   `/config registro-reset`: Reseta todas as configurações do bot no servidor (cargos automáticos e canais), porém preservando as contas já registradas dos usuários.

---

## ⚠️ Resolução de Problemas de Permissão

Caso o bot não consiga aplicar cargos ou alterar nicknames dos usuários, verifique os seguintes pontos no Discord:

1.  **Hierarquia do Cargo do Bot:** No menu de configurações de cargos do seu servidor, o cargo criado para o bot (geralmente com o mesmo nome do bot) deve estar posicionado **acima** de todos os cargos que ele precisa atribuir aos membros (ex: `@Membro`, `@Registrado`).
2.  **Permissões Gerais:** Certifique-se de que o bot possui as seguintes permissões ativadas em seu cargo:
    *   `Gerenciar Apelidos` (Manage Nicknames)
    *   `Gerenciar Cargos` (Manage Roles)
3.  **Nicknames de Donos de Servidor (Owner):** A API do Discord não permite que nenhum bot altere o apelido do dono do servidor (dono da coroa). Se você estiver testando com a conta proprietária do servidor, o bot registrará os dados e adicionará os cargos com sucesso, mas gerará um log de erro avisando que não pôde alterar o apelido devido a restrições do Discord.
