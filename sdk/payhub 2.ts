export type SDKInit = { baseUrl: string; token: string };
export type TrustlineResult = { ok: boolean; txHash: string; sequence: number };
export type EscrowCreateResult = { ok: boolean; txHash: string; offerSequence: number; owner: string; condition?: string | null };
export type EscrowFinishResult = { ok: boolean; txHash: string; sequence: number };
export type AmmQuoteResult = { ok: boolean; alternatives: any[]; pathsCount: number };
export type ComplianceReport = { ok: boolean; format: 'csv'; content: string };
export type YieldActivateResult = { ok: boolean; status?: 'INACTIVE' | 'PENDING' | 'ACTIVE' };
export type SecurityAlertsResult = { ok: boolean; alerts: any[]; stats: Record<string, number> };

export class PayhubSDK {
  private baseUrl: string;
  private token: string;

  constructor(init: SDKInit) {
    this.baseUrl = init.baseUrl;
    this.token = init.token;
  }

  private headers() {
    return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' };
  }

  private buildUrl(path: string) {
    const b = this.baseUrl || (typeof window !== 'undefined' && window.location ? window.location.origin : '');
    return `${b}${path}`;
  }

  private async requestWithRetry(method: 'GET' | 'POST', path: string, body?: any, attempts = 3): Promise<any> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        const url = this.buildUrl(path);
        const init: any = { method, headers: this.headers() };
        if (method === 'POST') init.body = JSON.stringify(body || {});
        const res = await fetch(url, init);
        const txt = await res.text();
        let json: any; try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
        if (!res.ok) {
          const status = res.status;
          if (status === 429 && i < attempts - 1) {
            const ms = 500 * Math.pow(2, i);
            await new Promise((r) => setTimeout(r, ms));
            continue;
          }
          throw new Error(json.error || `HTTP ${status}`);
        }
        return json;
      } catch (e) {
        lastErr = e;
        if (i < attempts - 1) {
          const ms = 500 * Math.pow(2, i);
          await new Promise((r) => setTimeout(r, ms));
          continue;
        }
        throw lastErr;
      }
    }
  }

  private async get<T>(path: string): Promise<T> {
    const json = await this.requestWithRetry('GET', path);
    return json as T;
  }

  private async post<T>(path: string, body?: any): Promise<T> {
    const json = await this.requestWithRetry('POST', path, body);
    return json as T;
  }

  trustline = {
    create: async (limit: string): Promise<TrustlineResult> => {
      return this.post<TrustlineResult>('/api/trustline-rlusd', { limit });
    },
  };

  escrow = {
    create: async (
      value: string,
      opts?: { finishAfterUnix?: number; policy?: any; preimageHex?: string }
    ): Promise<EscrowCreateResult> => {
      const body: any = { value };
      if (opts && typeof opts.finishAfterUnix === 'number') body.finishAfterUnix = opts.finishAfterUnix;
      if (opts && opts.policy) body.policy = opts.policy;
      if (opts && typeof opts.preimageHex === 'string') body.preimageHex = opts.preimageHex;
      return this.post<EscrowCreateResult>('/api/escrow-create', body);
    },
    finish: async (
      owner: string,
      offerSequence: number,
      opts?: { fulfillmentHex?: string; policy?: any }
    ): Promise<EscrowFinishResult> => {
      const body: any = { owner, offerSequence };
      if (opts && typeof opts.fulfillmentHex === 'string') body.fulfillmentHex = opts.fulfillmentHex;
      if (opts && opts.policy) body.policy = opts.policy;
      return this.post<EscrowFinishResult>('/api/escrow-finish', body);
    },
  };

  amm = {
    quote: async (params: {
      sourceAccount: string;
      destinationAccount: string;
      deliverCurrency: string;
      deliverIssuer: string;
      deliverValue: string;
      sendMaxCurrency?: string;
      sendMaxIssuer?: string;
      sendMaxValue?: string;
    }): Promise<AmmQuoteResult> => {
      return this.post<AmmQuoteResult>('/api/amm/quote', params);
    },
  };

  yield = {
    activate: async (): Promise<YieldActivateResult> => {
      return this.post<YieldActivateResult>('/api/v1/merchant/yield/activate');
    },
  };

  compliance = {
    exportCSV: async (): Promise<string> => {
      const r = await this.get<ComplianceReport>('/api/v1/compliance/report');
      if (r && r.format === 'csv') return r.content;
      return '';
    },
  };

  security = {
    alerts: async (): Promise<SecurityAlertsResult> => {
      return this.get<SecurityAlertsResult>('/api/security/alerts');
    },
  };

  currencyHex(name: string) {
    let hex = '';
    for (let i = 0; i < name.length; i++) {
      const code = name.charCodeAt(i);
      hex += code.toString(16).padStart(2, '0').toUpperCase();
    }
    return hex.padEnd(40, '0');
  }
}

export function createSDK(init: SDKInit) { return new PayhubSDK(init); }
