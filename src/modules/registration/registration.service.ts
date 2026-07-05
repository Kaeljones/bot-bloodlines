import { Guild, GuildMember, TextChannel, MessageFlags } from 'discord.js';
import { RegistrationRepository } from './registration.repository';
import { ConfigService } from '../config/config.service';
import { sanitizeName } from '../../utils/sanitize';
import { registrationInputSchema } from './registration.schema';
import {
  buildRegistrationLogMessage,
  buildRegistrationErrorLog,
} from './registration.components';
import { logger } from '../../utils/logger';

export class RegistrationService {
  private repository: RegistrationRepository;
  private configService: ConfigService;

  constructor() {
    this.repository = new RegistrationRepository();
    this.configService = new ConfigService();
  }

  /**
   * Processes a new user registration.
   */
  async createRegistration(
    guild: Guild,
    member: GuildMember,
    characterNameRaw: string,
    characterIdRaw: string
  ): Promise<{ success: boolean; message: string; nickname?: string }> {
    const userId = member.id;
    const guildId = guild.id;

    // 1. Sanitization & Schema Validation
    const sanitizedName = sanitizeName(characterNameRaw);
    const validation = registrationInputSchema.safeParse({
      characterName: sanitizedName,
      characterId: characterIdRaw,
    });

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Dados inválidos.';
      return { success: false, message: errorMsg };
    }

    const { characterName, characterId } = validation.data;

    // 2. Fetch Server Configuration
    const config = await this.configService.getOrCreateGuildConfig(guildId);

    if (!config.registrationLogChannelId) {
      return {
        success: false,
        message: 'O canal de logs de registro não está configurado neste servidor. Entre em contato com a administração.',
      };
    }

    if (!config.roles || config.roles.length === 0) {
      return {
        success: false,
        message: 'Não há cargos configurados para novos registros neste servidor. Entre em contato com a administração.',
      };
    }

    // 3. Duplication Checks
    const existingUserReg = await this.repository.getByUser(guildId, userId);
    if (existingUserReg) {
      return {
        success: false,
        message: 'Você já possui um registro ativo neste servidor.',
      };
    }

    const existingIdReg = await this.repository.getByCharacterId(guildId, characterId);
    if (existingIdReg) {
      return {
        success: false,
        message: 'Este ID de personagem já está registrado por outro usuário.',
      };
    }

    // 4. Save Registration in database
    const finalNickname = `#${characterId} ${characterName}`;
    const configuredRoleIds = config.roles.filter(r => r.enabled).map(r => r.roleId);

    try {
      await this.repository.create({
        guildId,
        userId,
        characterName,
        characterId,
        nickname: finalNickname,
        appliedRoles: configuredRoleIds,
      });
    } catch (err: any) {
      logger.error('Database write failed during registration', err);
      return {
        success: false,
        message: `Falha ao salvar dados de registro no banco: ${err.message || err}`,
      };
    }

    // 5. Apply nickname & roles (Hierarchy checks)
    const nicknameResult = await this.applyNickname(member, finalNickname);
    const rolesResult = await this.applyRoles(member, configuredRoleIds);

    // 6. Send logs
    const logChannel = guild.channels.cache.get(config.registrationLogChannelId) as TextChannel;
    
    if (logChannel && logChannel.isTextBased()) {
      try {
        // Send success log
        const logContent = buildRegistrationLogMessage({
          userId,
          characterName,
          characterId,
          nickname: finalNickname,
          appliedRoleIds: rolesResult.applied,
          guild,
          avatarUrl: member.user.displayAvatarURL({ forceStatic: false }),
        });

        await logChannel.send({
          components: [logContent],
          flags: [MessageFlags.IsComponentsV2],
        });

        // Send warning logs for failed elements if there are any
        if (!nicknameResult.success || rolesResult.errors.length > 0) {
          const errorsList: string[] = [];
          if (!nicknameResult.success && nicknameResult.error) {
            errorsList.push(`Nickname: ${nicknameResult.error}`);
          }
          if (rolesResult.errors.length > 0) {
            errorsList.push(`Cargos:\n${rolesResult.errors.map(e => `- ${e}`).join('\n')}`);
          }

          const errorLog = buildRegistrationErrorLog({
            userId,
            errorMsg: 'Permissões parciais ou falha na aplicação de nickname/cargos.',
            reason: errorsList.join('\n\n'),
          });

          await logChannel.send({
            components: [errorLog],
            flags: [MessageFlags.IsComponentsV2],
          });
        }
      } catch (logErr) {
        logger.error('Failed to send registration log to channel', logErr);
      }
    }

    return {
      success: true,
      message: 'Registro concluído com sucesso!',
      nickname: finalNickname,
    };
  }

  /**
   * Updates an existing user registration.
   */
  async updateRegistration(
    guild: Guild,
    member: GuildMember,
    characterNameRaw: string,
    characterIdRaw: string
  ): Promise<{ success: boolean; message: string; nickname?: string }> {
    const userId = member.id;
    const guildId = guild.id;

    // 1. Sanitization & Validation
    const sanitizedName = sanitizeName(characterNameRaw);
    const validation = registrationInputSchema.safeParse({
      characterName: sanitizedName,
      characterId: characterIdRaw,
    });

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Dados inválidos.';
      return { success: false, message: errorMsg };
    }

    const { characterName, characterId } = validation.data;

    // Fetch config
    const config = await this.configService.getOrCreateGuildConfig(guildId);

    // 2. Uniqueness and existence check
    const currentReg = await this.repository.getByUser(guildId, userId);
    if (!currentReg) {
      return {
        success: false,
        message: 'Você não possui um registro ativo neste servidor para atualizar.',
      };
    }

    const existingIdReg = await this.repository.getByCharacterId(guildId, characterId);
    if (existingIdReg && existingIdReg.userId !== userId) {
      return {
        success: false,
        message: 'Este ID de personagem já está registrado por outro usuário.',
      };
    }

    // 3. Update database
    const finalNickname = `#${characterId} ${characterName}`;

    try {
      await this.repository.update(guildId, userId, {
        characterName,
        characterId,
        nickname: finalNickname,
      });
    } catch (err: any) {
      logger.error('Database update failed during registration update', err);
      return {
        success: false,
        message: `Erro ao atualizar banco de dados: ${err.message || err}`,
      };
    }

    // 4. Apply nickname
    const nicknameResult = await this.applyNickname(member, finalNickname);

    // 5. Send update log
    if (config.registrationLogChannelId) {
      const logChannel = guild.channels.cache.get(config.registrationLogChannelId) as TextChannel;
      if (logChannel && logChannel.isTextBased()) {
        try {
          const logContent = buildRegistrationLogMessage({
            userId,
            characterName,
            characterId,
            nickname: finalNickname,
            appliedRoleIds: currentReg.appliedRoles ? JSON.parse(currentReg.appliedRoles as string) : [],
            guild,
            avatarUrl: member.user.displayAvatarURL({ forceStatic: false }),
          });

          // Prepend update indicator text before sending container
          await logChannel.send({
            content: '🔄 **REGISTRO ATUALIZADO**',
            components: [logContent],
            flags: [MessageFlags.IsComponentsV2],
          });

          if (!nicknameResult.success && nicknameResult.error) {
            const errorLog = buildRegistrationErrorLog({
              userId,
              errorMsg: 'Falha na alteração de nickname durante atualização.',
              reason: nicknameResult.error,
            });

            await logChannel.send({
              components: [errorLog],
              flags: [MessageFlags.IsComponentsV2],
            });
          }
        } catch (logErr) {
          logger.error('Failed to send registration update log', logErr);
        }
      }
    }

    return {
      success: true,
      message: 'Registro atualizado com sucesso!',
      nickname: finalNickname,
    };
  }

  /**
   * Deletes a user registration and clean up roles/nicknames if requested.
   */
  async removeRegistration(
    guild: Guild,
    userId: string,
    removerUserId: string,
    removeRoles: boolean,
    resetNickname: boolean
  ): Promise<{ success: boolean; message: string }> {
    const guildId = guild.id;

    // Check if registration exists
    const currentReg = await this.repository.getByUser(guildId, userId);
    if (!currentReg) {
      return {
        success: false,
        message: 'Este usuário não possui um registro ativo neste servidor.',
      };
    }

    // Fetch config
    const config = await this.configService.getOrCreateGuildConfig(guildId);

    // Get guild member
    const member = await guild.members.fetch(userId).catch(() => null);

    let nicknameInfo = 'Não alterado (não solicitado ou membro ausente)';
    let rolesInfo = 'Não removidos (não solicitado ou membro ausente)';

    if (member) {
      // 1. Reset Nickname
      if (resetNickname) {
        const nicknameResult = await this.applyNickname(member, '');
        nicknameInfo = nicknameResult.success
          ? 'Resetado com sucesso (restaurado para o padrão)'
          : `Erro: ${nicknameResult.error}`;
      }

      // 2. Remove Roles
      if (removeRoles && currentReg.appliedRoles) {
        try {
          const rolesToRemove: string[] = JSON.parse(currentReg.appliedRoles as string);
          const removeResult = await this.removeRoles(member, rolesToRemove);
          rolesInfo = removeResult.success
            ? `Removidos com sucesso: ${removeResult.removed.map(id => `<@&${id}>`).join(', ')}`
            : `Erros:\n${removeResult.errors.join('\n')}`;
        } catch (err: any) {
          rolesInfo = `Erro ao ler cargos do registro: ${err.message}`;
        }
      }
    }

    // Delete from DB
    try {
      await this.repository.delete(guildId, userId);
    } catch (err: any) {
      logger.error('Database deletion failed during registration removal', err);
      return {
        success: false,
        message: `Falha ao remover o registro do banco de dados: ${err.message || err}`,
      };
    }

    // Send log
    if (config.registrationLogChannelId) {
      const logChannel = guild.channels.cache.get(config.registrationLogChannelId) as TextChannel;
      if (logChannel && logChannel.isTextBased()) {
        try {
          const logContent = buildRegistrationErrorLog({
            userId,
            errorMsg: `REGISTRO REMOVIDO POR <@${removerUserId}>`,
            reason: `**Nome anterior:** ${currentReg.characterName}\n` +
                    `**ID anterior:** ${currentReg.characterId}\n` +
                    `**Nickname anterior:** ${currentReg.nickname}\n\n` +
                    `**Ações executadas:**\n` +
                    `• Nickname: ${nicknameInfo}\n` +
                    `• Cargos: ${rolesInfo}`,
          });

          await logChannel.send({
            components: [logContent],
            flags: [MessageFlags.IsComponentsV2],
          });
        } catch (logErr) {
          logger.error('Failed to send registration removal log', logErr);
        }
      }
    }

    return {
      success: true,
      message: 'Registro removido com sucesso!',
    };
  }

  /**
   * Retrieves a registration by user.
   */
  async getRegistrationByUser(guildId: string, userId: string) {
    return this.repository.getByUser(guildId, userId);
  }

  /**
   * Retrieves a registration by character ID.
   */
  async getRegistrationByCharacterId(guildId: string, characterId: string) {
    return this.repository.getByCharacterId(guildId, characterId);
  }

  /**
   * Safely changes a user's nickname.
   */
  async applyNickname(
    member: GuildMember,
    nickname: string
  ): Promise<{ success: boolean; error?: string }> {
    const botMember = member.guild.members.me;

    // Check bot permissions
    const hasPerm = botMember?.permissions.has('ManageNicknames');
    if (!hasPerm) {
      return {
        success: false,
        error: 'O bot não possui a permissão "ManageNicknames" (Gerenciar Apelidos) para alterar o nickname.',
      };
    }

    // Check if target is guild owner (owners can't be changed by bots)
    if (member.id === member.guild.ownerId) {
      return {
        success: false,
        error: 'O usuário é dono do servidor. Nickname do dono do servidor não pode ser alterado por bots.',
      };
    }

    // Check hierarchy (member manageable check)
    if (!member.manageable) {
      return {
        success: false,
        error: 'O cargo do usuário está acima ou no mesmo nível que o cargo do bot na hierarquia do servidor.',
      };
    }

    try {
      // Empty string resets the nickname
      await member.setNickname(nickname === '' ? null : nickname);
      return { success: true };
    } catch (err: any) {
      logger.error(`Failed to set nickname for user ${member.id}`, err);
      return {
        success: false,
        error: err.message || 'Falha ao alterar apelido no Discord.',
      };
    }
  }

  /**
   * Safely adds multiple roles to a user, checking bot hierarchies.
   */
  async applyRoles(
    member: GuildMember,
    roleIds: string[]
  ): Promise<{ success: boolean; applied: string[]; errors: string[] }> {
    const botMember = member.guild.members.me;
    if (!botMember) {
      return {
        success: false,
        applied: [],
        errors: ['Não foi possível encontrar as informações do bot no servidor.'],
      };
    }

    // Check bot permissions
    const hasPerm = botMember.permissions.has('ManageRoles');
    if (!hasPerm) {
      return {
        success: false,
        applied: [],
        errors: ['O bot não possui a permissão "ManageRoles" (Gerenciar Cargos) para adicionar cargos.'],
      };
    }

    const botHighestRole = botMember.roles.highest;
    const applied: string[] = [];
    const errors: string[] = [];

    for (const roleId of roleIds) {
      const role = member.guild.roles.cache.get(roleId);
      if (!role) {
        errors.push(`Cargo com ID ${roleId} não encontrado no servidor.`);
        continue;
      }

      // Check hierarchy
      if (role.comparePositionTo(botHighestRole) >= 0) {
        errors.push(`O cargo @${role.name} está acima ou no mesmo nível que o cargo mais alto do bot na hierarquia.`);
        continue;
      }

      try {
        await member.roles.add(role);
        applied.push(roleId);
      } catch (err: any) {
        logger.error(`Failed to add role ${roleId} to user ${member.id}`, err);
        errors.push(`Erro ao adicionar @${role.name}: ${err.message || err}`);
      }
    }

    return {
      success: errors.length === 0,
      applied,
      errors,
    };
  }

  /**
   * Safely removes multiple roles from a user.
   */
  async removeRoles(
    member: GuildMember,
    roleIds: string[]
  ): Promise<{ success: boolean; removed: string[]; errors: string[] }> {
    const botMember = member.guild.members.me;
    if (!botMember) {
      return {
        success: false,
        removed: [],
        errors: ['Não foi possível encontrar as informações do bot no servidor.'],
      };
    }

    // Check bot permissions
    const hasPerm = botMember.permissions.has('ManageRoles');
    if (!hasPerm) {
      return {
        success: false,
        removed: [],
        errors: ['O bot não possui a permissão "ManageRoles" (Gerenciar Cargos) para remover cargos.'],
      };
    }

    const botHighestRole = botMember.roles.highest;
    const removed: string[] = [];
    const errors: string[] = [];

    for (const roleId of roleIds) {
      const role = member.guild.roles.cache.get(roleId);
      if (!role) {
        continue; // Skip silently if not found
      }

      // Check hierarchy
      if (role.comparePositionTo(botHighestRole) >= 0) {
        errors.push(`O cargo @${role.name} está acima do cargo do bot e não pode ser removido.`);
        continue;
      }

      try {
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(role);
          removed.push(roleId);
        }
      } catch (err: any) {
        logger.error(`Failed to remove role ${roleId} from user ${member.id}`, err);
        errors.push(`Erro ao remover @${role.name}: ${err.message || err}`);
      }
    }

    return {
      success: errors.length === 0,
      removed,
      errors,
    };
  }
}
