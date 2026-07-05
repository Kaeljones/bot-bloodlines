import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { ConfigService } from '../../modules/config/config.service';
import { buildConfigPanel } from '../../modules/registration/registration.components';
import { hasAdminPermission } from '../../utils/permissions';

export const name = 'registro';
export const description = 'Abre o painel administrativo para configurar o sistema de registro.';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) return;

  // 1. Verify permissions
  if (!hasAdminPermission(interaction.member as any)) {
    await interaction.reply({
      content: '❌ Você não tem permissão para usar este comando (requer Administrador ou Gerenciar Servidor).',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const configService = new ConfigService();

  try {
    const config = await configService.getOrCreateGuildConfig(interaction.guildId!);
    const configPanel = buildConfigPanel(config, interaction.guild);

    await interaction.editReply({
      components: [configPanel],
      flags: [MessageFlags.IsComponentsV2],
    });
  } catch (err: any) {
    console.error('Failed to load configuration panel:', err);
    await interaction.editReply({
      content: `❌ Erro ao carregar painel de configuração: ${err.message || err}`,
    });
  }
}
