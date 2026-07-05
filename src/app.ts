import { prisma } from './database/prisma';
import { RegistrationBotClient } from './client';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    logger.info('Conectando ao banco de dados MySQL...');
    // Execute a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');

    // Initialize Bot Client
    const client = new RegistrationBotClient();

    // Deploy Slash Commands to Discord API
    await client.deployCommands();

    // Log in to Discord
    logger.info('Iniciando bot no Discord...');
    await client.login(env.DISCORD_TOKEN);
  } catch (err: any) {
    logger.error('Falha crítica durante a inicialização do bot:', err);
    process.exit(1);
  }
}

bootstrap();
