import { ChatInputCommandInteraction, MessageFlags, TextChannel } from 'discord.js';
import { ConfigService } from '../../modules/config/config.service';
import { buildRegistrationPanel } from '../../modules/registration/registration.components';
import { hasAdminPermission } from '../../utils/permissions';
import { logger } from '../../utils/logger';

export const name = 'reenviar-painel';
export const description = 'Reenvia o painel de registro no canal configurado.';

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;

  // 1. Verify permissions
  if (!hasAdminPermission(interaction.member as any)) {
    return interaction.reply({
      content: '❌ Você não tem permissão para usar este comando (requer Administrador ou Gerenciar Servidor).',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const configService = new ConfigService();
  const config = await configService.getOrCreateGuildConfig(interaction.guildId!);

  if (!config.registrationPanelChannelId) {
    return interaction.editReply({
      content: '❌ O canal do painel de registro não está configurado. Use `/config registro` para configurar.',
    });
  }

  try {
    const channel = interaction.guild.channels.cache.get(config.registrationPanelChannelId) as TextChannel;
    if (!channel || !channel.isTextBased()) {
      return interaction.editReply({
        content: '❌ O canal configurado para o painel de registro não foi encontrado ou não é um canal de texto.',
      });
    }

    // Attempt to delete old message if exists
    if (config.registrationPanelMessageId) {
      await channel.messages.delete(config.registrationPanelMessageId).catch(() => {
        logger.info(`Old panel message ${config.registrationPanelMessageId} not found or couldn't be deleted.`);
      });
    }

    // Build and send the new panel
    const panelContent = buildRegistrationPanel();
    const newPanelMessage = await channel.send({
      components: [panelContent],
      flags: [MessageFlags.IsComponentsV2],
    });

    // Update panel message ID in database
    await configService.setPanelChannel(interaction.guildId!, channel.id, newPanelMessage.id);

    return interaction.editReply({
      content: `✅ Painel de registro reenviado com sucesso no canal <#${channel.id}>!`,
    });
  } catch (err: any) {
    logger.error('Failed to resend registration panel', err);
    return interaction.editReply({
      content: `❌ Ocorreu um erro ao reenviar o painel: ${err.message || err}`,
    });
  }
}
