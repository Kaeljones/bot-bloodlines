import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SeparatorSpacingSize,
  Guild,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType
} from 'discord.js';
import { GuildConfig, RegistrationRole } from '@prisma/client';
import { formatDate } from '../../utils/formatDate';

// Monochromatic Accent Color (blends with Discord's dark mode background)
const MONO_COLOR = 0x2B2D31;

/**
 * Builds the permanent Registration Panel message payload.
 */
export function buildRegistrationPanel() {
  const container = new ContainerBuilder()
    .setAccentColor(MONO_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# 📋 PAINEL DE REGISTRO\n\n' +
        'Seja bem-vindo ao sistema de registro de personagem.\n' +
        'Para obter acesso completo ao servidor, realize o seu registro abaixo.\n\n' +
        '### ━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '### 📝 **Como se registrar?**\n' +
        'Clique no botão abaixo e preencha os seguintes dados:\n' +
        '• **Nome do Personagem:** Nome e sobrenome do seu personagem.\n' +
        '• **ID do Personagem:** O ID numérico da sua conta.\n\n' +
        '### ━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '### 🏷️ **Formato do Apelido (Nickname):**\n' +
        'Seu nome no servidor será alterado automaticamente para:\n' +
        '> `#ID Nome do Personagem`\n\n' +
        '**Exemplo:**\n' +
        '> `#4085 Kael Drakhar`\n\n' +
        '### ━━━━━━━━━━━━━━━━━━━━━━━━'
      )
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('registration:start')
      .setLabel('Registrar')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Secondary)
  );

  container.addActionRowComponents(row);

  return container;
}

/**
 * Builds the Success Message for the user.
 */
export function buildRegistrationSuccessMessage(nickname: string) {
  const container = new ContainerBuilder()
    .setAccentColor(MONO_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ✅ REGISTRO CONCLUÍDO!\n\n` +
        `Seu registro foi finalizado e seu nome no servidor foi atualizado para:\n` +
        `> **\`${nickname}\`**`
      )
    );

  return container;
}

/**
 * Builds the Error Message for the user.
 */
export function buildRegistrationErrorMessage(reason: string) {
  const container = new ContainerBuilder()
    .setAccentColor(MONO_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ❌ REGISTRO NÃO CONCLUÍDO\n\n` +
        `Não foi possível concluir seu registro neste momento.\n\n` +
        `**Motivo:**\n` +
        `> ${reason}`
      )
    );

  return container;
}

/**
 * Builds the Admin Log message container when a user registers successfully.
 */
export function buildRegistrationLogMessage(data: {
  userId: string;
  characterName: string;
  characterId: string;
  nickname: string;
  appliedRoleIds: string[];
  guild: Guild;
  avatarUrl: string;
  isUpdate?: boolean;
}) {
  const roleMentions = data.appliedRoleIds.map(id => `<@&${id}>`).join(', ') || 'Nenhum cargo aplicado';
  const title = data.isUpdate ? '# 🔄 REGISTRO ATUALIZADO' : '# ✅ NOVO REGISTRO REALIZADO';

  const container = new ContainerBuilder()
    .setAccentColor(MONO_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(title)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Usuário Discord:**\n<@${data.userId}>\n\n` +
            `**ID Discord:**\n${data.userId}\n\n` +
            `**Nome do Personagem:**\n${data.characterName}\n\n` +
            `**ID do Personagem:**\n${data.characterId}\n\n` +
            `**Nickname Aplicado:**\n${data.nickname}\n\n` +
            `**Cargos Aplicados:**\n${roleMentions}`
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder()
            .setURL(data.avatarUrl)
            .setDescription('Avatar do usuário')
        )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Data:**\n${formatDate(new Date())}\n\n` +
        `**Status:**\nProcessamento concluído com sucesso.`
      )
    );

  return container;
}

/**
 * Builds the Admin Error Log message container when a registration failure occurs.
 */
export function buildRegistrationErrorLog(data: {
  userId: string;
  errorMsg: string;
  reason: string;
}) {
  const container = new ContainerBuilder()
    .setAccentColor(MONO_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# ⚠️ ERRO NO REGISTRO')
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Usuário:**\n<@${data.userId}>\n\n` +
        `**Erro:**\n${data.errorMsg}\n\n` +
        `**Motivo:**\n${data.reason}`
      )
    );

  return container;
}

/**
 * Builds the Administration Setup configuration panel.
 */
export function buildConfigPanel(
  config: GuildConfig & { roles: RegistrationRole[] },
  guild: Guild
) {
  const panelChannelMention = config.registrationPanelChannelId
    ? `<#${config.registrationPanelChannelId}>`
    : '*Não configurado*';

  const logChannelMention = config.registrationLogChannelId
    ? `<#${config.registrationLogChannelId}>`
    : '*Não configurado*';

  const rolesList = config.roles.length > 0
    ? config.roles.map(r => `• <@&${r.roleId}>`).join('\n')
    : '*Nenhum cargo configurado*';

  const container = new ContainerBuilder()
    .setAccentColor(MONO_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# ⚙️ CONFIGURAÇÃO DO REGISTRO\n\n' +
        'Gerencie as opções do sistema de registro deste servidor.\n\n' +
        `**Canal do Painel:**\n${panelChannelMention}\n\n` +
        `**Canal de Logs:**\n${logChannelMention}\n\n` +
        `**Cargos Aplicados:**\n${rolesList}`
      )
    );

  // Setup buttons row 1
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('config:set_panel_channel')
      .setLabel('Definir Canal do Painel')
      .setEmoji('📌')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('config:set_log_channel')
      .setLabel('Definir Canal de Logs')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('config:add_role')
      .setLabel('Adicionar Cargo')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Secondary)
  );

  // Setup buttons row 2
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('config:remove_role')
      .setLabel('Remover Cargo')
      .setEmoji('➖')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(config.roles.length === 0),
    new ButtonBuilder()
      .setCustomId('config:list_roles')
      .setLabel('Listar Cargos')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('config:reset_config')
      .setLabel('Resetar Configuração')
      .setEmoji('🗑')
      .setStyle(ButtonStyle.Secondary)
  );

  container.addActionRowComponents(row1, row2);

  return container;
}

/**
 * Builds a visual representation of configured roles.
 */
export function buildRolesListMessage(roles: RegistrationRole[]) {
  const container = new ContainerBuilder()
    .setAccentColor(MONO_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 📋 CARGOS CONFIGURADOS')
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        roles.length > 0
          ? roles.map(r => `• <@&${r.roleId}> (ID: \`${r.roleId}\`) [${r.roleName || 'Sem Nome'}]`).join('\n')
          : '*Nenhum cargo configurado no momento.*'
      )
    );

  return container;
}

/**
 * Builds the Channel Selection action row.
 */
export function buildChannelSelectRow(customId: string, placeholder: string) {
  return new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1)
  );
}

/**
 * Builds the Role Selection action row (for adding a role).
 */
export function buildRoleSelectRow(customId: string, placeholder: string) {
  return new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(1)
  );
}
