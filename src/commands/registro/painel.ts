import { ChatInputCommandInteraction, MessageFlags, TextChannel } from 'discord.js';
import { ConfigService } from '../../modules/config/config.service';
import { buildRegistrationPanel } from '../../modules/registration/registration.components';
import { hasAdminPermission } from '../../utils/permissions';
import { logger } from '../../utils/logger';

export const name = 'painel';
export const description = 'Envia o painel de registro permanente no canal atual.';

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;

  // 1. Verify permissions
  if (!hasAdminPermission(interaction.member as any)) {
    return interaction.reply({
      content: '❌ Você não possui permissão para usar este comando (requer Administrador ou Gerenciar Servidor).',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel as TextChannel;
  const configService = new ConfigService();

  try {
    // 2. Generate Components V2 Panel
    const panelContainer = buildRegistrationPanel();

    // 3. Send the panel message to current channel
    const panelMessage = await channel.send({
      components: [panelContainer],
      flags: [MessageFlags.IsComponentsV2],
    });

    // 4. Save channel and message IDs in the database config
    await configService.setPanelChannel(interaction.guildId!, channel.id, panelMessage.id);

    await interaction.editReply({
      content: `✅ Painel de registro enviado com sucesso em <#${channel.id}>!`,
    });
  } catch (err: any) {
    logger.error('Failed to send registration panel', err);
    await interaction.editReply({
      content: `❌ Ocorreu um erro ao enviar o painel: ${err.message || err}`,
    });
  }
}
