import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { RegistrationService } from '../../modules/registration/registration.service';
import {
  buildRegistrationSuccessMessage,
  buildRegistrationErrorMessage
} from '../../modules/registration/registration.components';

export async function execute(interaction: ModalSubmitInteraction) {
  if (!interaction.guild || !interaction.member) return;

  await interaction.deferReply({ ephemeral: true });

  const customId = interaction.customId;
  const characterName = interaction.fields.getTextInputValue('characterName');
  const characterId = interaction.fields.getTextInputValue('characterId');

  const registrationService = new RegistrationService();

  if (customId === 'registration:modal') {
    // 1. Process new registration
    try {
      const result = await registrationService.createRegistration(
        interaction.guild,
        interaction.member as any,
        characterName,
        characterId
      );

      if (!result.success) {
        const errorContainer = buildRegistrationErrorMessage(result.message);
        return interaction.editReply({
          components: [errorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
      }

      const successContainer = buildRegistrationSuccessMessage(result.nickname!);
      return interaction.editReply({
        components: [successContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
    } catch (err: any) {
      const errorContainer = buildRegistrationErrorMessage(err.message || err);
      return interaction.editReply({
        components: [errorContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
    }
  } else if (customId === 'registration:modal:update') {
    // 2. Process registration update
    try {
      const result = await registrationService.updateRegistration(
        interaction.guild,
        interaction.member as any,
        characterName,
        characterId
      );

      if (!result.success) {
        const errorContainer = buildRegistrationErrorMessage(result.message);
        return interaction.editReply({
          components: [errorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
      }

      const successContainer = buildRegistrationSuccessMessage(result.nickname!);
      return interaction.editReply({
        components: [successContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
    } catch (err: any) {
      const errorContainer = buildRegistrationErrorMessage(err.message || err);
      return interaction.editReply({
        components: [errorContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
    }
  }
}
