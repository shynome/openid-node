import { NonceStore } from './nonce_store'
import url from 'url'

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
// 10.1. Positive Assertions
// openid.signed - Comma-separated list of signed fields.
// This entry consists of the fields without the "openid." prefix that the signature covers.
// This list MUST contain at least "op_endpoint", "return_to" "response_nonce" and "assoc_handle",
// and if present in the response, "claimed_id" and "identity".
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

interface ReturnToFields {
  'openid.return_to': string
}
// 11.1.  Verifying the Return URL
// To verify that the "openid.return_to" URL matches the URL that is processing this assertion:
// - The URL scheme, authority, and path MUST be the same between the two
//   URLs.
// - Any query parameters that are present in the "openid.return_to" URL
//   MUST also be present with the same values in the URL of the HTTP
//   request the RP received.
export function verifyReturnTo(uri: string, vals: ReturnToFields) {}
