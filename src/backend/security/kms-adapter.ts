// KMS Adapter — PAYHUB P4YHU3
// Objetivo: fornecer uma interface segura para obter a XRPL_SEED
// sem expor segredos, com suporte futuro a AWS KMS / HashiCorp Vault.

export interface KmsAdapterConfig {
  provider?: 'env' | 'aws_kms' | 'vault';
  keyIdEnv?: string; // nome da env que guarda o ID da chave
}

class KmsAdapter {
  private config: KmsAdapterConfig;

  constructor(config?: Partial<KmsAdapterConfig>) {
    this.config = {
      provider: 'env',
      keyIdEnv: 'XRPL_SEED_KEY_ID',
      ...config,
    };
  }

  // Em produção: chamar AWS KMS / Vault para descriptografar e retornar a seed
  // Aqui: usa somente variável de ambiente XRPL_SEED, sem persistir ou logar valores
  public async getDecryptedXRPLSeed(): Promise<string> {
    try {
      // Provedor ENV (desenvolvimento): XRPL_SEED deve ser injetada via env
      if (this.config.provider === 'env') {
        const seed = process.env.XRPL_SEED;
        if (!seed) {
          throw new Error('Missing XRPL_SEED env');
        }
        return seed;
      }

      // Provedor AWS KMS (conceitual)
      if (this.config.provider === 'aws_kms') {
        const keyId = process.env[this.config.keyIdEnv || 'XRPL_SEED_KEY_ID'];
        if (!keyId) {
          throw new Error('Missing XRPL_SEED_KEY_ID env');
        }
        // Exemplo conceitual: obter ciphertext de secret storage e chamar KMS decrypt
        // const ciphertext = await secureStore.get(keyId);
        // const plaintext = await awsKms.decrypt(ciphertext);
        // return plaintext;
        throw new Error('aws_kms provider not implemented in this demo');
      }

      // Provedor Vault (conceitual)
      if (this.config.provider === 'vault') {
        // const token = process.env.VAULT_TOKEN;
        // const secretPath = process.env.XRPL_SEED_SECRET_PATH;
        // const seed = await vaultClient.read(secretPath, token);
        // return seed;
        throw new Error('vault provider not implemented in this demo');
      }

      throw new Error('Unsupported KMS provider');
    } catch (err: any) {
      const msg = err?.message || String(err);
      // Não logar segredos; retornar erro simples
      throw new Error(`KMS adapter error: ${msg}`);
    }
  }
}

export const kmsAdapter = new KmsAdapter();