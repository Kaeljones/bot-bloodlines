import {
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import { RegistrationService } from '../../modules/registration/registration.service';

export const name = 'atualizar';
export const description = 'Permite atualizar o seu Nome e ID de personagem registrado.';

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;

  const registrationService = new RegistrationService();
  const reg = await registrationService.getRegistrationByUser(interaction.guildId!, interaction.user.id);

  if (!reg) {
    return interaction.reply({
      content: '❌ Você não possui um registro ativo neste servidor para atualizar.',
      ephemeral: true,
    });
  }

  // Build the update modal prefilled with current information
  const modal = new ModalBuilder()
    .setCustomId('registration:modal:update')
    .setTitle('Atualizar Registro');

  const nameInput = new TextInputBuilder()
    .setCustomId('characterName')
    .setLabel('Nome do Personagem')
    .setPlaceholder('Kael Drakhar')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(32)
    .setValue(reg.characterName);

  const idInput = new TextInputBuilder()
    .setCustomId('characterId')
    .setLabel('ID do Personagem')
    .setPlaceholder('4085')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(10)
    .setValue(reg.characterId);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(idInput);

  modal.addComponents(row1, row2);

  // Show the modal to the user
  await interaction.showModal(modal);
}
