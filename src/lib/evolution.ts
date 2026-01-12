import { EvolutionConfig, getEvolutionConfig } from './evolutionConfig';

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
  });
}

export async function ensureSession(instanceName: string): Promise<void> {
  const cfg = await getEvolutionConfig();
  if (!cfg || !cfg.base_url) throw new Error('Evolution config missing');
  const base = cfg.base_url.replace(/\/$/, '');
  const timeout = cfg.timeout_ms ?? 8000;

  // Try common providers
  const candidates: Request[] = [
    // Evolution API v1 style
    new Request(`${base}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName, token: cfg.token })
    }),
    // WPPConnect-style
    new Request(`${base}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionName: instanceName, token: cfg.token })
    }),
  ];

  for (const req of candidates) {
    try {
      const res = await withTimeout(fetch(req), timeout);
      if (res.ok) return; // assume created or already exists
    } catch {}
  }
}

export async function fetchQRCode(instanceName: string): Promise<string | null> {
  const cfg = await getEvolutionConfig();
  if (!cfg || !cfg.base_url) throw new Error('Evolution config missing');
  const base = cfg.base_url.replace(/\/$/, '');
  const timeout = cfg.timeout_ms ?? 8000;

  const candidates = [
    `${base}/instance/qr?instanceName=${encodeURIComponent(instanceName)}&token=${encodeURIComponent(cfg.token || '')}`,
    `${base}/session/qr?sessionName=${encodeURIComponent(instanceName)}&token=${encodeURIComponent(cfg.token || '')}`,
  ];

  for (const url of candidates) {
    try {
      const res = await withTimeout(fetch(url, { method: 'GET' }), timeout);
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      const qr = data?.qrcode || data?.qr || data?.base64 || null;
      if (typeof qr === 'string' && qr.startsWith('data:')) return qr;
      if (typeof qr === 'string') return `data:image/png;base64,${qr}`;
    } catch {}
  }
  return null;
}

export async function fetchStatus(instanceName: string): Promise<'connected'|'connecting'|'disconnected'> {
  const cfg = await getEvolutionConfig();
  if (!cfg || !cfg.base_url) throw new Error('Evolution config missing');
  const base = cfg.base_url.replace(/\/$/, '');
  const timeout = cfg.timeout_ms ?? 8000;

  const candidates = [
    `${base}/instance/connectionState?instanceName=${encodeURIComponent(instanceName)}&token=${encodeURIComponent(cfg.token || '')}`,
    `${base}/session/status?sessionName=${encodeURIComponent(instanceName)}&token=${encodeURIComponent(cfg.token || '')}`,
  ];

  for (const url of candidates) {
    try {
      const res = await withTimeout(fetch(url, { method: 'GET' }), timeout);
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      const status: string = data?.status || data?.state || data?.connection || 'connecting';
      if (/connected/i.test(status)) return 'connected';
      if (/connecting|pairing|qr/i.test(status)) return 'connecting';
      return 'disconnected';
    } catch {}
  }
  return 'disconnected';
}

export async function logoutInstance(instanceName: string): Promise<boolean> {
  const cfg = await getEvolutionConfig();
  if (!cfg || !cfg.base_url) throw new Error('Evolution config missing');
  const base = cfg.base_url.replace(/\/$/, '');
  const timeout = cfg.timeout_ms ?? 8000;

  const candidates = [
    `${base}/instance/logout?instanceName=${encodeURIComponent(instanceName)}&token=${encodeURIComponent(cfg.token || '')}`,
    `${base}/session/logout?sessionName=${encodeURIComponent(instanceName)}&token=${encodeURIComponent(cfg.token || '')}`,
  ];

  for (const url of candidates) {
    try {
      const res = await withTimeout(fetch(url, { method: 'DELETE' }), timeout);
      if (res.ok) return true;
    } catch {}
  }
  return false;
}
