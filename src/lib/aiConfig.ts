export type AIConfig = {
  enabled: boolean;
  model: string;
  scope: 'all_clients' | 'company' | 'user';
  updated_at?: string;
};

const CONFIG_URL = process.env.NEXT_PUBLIC_AI_CONFIG_URL || 'http://talkagents.br.com/public_html/ai_config.json';

export async function getAIConfig(): Promise<AIConfig> {
  try {
    const res = await fetch(CONFIG_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch AI config');
    const data = await res.json();
    return data as AIConfig;
  } catch (e) {
    return { enabled: false, model: 'GPT-5', scope: 'all_clients' };
  }
}
