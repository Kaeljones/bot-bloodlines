import { prisma } from '../../database/prisma';
import { Registration } from '@prisma/client';

export class RegistrationRepository {
  /**
   * Retrieves a registration by the Discord User ID inside a specific guild.
   */
  async getByUser(guildId: string, userId: string): Promise<Registration | null> {
    return prisma.registration.findUnique({
      where: {
        guildId_userId: { guildId, userId },
      },
    });
  }

  /**
   * Retrieves a registration by the Character ID inside a specific guild.
   */
  async getByCharacterId(guildId: string, characterId: string): Promise<Registration | null> {
    return prisma.registration.findUnique({
      where: {
        guildId_characterId: { guildId, characterId },
      },
    });
  }

  /**
   * Creates a new registration.
   */
  async create(data: {
    guildId: string;
    userId: string;
    characterName: string;
    characterId: string;
    nickname: string;
    appliedRoles: string[];
  }): Promise<Registration> {
    return prisma.registration.create({
      data: {
        guildId: data.guildId,
        userId: data.userId,
        characterName: data.characterName,
        characterId: data.characterId,
        nickname: data.nickname,
        appliedRoles: JSON.stringify(data.appliedRoles),
      },
    });
  }

  /**
   * Updates an existing registration.
   */
  async update(
    guildId: string,
    userId: string,
    data: {
      characterName: string;
      characterId: string;
      nickname: string;
    }
  ): Promise<Registration> {
    return prisma.registration.update({
      where: {
        guildId_userId: { guildId, userId },
      },
      data: {
        characterName: data.characterName,
        characterId: data.characterId,
        nickname: data.nickname,
      },
    });
  }

  /**
   * Removes a registration.
   */
  async delete(guildId: string, userId: string): Promise<Registration> {
    return prisma.registration.delete({
      where: {
        guildId_userId: { guildId, userId },
      },
    });
  }
}
