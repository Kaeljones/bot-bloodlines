import { GuildMember, PermissionsBitField } from 'discord.js';

/**
 * Checks if a member has administrative permissions (Administrator or ManageGuild).
 */
export function hasAdminPermission(member: GuildMember | null | undefined): boolean {
  if (!member) return false;
  
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(PermissionsBitField.Flags.ManageGuild)
  );
}
