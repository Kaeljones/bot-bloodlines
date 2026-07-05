import { SlashCommandBuilder } from 'discord.js';
import * as painel from './registro/painel';
import * as consultar from './registro/consultar';
import * as remover from './registro/remover';
import * as atualizar from './registro/atualizar';
import * as reenviarPainel from './registro/reenviarPainel';
import { Command } from '../types';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('registro')
    .setDescription('Comandos de gerenciamento e realização de registro de personagens.')
    .addSubcommand((sub) =>
      sub
        .setName(painel.name)
        .setDescription(painel.description)
    )
    .addSubcommand((sub) =>
      sub
        .setName(consultar.name)
        .setDescription(consultar.description)
        .addUserOption((opt) =>
          opt
            .setName('usuario')
            .setDescription('O usuário para consultar (Administradores).')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName(remover.name)
        .setDescription(remover.description)
        .addUserOption((opt) =>
          opt
            .setName('usuario')
            .setDescription('O usuário cujo registro deve ser removido.')
            .setRequired(true)
        )
        .addBooleanOption((opt) =>
          opt
            .setName('remover_cargos')
            .setDescription('Se deve remover os cargos do usuário (padrão: true).')
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName('resetar_nickname')
            .setDescription('Se deve resetar o apelido do usuário (padrão: true).')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName(atualizar.name)
        .setDescription(atualizar.description)
    )
    .addSubcommand((sub) =>
      sub
        .setName(reenviarPainel.name)
        .setDescription(reenviarPainel.description)
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case painel.name:
        await painel.execute(interaction);
        break;
      case consultar.name:
        await consultar.execute(interaction);
        break;
      case remover.name:
        await remover.execute(interaction);
        break;
      case atualizar.name:
        await atualizar.execute(interaction);
        break;
      case reenviarPainel.name:
        await reenviarPainel.execute(interaction);
        break;
      default:
        break;
    }
  },
};
export default command;
