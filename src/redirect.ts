import { isEmptyString } from './utils'
import url from 'url'
import { compareQueryParams } from './verify'
export function BuildRedirectURL(
  opEndpoint: string,
  opLocalID: string,
  claimedID: string,
  returnTo: string,
  realm: string,
) {
  const values: { [k: string]: string } = {
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
  }

  // 9.1.  Request Parameters
  // "openid.claimed_id" and "openid.identity" SHALL be either both present or both absent.
  if (isEmptyString(claimedID) === false) {
    values['openid.claimed_id'] = claimedID
    if (isEmptyString(opLocalID) === false) {
      values['openid.identity'] = opLocalID
    } else {
      // If a different OP-Local Identifier is not specified,
      // the claimed identifier MUST be used as the value for openid.identity.
      values['openid.identity'] = claimedID
    }
  } else {
    // 7.3.1.  Discovered Information
    // If the end user entered an OP Identifier, there is no Claimed Identifier.
    // For the purposes of making OpenID Authentication requests, the value
    // "http://specs.openid.net/auth/2.0/identifier_select" MUST be used as both the
    // Claimed Identifier and the OP-Local Identifier when an OP Identifier is entered.
    values['openid.claimed_id'] =
      'http://specs.openid.net/auth/2.0/identifier_select'
    values['openid.identity'] =
      'http://specs.openid.net/auth/2.0/identifier_select'
  }

  if (isEmptyString(realm) === false) {
    values['openid.realm'] = realm
  }

  let parseEndpoint = url.parse(opEndpoint, true)
  parseEndpoint.query = {
    ...parseEndpoint.query,
    ...values,
  }
  let u = url.format(parseEndpoint)
  return u
}
