import { ChatInputCommandInteraction } from 'discord.js';
import { RegistrationService } from '../../modules/registration/registration.service';
import { hasAdminPermission } from '../../utils/permissions';

export const name = 'remover';
export const description = 'Remove o registro de um usuário do banco e limpa cargos/nickname.';

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

  const targetUser = interaction.options.getUser('usuario', true);
  const removeRoles = interaction.options.getBoolean('remover_cargos') ?? true;
  const resetNickname = interaction.options.getBoolean('resetar_nickname') ?? true;

  const registrationService = new RegistrationService();

  try {
    const result = await registrationService.removeRegistration(
      interaction.guild,
      targetUser.id,
      interaction.user.id,
      removeRoles,
      resetNickname
    );

    if (!result.success) {
      return interaction.editReply({
        content: `❌ Não foi possível remover o registro: ${result.message}`,
      });
    }

    return interaction.editReply({
      content: `✅ Registro do usuário <@${targetUser.id}> removido com sucesso!`,
    });
  } catch (err: any) {
    return interaction.editReply({
      content: `❌ Ocorreu um erro interno ao tentar remover o registro: ${err.message || err}`,
    });
  }
}
