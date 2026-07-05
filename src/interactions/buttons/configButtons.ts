import { ButtonInteraction, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import { ConfigService } from '../../modules/config/config.service';
import { buildChannelSelectRow, buildRoleSelectRow, buildRolesListMessage, buildConfigPanel } from '../../modules/registration/registration.components';
import { hasAdminPermission } from '../../utils/permissions';

export async function execute(interaction: ButtonInteraction) {
  if (!interaction.guild) return;

  // 1. Verify permissions
  if (!hasAdminPermission(interaction.member as any)) {
    return interaction.reply({
      content: '❌ Você não tem permissão para configurar o bot (requer Administrador ou Gerenciar Servidor).',
      ephemeral: true,
    });
  }

  const customId = interaction.customId;
  const configService = new ConfigService();
  const config = await configService.getOrCreateGuildConfig(interaction.guildId!);

  // 2. Route buttons
  switch (customId) {
    case 'config:set_panel_channel': {
      const selectRow = buildChannelSelectRow('config:select_panel_channel', 'Selecione o canal do painel...');
      return interaction.reply({
        content: '📌 Selecione o canal onde o painel de registro permanente deve ser enviado:',
        components: [selectRow],
        ephemeral: true,
      });
    }

    case 'config:set_log_channel': {
      const selectRow = buildChannelSelectRow('config:select_log_channel', 'Selecione o canal de logs...');
      return interaction.reply({
        content: '📜 Selecione o canal de texto onde os logs de registro serão enviados:',
        components: [selectRow],
        ephemeral: true,
      });
    }

    case 'config:add_role': {
      const selectRow = buildRoleSelectRow('config:select_add_role', 'Selecione o cargo para adicionar...');
      return interaction.reply({
        content: '➕ Selecione o cargo que deve ser adicionado automaticamente após o registro:',
        components: [selectRow],
        ephemeral: true,
      });
    }

    case 'config:remove_role': {
      if (config.roles.length === 0) {
        return interaction.reply({
          content: '❌ Não existem cargos configurados para remover.',
          ephemeral: true,
        });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('config:select_remove_role')
        .setPlaceholder('Escolha um cargo para remover...')
        .setMinValues(1)
        .setMaxValues(1);

      config.roles.forEach((r) => {
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(r.roleName || `Cargo ID: ${r.roleId}`)
            .setValue(r.roleId)
        );
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      return interaction.reply({
        content: '➖ Escolha o cargo que deseja remover da lista de cargos automáticos:',
        components: [row],
        ephemeral: true,
      });
    }

    case 'config:list_roles': {
      const listContent = buildRolesListMessage(config.roles);
      return interaction.reply({
        components: [listContent],
        flags: [MessageFlags.IsComponentsV2],
        ephemeral: true,
      });
    }

    case 'config:reset_config': {
      // Reset configuration
      await configService.resetConfig(interaction.guildId!);
      
      // Load clean configuration
      const cleanConfig = await configService.getOrCreateGuildConfig(interaction.guildId!);
      const cleanPanel = buildConfigPanel(cleanConfig, interaction.guild);

      // Update the main panel view
      return interaction.update({
        components: [cleanPanel],
      });
    }

    default:
      break;
  }
}
