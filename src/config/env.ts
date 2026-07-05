import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN é obrigatório'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID é obrigatório'),
  DEVELOPMENT_GUILD_ID: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  PORT: z.preprocess((val) => (val ? Number(val) : 3000), z.number()).default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Erro de configuração no arquivo .env:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type EnvType = z.infer<typeof envSchema>;
