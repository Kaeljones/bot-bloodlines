import { Client, ActivityType } from 'discord.js';
import { logger } from '../utils/logger';

export const name = 'clientReady';
export const once = true;

export function execute(client: Client) {
  logger.info(`🤖 Bot conectado com sucesso como ${client.user?.tag}!`);
  
  client.user?.setPresence({
    activities: [{
      name: 'custom',
      type: ActivityType.Custom,
      state: 'Gerenciando registros...',
    }],
    status: 'online',
  });
}
export default execute;
