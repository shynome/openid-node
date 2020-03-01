import { NonceStore } from './nonce_store'

export interface NonceFields {
  'openid.response_nonce': string
  'openid.op_endpoint': string
}
export function verifyNonce(vals: NonceFields, store: NonceStore) {
  const nonce = vals['openid.response_nonce']
  const endpoint = vals['openid.op_endpoint']
  return store.Accept(endpoint, nonce)
}

export interface SignedFields {
  'openid.claimed_id'?: string
  'openid.identity'?: string
  'openid.signed': string
}
export function verifySignedFields(vals: SignedFields) {
  const ok = {
    op_endpoint: false,
    return_to: false,
    response_nonce: false,
    assoc_handle: false,
    claimed_id: (vals['openid.claimed_id'] || '') == '',
    identity: (vals['openid.identity'] || '') == '',
  }
  const signed = vals['openid.signed'].split(',')
  for (let sf of signed) {
    // @ts-ignore
    ok[sf] = true
  }
  for (let k in ok) {
    // @ts-ignore
    if (ok[k] === false) {
      throw new Error(`${k} must be signed but isn't`)
    }
  }
}
