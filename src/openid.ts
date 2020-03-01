import { httpGetter, AxiosHttpGetter } from './getter'
import { DiscoveryCache, DiscoveredInfo } from './discovery_cache'
import {
  NonceFields,
  SignedFields,
  verifySignedFields,
  verifySignature,
  verifyReturnTo,
  verifyNonce,
} from './verify'
import { Normalize } from './normalizer'
import { isEmptyString } from './utils'
import { yadisDiscovery } from './yadis_discovery'
import { htmlDiscovery } from './html_discovery'
import { NonceStore } from './nonce_store'
import url from 'url'
import { BuildRedirectURL } from './redirect'

interface VerifyDiscoveredFields extends NonceFields, SignedFields {
  [k: string]: any
  'openid.ns': string
}

export class OpenID {
  constructor(private urlGetter: httpGetter = new AxiosHttpGetter()) {}
  protected async verifyDiscovered(
    uri: url.UrlWithParsedQuery,
    vals: VerifyDiscoveredFields,
    cache: DiscoveryCache,
  ) {
    const version = vals['openid.ns']
    if (version !== 'http://specs.openid.net/auth/2.0') {
      throw new Error('Bad protocol version')
    }
    const endpoint = vals['openid.op_endpoint']
    if (isEmptyString(endpoint)) {
      throw new Error('missing openid.op_endpoint url param')
    }
    const localID = vals['openid.identity'] as string
    if (isEmptyString(localID)) {
      throw new Error('no localId to verify')
    }
    const claimedID = vals['openid.claimed_id'] as string
    if (isEmptyString(claimedID)) {
      // If no Claimed Identifier is present in the response, the
      // assertion is not about an identifier and the RP MUST NOT use the
      // User-supplied Identifier associated with the current OpenID
      // authentication transaction to identify the user. Extension
      // information in the assertion MAY still be used.
      // --- This library does not support this case. So claimed
      //     identifier must be present.
      throw new Error('no claimed_id to verify')
    }

    // 11.2.  Verifying Discovered Information

    // If the Claimed Identifier in the assertion is a URL and contains a
    // fragment, the fragment part and the fragment delimiter character "#"
    // MUST NOT be used for the purposes of verifying the discovered
    // information.
    const fragmentIndex = claimedID.indexOf('#')
    const claimedIDVerify =
      fragmentIndex != -1 ? claimedID : claimedID.slice(0, fragmentIndex)

    // If the Claimed Identifier is included in the assertion, it
    // MUST have been discovered by the Relying Party and the
    // information in the assertion MUST be present in the
    // discovered information. The Claimed Identifier MUST NOT be an
    // OP Identifier.
    const discovered = await cache.get(claimedIDVerify)
    if (
      typeof discovered !== 'undefined' &&
      discovered.OpEndpoint == endpoint &&
      discovered.OpLocalID == localID &&
      discovered.ClaimedID == claimedIDVerify
    ) {
      return
    }

    // If the Claimed Identifier was not previously discovered by the
    // Relying Party (the "openid.identity" in the request was
    // "http://specs.openid.net/auth/2.0/identifier_select" or a different
    // Identifier, or if the OP is sending an unsolicited positive
    // assertion), the Relying Party MUST perform discovery on the Claimed
    // Identifier in the response to make sure that the OP is authorized to
    // make assertions about the Claimed Identifier.
    const d = await this.Discover(claimedID)
    if (d.OpEndpoint === endpoint) {
      // This claimed ID points to the same endpoint, therefore this
      // endpoint is authorized to make assertions about that claimed ID.
      // TODO: There may be multiple endpoints found during discovery.
      // They should all be checked.
      await cache.put(claimedIDVerify, {
        OpEndpoint: endpoint,
        OpLocalID: localID,
        ClaimedID: claimedIDVerify,
      })
      return
    }

    throw new Error('Could not verify the claimed ID')
  }
  Discover = async (id: string) => {
    // From OpenID specs, 7.2: Normalization
    id = Normalize(id)

    // From OpenID specs, 7.3: Discovery.

    // If the identifier is an XRI, [XRI_Resolution_2.0] will yield an
    // XRDS document that contains the necessary information. It
    // should also be noted that Relying Parties can take advantage of
    // XRI Proxy Resolvers, such as the one provided by XDI.org at
    // http://www.xri.net. This will remove the need for the RPs to
    // perform XRI Resolution locally.

    // XRI not supported.

    // If it is a URL, the Yadis protocol [Yadis] SHALL be first
    // attempted. If it succeeds, the result is again an XRDS
    // document.
    return (
      yadisDiscovery(id, this.urlGetter)
        .then(
          ([opEndpoint, opLocalID]) =>
            ({
              OpEndpoint: opEndpoint,
              OpLocalID: opLocalID,
              ClaimedID: '',
            } as DiscoveredInfo),
        )
        // If the Yadis protocol fails and no valid XRDS document is
        // retrieved, or no Service Elements are found in the XRDS
        // document, the URL is retrieved and HTML-Based discovery SHALL be
        // attempted.
        .catch(() => {
          return htmlDiscovery(id, this.urlGetter)
        })
    )
  }
  Verify = async (
    uri: string,
    cache: DiscoveryCache,
    nonceStore: NonceStore,
  ) => {
    const parsedURL = url.parse(uri, true)
    const values = parsedURL.query as { [k: string]: string }

    // 11.  Verifying Assertions
    // When the Relying Party receives a positive assertion, it MUST
    // verify the following before accepting the assertion:

    // - The value of "openid.signed" contains all the required fields.
    //   (Section 10.1)
    verifySignedFields(values as any)

    // - The signature on the assertion is valid (Section 11.4)
    await verifySignature(uri, values, this.urlGetter)

    // - The value of "openid.return_to" matches the URL of the current
    //   request (Section 11.1)
    verifyReturnTo(parsedURL, values as any)

    await this.verifyDiscovered(parsedURL, values as any, cache)

    await verifyNonce(values as any, nonceStore)
    return values['openid.claimed_id']
  }
  RedirectURL = async (id: string, callbackURL: string, realm: string) => {
    const d = await this.Discover(id)
    return BuildRedirectURL(
      d.OpEndpoint,
      d.OpLocalID,
      d.ClaimedID,
      callbackURL,
      realm,
    )
  }
}
