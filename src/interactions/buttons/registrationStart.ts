import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { RegistrationService } from '../../modules/registration/registration.service';

export const customId = 'registration:start';

export async function execute(interaction: ButtonInteraction) {
  if (!interaction.guild) return;

  const registrationService = new RegistrationService();
  const existing = await registrationService.getRegistrationByUser(interaction.guildId!, interaction.user.id);

  if (existing) {
    return interaction.reply({
      content: '❌ Não foi possível concluir seu registro.\n\n**Motivo:** Você já possui um registro ativo neste servidor.',
      ephemeral: true,
    });
  }

  // Build the Registration Modal
  const modal = new ModalBuilder()
    .setCustomId('registration:modal')
    .setTitle('Registro de Personagem');

  const nameInput = new TextInputBuilder()
    .setCustomId('characterName')
    .setLabel('Nome do Personagem')
    .setPlaceholder('Kael Drakhar')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(32);

  const idInput = new TextInputBuilder()
    .setCustomId('characterId')
    .setLabel('ID do Personagem')
    .setPlaceholder('4085')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(10);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(idInput);

  modal.addComponents(row1, row2);

  await interaction.showModal(modal);
}
