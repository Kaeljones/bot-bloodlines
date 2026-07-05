import { ChatInputCommandInteraction, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder } from 'discord.js';
import { RegistrationService } from '../../modules/registration/registration.service';
import { hasAdminPermission } from '../../utils/permissions';
import { formatDate } from '../../utils/formatDate';

export const name = 'consultar';
export const description = 'Consulta informações de registro de um usuário.';

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;

  const targetUser = interaction.options.getUser('usuario') || interaction.user;
  const isQueryingSelf = targetUser.id === interaction.user.id;

  // If querying another user, must have admin permissions
  if (!isQueryingSelf && !hasAdminPermission(interaction.member as any)) {
    return interaction.reply({
      content: '❌ Você não tem permissão para consultar o registro de outros membros (requer Administrador ou Gerenciar Servidor).',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const registrationService = new RegistrationService();
  const registration = await registrationService.getRegistrationByUser(interaction.guildId!, targetUser.id);

  if (!registration) {
    return interaction.editReply({
      content: isQueryingSelf
        ? '❌ Você ainda não está registrado neste servidor.'
        : `❌ O usuário <@${targetUser.id}> não possui registro ativo neste servidor.`,
    });
  }

  // Format applied roles
  let appliedRolesList = 'Nenhum';
  if (registration.appliedRoles) {
    try {
      const roleIds: string[] = JSON.parse(registration.appliedRoles as string);
      appliedRolesList = roleIds.map(id => `<@&${id}>`).join(', ') || 'Nenhum';
    } catch {
      appliedRolesList = 'Nenhum (erro ao decodificar)';
    }
  }

  const container = new ContainerBuilder()
    .setAccentColor(0x3498DB) // Blue
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 🔍 CONSULTA DE REGISTRO`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addSectionComponents(
      new SectionBuilder().addTextDisplayComponents([
        new TextDisplayBuilder().setContent(
          `**Usuário Discord:** <@${registration.userId}>\n` +
          `**ID Discord:** \`${registration.userId}\`\n\n` +
          `**Nome do Personagem:** ${registration.characterName}\n` +
          `**ID do Personagem:** ${registration.characterId}\n` +
          `**Apelido Aplicado:** ${registration.nickname}\n\n` +
          `**Cargos Aplicados:** ${appliedRolesList}\n` +
          `**Data do Registro:** ${formatDate(registration.createdAt)}`
        )
      ])
    );

  await interaction.editReply({
    components: [container],
    flags: [MessageFlags.IsComponentsV2],
  });
}
