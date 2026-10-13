/** Messages between the UI and the crypto worker. Plaintext never leaves the worker except as a reply to the page. */
export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
  wrappedKey: string;
}

export type CryptoRequest =
  | { type: 'hasKey' }
  | { type: 'generateMnemonic' }
  | { type: 'setupFromMnemonic'; mnemonic: string }
  | { type: 'validateMnemonic'; mnemonic: string }
  | { type: 'encrypt'; plaintext: string }
  | { type: 'decrypt'; payload: EncryptedPayload }
  | { type: 'revealMnemonic' }
  | { type: 'clear' };

export type CryptoResponse =
  | { type: 'hasKey'; value: boolean }
  | { type: 'generateMnemonic'; mnemonic: string }
  | { type: 'setupFromMnemonic'; ok: true }
  | { type: 'validateMnemonic'; valid: boolean }
  | { type: 'encrypt'; payload: EncryptedPayload }
  | { type: 'decrypt'; plaintext: string }
  | { type: 'revealMnemonic'; mnemonic: string }
  | { type: 'clear'; ok: true }
  | { type: 'error'; message: string };

export interface CryptoEnvelope<T> {
  id: number;
  body: T;
}
