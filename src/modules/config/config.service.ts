import { ConfigRepository } from './config.repository';
import { GuildConfig, RegistrationRole } from '@prisma/client';

export class ConfigService {
  private repository: ConfigRepository;

  constructor() {
    this.repository = new ConfigRepository();
  }

  async getOrCreateGuildConfig(guildId: string): Promise<GuildConfig & { roles: RegistrationRole[] }> {
    return this.repository.getOrCreate(guildId);
  }

  async setPanelChannel(guildId: string, channelId: string, messageId?: string): Promise<GuildConfig> {
    const config = await this.repository.updatePanel(guildId, channelId, messageId);
    await this.repository.logAudit(guildId, 'SET_PANEL_CHANNEL', undefined, undefined, { channelId, messageId });
    return config;
  }

  async setLogChannel(guildId: string, channelId: string): Promise<GuildConfig> {
    const config = await this.repository.updateLogChannel(guildId, channelId);
    await this.repository.logAudit(guildId, 'SET_LOG_CHANNEL', undefined, undefined, { channelId });
    return config;
  }

  async addRegistrationRole(guildId: string, roleId: string, roleName: string): Promise<RegistrationRole> {
    const role = await this.repository.addRole(guildId, roleId, roleName);
    await this.repository.logAudit(guildId, 'ADD_ROLE', undefined, undefined, { roleId, roleName });
    return role;
  }

  async removeRegistrationRole(guildId: string, roleId: string): Promise<RegistrationRole> {
    const role = await this.repository.removeRole(guildId, roleId);
    await this.repository.logAudit(guildId, 'REMOVE_ROLE', undefined, undefined, { roleId, roleName: role.roleName });
    return role;
  }

  async listRegistrationRoles(guildId: string): Promise<RegistrationRole[]> {
    const config = await this.repository.getOrCreate(guildId);
    return config.roles;
  }

  async resetConfig(guildId: string): Promise<void> {
    await this.repository.resetConfig(guildId);
    await this.repository.logAudit(guildId, 'RESET_CONFIG');
  }
}
