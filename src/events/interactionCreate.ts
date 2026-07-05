import { Interaction } from 'discord.js';
import { execute as executeRegistrationStart } from '../interactions/buttons/registrationStart';
import { execute as executeConfigButtons } from '../interactions/buttons/configButtons';
import { execute as executeRegistrationModal } from '../interactions/modals/registrationModal';
import { execute as executeChannelSelect } from '../interactions/selects/channelSelect';
import { execute as executeRoleSelect } from '../interactions/selects/roleSelect';
import { logger } from '../utils/logger';

export const name = 'interactionCreate';

export async function execute(interaction: Interaction) {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const client = interaction.client as any;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Command ${interaction.commandName} not found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err: any) {
      logger.error(`Error executing command ${interaction.commandName}:`, err);
      const errorMessage = {
        content: '❌ Ocorreu um erro interno ao processar este comando.',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
    return;
  }

  // 2. Handle Buttons
  if (interaction.isButton()) {
    const customId = interaction.customId;

    try {
      if (customId === 'registration:start') {
        await executeRegistrationStart(interaction);
      } else if (customId.startsWith('config:')) {
        await executeConfigButtons(interaction);
      }
    } catch (err: any) {
      logger.error(`Error handling button ${customId}:`, err);
      const errMsg = '❌ Ocorreu um erro ao processar esta ação.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errMsg, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: errMsg, ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // 3. Handle Modal Submissions
  if (interaction.isModalSubmit()) {
    const customId = interaction.customId;

    try {
      if (customId.startsWith('registration:modal')) {
        await executeRegistrationModal(interaction);
      }
    } catch (err: any) {
      logger.error(`Error handling modal ${customId}:`, err);
      const errMsg = '❌ Ocorreu um erro ao salvar o formulário.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errMsg, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: errMsg, ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // 4. Handle Select Menus
  if (interaction.isChannelSelectMenu()) {
    const customId = interaction.customId;
    try {
      if (customId.startsWith('config:select_')) {
        await executeChannelSelect(interaction);
      }
    } catch (err: any) {
      logger.error(`Error handling channel select ${customId}:`, err);
    }
    return;
  }

  if (interaction.isRoleSelectMenu() || interaction.isStringSelectMenu()) {
    const customId = interaction.customId;
    try {
      if (customId.startsWith('config:select_')) {
        await executeRoleSelect(interaction as any);
      }
    } catch (err: any) {
      logger.error(`Error handling role or string select ${customId}:`, err);
    }
    return;
  }
}
export default execute;
