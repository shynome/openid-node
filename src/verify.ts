import { NonceStore } from './nonce_store'
import url from 'url'
import { httpGetter } from './getter'

export interface NonceFields {
  'openid.response_nonce': string
  'openid.op_endpoint': string
}
export function verifyNonce(vals: NonceFields, store: NonceStore) {
  const nonce = vals['openid.response_nonce']
  const endpoint = vals['openid.op_endpoint']
  return store.Accept(endpoint, nonce)
}

export async function verifySignature(
  uri: string,
  vals: any,
  getter: httpGetter,
) {
  // To have the signature verification performed by the OP, the
  // Relying Party sends a direct request to the OP. To verify the
  // signature, the OP uses a private association that was generated
  // when it issued the positive assertion.

  // 11.4.2.1.  Request Parameters
  const params: { [k: string]: any } = {}
  // openid.mode: Value: "check_authentication"
  params['openid.mode'] = 'check_authentication'
  // Exact copies of all fields from the authentication response,
  // except for "openid.mode".
  for (let k in vals) {
    let vs = vals[k]
    if (k == 'openid.mode') {
      continue
    }
    params[k] = vs
  }
  const resp = await getter.Post(vals['openid.op_endpoint'], params)
  const response = resp.data
  const lines = response.split('\n')

  let isValid = false
  let nsValid = false
  for (let l of lines) {
    if (l === 'is_valid:true') {
      isValid = true
    } else if (l === 'ns:http://specs.openid.net/auth/2.0') {
      nsValid = true
    }
  }
  if (isValid && nsValid) {
    // Yay !
    return
  }

  throw new Error('Could not verify assertion with provider')
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
  [k: string]: any
  'openid.return_to': string
}
// 11.1.  Verifying the Return URL
// To verify that the "openid.return_to" URL matches the URL that is processing this assertion:
// - The URL scheme, authority, and path MUST be the same between the two
//   URLs.
// - Any query parameters that are present in the "openid.return_to" URL
//   MUST also be present with the same values in the URL of the HTTP
//   request the RP received.
export function verifyReturnTo(
  uri: url.UrlWithParsedQuery,
  vals: ReturnToFields,
) {
  const returnTo = vals['openid.return_to']
  const rp = url.parse(returnTo, true)
  if (
    uri.protocol != rp.protocol ||
    uri.host != rp.host ||
    uri.path != rp.path
  ) {
    throw new Error("Scheme, host or path don't match in return_to URL")
  }
  const qp = rp.query
  return compareQueryParams(qp, vals)
}

export function compareQueryParams<Q = { [k: string]: string }>(q1: Q, q2: Q) {
  for (let k in q1) {
    let v1 = q1[k]
    let v2 = q2[k]
    if (v1 !== v2) {
      throw new Error(
        `URLs query params don't match: Param ${k} different: ${v1} vs ${v2}`,
      )
    }
  }
}
