import { SlashCommandBuilder } from 'discord.js';
import * as registro from './config/registro';
import * as registroReset from './config/registroReset';
import { Command } from '../types';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Comandos de configuração administrativa do sistema de registro.')
    .addSubcommand((sub) =>
      sub
        .setName(registro.name)
        .setDescription(registro.description)
    )
    .addSubcommand((sub) =>
      sub
        .setName(registroReset.name)
        .setDescription(registroReset.description)
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case registro.name:
        await registro.execute(interaction);
        break;
      case registroReset.name:
        await registroReset.execute(interaction);
        break;
      default:
        break;
    }
  },
};
export default command;
