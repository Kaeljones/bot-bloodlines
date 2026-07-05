import { prisma } from '../../database/prisma';
import { GuildConfig, RegistrationRole } from '@prisma/client';

export class ConfigRepository {
  /**
   * Retrieves or creates a configuration for a specific guild.
   */
  async getOrCreate(guildId: string): Promise<GuildConfig & { roles: RegistrationRole[] }> {
    return prisma.guildConfig.upsert({
      where: { guildId },
      update: {},
      create: { guildId },
      include: { roles: true },
    }) as Promise<GuildConfig & { roles: RegistrationRole[] }>;
  }

  /**
   * Updates the registration panel channel and message IDs.
   */
  async updatePanel(
    guildId: string,
    panelChannelId: string,
    panelMessageId?: string
  ): Promise<GuildConfig> {
    return prisma.guildConfig.update({
      where: { guildId },
      data: {
        registrationPanelChannelId: panelChannelId,
        ...(panelMessageId !== undefined ? { registrationPanelMessageId: panelMessageId } : {}),
      },
    });
  }

  /**
   * Updates the channel ID for sending logs.
   */
  async updateLogChannel(guildId: string, logChannelId: string): Promise<GuildConfig> {
    return prisma.guildConfig.update({
      where: { guildId },
      data: { registrationLogChannelId: logChannelId },
    });
  }

  /**
   * Adds or updates a registration role.
   */
  async addRole(guildId: string, roleId: string, roleName: string): Promise<RegistrationRole> {
    // Ensure GuildConfig exists first
    await this.getOrCreate(guildId);

    return prisma.registrationRole.upsert({
      where: {
        guildId_roleId: { guildId, roleId },
      },
      update: {
        roleName,
        enabled: true,
      },
      create: {
        guildId,
        roleId,
        roleName,
        enabled: true,
      },
    });
  }

  /**
   * Removes a registration role.
   */
  async removeRole(guildId: string, roleId: string): Promise<RegistrationRole> {
    return prisma.registrationRole.delete({
      where: {
        guildId_roleId: { guildId, roleId },
      },
    });
  }

  /**
   * Resets all configurations for a guild.
   */
  async resetConfig(guildId: string): Promise<void> {
    await prisma.guildConfig.delete({
      where: { guildId },
    }).catch(() => {
      // Ignore if not found
    });
  }

  /**
   * Logs administrative activities.
   */
  async logAudit(
    guildId: string,
    action: string,
    userId?: string,
    targetUserId?: string,
    data?: any
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        guildId,
        action,
        userId,
        targetUserId,
        data: data ? JSON.stringify(data) : undefined,
      },
    });
  }
}
