import { ChatInputCommandInteraction } from 'discord.js';
import { hasAdminPermission } from '../../utils/permissions';
import { prisma } from '../../database/prisma';

export const name = 'registro-reset';
export const description = 'Remove todas as configurações de canais e cargos do registro (mantém dados de usuários).';

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

  const guildId = interaction.guildId!;

  try {
    // We clear the channel configs and delete the roles to reset configuration without deleting user registrations.
    await prisma.$transaction([
      prisma.guildConfig.update({
        where: { guildId },
        data: {
          registrationPanelChannelId: null,
          registrationPanelMessageId: null,
          registrationLogChannelId: null,
        },
      }),
      prisma.registrationRole.deleteMany({
        where: { guildId },
      }),
    ]);

    await interaction.editReply({
      content: '🗑️ Todas as configurações do sistema de registro (canais e cargos) foram resetadas com sucesso. Os registros dos usuários foram preservados.',
    });
  } catch (err: any) {
    await interaction.editReply({
      content: `❌ Ocorreu um erro ao resetar a configuração: ${err.message || err}`,
    });
  }
}
