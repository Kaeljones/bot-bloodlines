import { Client, ActivityType } from 'discord.js';
import { logger } from '../utils/logger';

export const name = 'ready';
export const once = true;

export function execute(client: Client) {
  logger.info(`🤖 Bot conectado com sucesso como ${client.user?.tag}!`);
  
  client.user?.setActivity('Registros', {
    type: ActivityType.Watching,
  });
}
export default execute;
