import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { env } from './config/env';
import { Command } from './types';
import registroCommand from './commands/registro';
import configCommand from './commands/config';
import * as readyEvent from './events/ready';
import * as interactionCreateEvent from './events/interactionCreate';
import { logger } from './utils/logger';

export class RegistrationBotClient extends Client {
  public commands = new Collection<string, Command>();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.registerCommands();
    this.registerEvents();
  }

  /**
   * Registers bot slash commands in a Collection.
   */
  private registerCommands() {
    this.commands.set(registroCommand.data.name, registroCommand);
    this.commands.set(configCommand.data.name, configCommand);
    logger.info('Registered slash commands in client instance.');
  }

  /**
   * Registers bot event listeners.
   */
  private registerEvents() {
    this.once(readyEvent.name, (...args) => readyEvent.execute(...args));
    this.on(interactionCreateEvent.name, (...args) => interactionCreateEvent.execute(...args));
    logger.info('Registered event listeners.');
  }

  /**
   * Deploys slash commands to Discord API.
   * If DEVELOPMENT_GUILD_ID is provided, deploys commands instantly to that guild.
   * Otherwise, deploys them globally.
   */
  public async deployCommands() {
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
    const commandsJson = Array.from(this.commands.values()).map(c => c.data.toJSON());

    try {
      logger.info('Iniciando deploy de comandos (/) no Discord...');
      
      if (env.DEVELOPMENT_GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DEVELOPMENT_GUILD_ID),
          { body: commandsJson }
        );
        logger.info(`Comandos registrados com sucesso para o servidor de desenvolvimento: ${env.DEVELOPMENT_GUILD_ID}`);
      } else {
        await rest.put(
          Routes.applicationCommands(env.DISCORD_CLIENT_ID),
          { body: commandsJson }
        );
        logger.info('Comandos registrados globalmente com sucesso!');
      }
    } catch (err: any) {
      logger.error('Erro ao realizar deploy dos comandos no Discord:', err);
    }
  }
}
