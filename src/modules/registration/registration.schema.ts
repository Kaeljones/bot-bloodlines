import { z } from 'zod';

export const characterNameSchema = z.string()
  .trim()
  .min(3, { message: 'O nome do personagem deve possuir entre 3 e 32 caracteres.' })
  .max(32, { message: 'O nome do personagem deve possuir entre 3 e 32 caracteres.' });

export const characterIdSchema = z.string()
  .trim()
  .min(1, { message: 'O ID do personagem não pode estar vazio.' })
  .max(10, { message: 'O ID do personagem deve possuir no máximo 10 caracteres.' })
  .regex(/^\d+$/, { message: 'O ID do personagem deve conter apenas números.' });

export const registrationInputSchema = z.object({
  characterName: characterNameSchema,
  characterId: characterIdSchema,
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;
