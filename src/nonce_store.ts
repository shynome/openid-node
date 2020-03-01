export abstract class NonceStore {
  abstract Accept(endpoint: string, nonce: string): Promise<void>
}

export interface Nonce {
  T: number
  S: string
}

const maxNonceAge = 60e3

export function toISOString(date: Date) {
  return date.toISOString().slice(0, -5) + 'Z'
}

export class SimpleNonceStore implements NonceStore {
  public store = new Map<string, Nonce[]>()
  async Accept(endpoint: string, nonce: string) {
    // Value: A string 255 characters or less in length, that MUST be
    // unique to this particular successful authentication response.
    if (nonce.length < 20 || nonce.length > 256) {
      throw new Error('Invalid nonce')
    }
    let ts = new Date(nonce.slice(0, 20)).getTime()
    if (isNaN(ts)) {
      throw new Error('Invalid Date')
    }
    const now = Date.now()
    const diff = now - ts
    if (diff > maxNonceAge) {
      throw new Error(`Nonce too old: ${(diff / 1e3).toFixed(0)}s`)
    }
    const s = nonce.slice(20)

    const nonces = this.store.get(endpoint)
    const newNonces = [{ T: ts, S: s }]
    if (typeof nonces === 'undefined') {
      this.store.set(endpoint, newNonces)
      return
    }
    for (let n of nonces) {
      if (n.T === ts && n.S === s) {
        throw new Error('Nonce already used')
      }
      if (now - n.T < maxNonceAge) {
        newNonces.push(n)
      }
    }
    this.store.set(endpoint, newNonces)
  }
}
