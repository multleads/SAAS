export type EvolutionConfig = {
  provider: 'evolution' | 'wppconnect' | 'other';
  base_url: string;
  token?: string;
  timeout_ms?: number;
};

const CFG_URL = process.env.NEXT_PUBLIC_EVOLUTION_CONFIG_URL || 'http://talkagents.br.com/public_html/evolution_config.json';

export async function getEvolutionConfig(): Promise<EvolutionConfig | null> {
  try {
    const res = await fetch(CFG_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data as EvolutionConfig;
  } catch {
    return null;
  }
}
