import { ChannelSelectMenuInteraction, MessageFlags, TextChannel } from 'discord.js';
import { ConfigService } from '../../modules/config/config.service';
import { buildRegistrationPanel } from '../../modules/registration/registration.components';
import { logger } from '../../utils/logger';

export async function execute(interaction: ChannelSelectMenuInteraction) {
  if (!interaction.guild) return;

  const customId = interaction.customId;
  const channelId = interaction.values[0];

  if (!channelId) {
    return interaction.reply({
      content: '❌ Nenhum canal foi selecionado.',
      ephemeral: true,
    });
  }

  const configService = new ConfigService();
  await interaction.deferReply({ ephemeral: true });

  try {
    if (customId === 'config:select_panel_channel') {
      // 1. Validate channel
      const targetChannel = interaction.guild.channels.cache.get(channelId) as TextChannel;
      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.editReply({
          content: '❌ O canal selecionado não é válido ou não é um canal de texto.',
        });
      }

      // 2. Build and send registration panel
      const panelContent = buildRegistrationPanel();
      const panelMessage = await targetChannel.send({
        components: [panelContent],
        flags: [MessageFlags.IsComponentsV2],
      });

      // 3. Save configuration
      await configService.setPanelChannel(interaction.guildId!, channelId, panelMessage.id);

      return interaction.editReply({
        content: `✅ Canal do painel definido com sucesso! O painel de registro foi enviado em <#${channelId}>.`,
      });
    } else if (customId === 'config:select_log_channel') {
      // 1. Validate channel
      const targetChannel = interaction.guild.channels.cache.get(channelId);
      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.editReply({
          content: '❌ O canal selecionado não é válido ou não é um canal de texto.',
        });
      }

      // 2. Save configuration
      await configService.setLogChannel(interaction.guildId!, channelId);

      return interaction.editReply({
        content: `✅ Canal de logs definido com sucesso como <#${channelId}>!`,
      });
    }
  } catch (err: any) {
    logger.error('Failed to configure channel select option', err);
    return interaction.editReply({
      content: `❌ Ocorreu um erro ao configurar o canal: ${err.message || err}`,
    });
  }
}
