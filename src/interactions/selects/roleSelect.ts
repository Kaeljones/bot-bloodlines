import { RoleSelectMenuInteraction, StringSelectMenuInteraction } from 'discord.js';
import { ConfigService } from '../../modules/config/config.service';
import { logger } from '../../utils/logger';

export async function execute(interaction: RoleSelectMenuInteraction | StringSelectMenuInteraction) {
  if (!interaction.guild) return;

  const customId = interaction.customId;
  const configService = new ConfigService();

  await interaction.deferReply({ ephemeral: true });

  try {
    if (customId === 'config:select_add_role') {
      const roleMenu = interaction as RoleSelectMenuInteraction;
      const role = roleMenu.roles.first();

      if (!role) {
        return interaction.editReply({
          content: '❌ Nenhum cargo foi selecionado.',
        });
      }

      // Save role configuration in database
      await configService.addRegistrationRole(interaction.guildId!, role.id, role.name);

      return interaction.editReply({
        content: `✅ Cargo **@${role.name}** adicionado com sucesso à lista de cargos de registro!`,
      });
    } else if (customId === 'config:select_remove_role') {
      const selectMenu = interaction as StringSelectMenuInteraction;
      const roleId = selectMenu.values[0];

      if (!roleId) {
        return interaction.editReply({
          content: '❌ Nenhum cargo foi selecionado para remoção.',
        });
      }

      // Remove role configuration from database
      const removedRole = await configService.removeRegistrationRole(interaction.guildId!, roleId);

      return interaction.editReply({
        content: `✅ Cargo **@${removedRole.roleName || roleId}** removido com sucesso das configurações!`,
      });
    }
  } catch (err: any) {
    logger.error('Failed to configure role option', err);
    return interaction.editReply({
      content: `❌ Ocorreu um erro ao configurar o cargo: ${err.message || err}`,
    });
  }
}
