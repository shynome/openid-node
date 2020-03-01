import parser from 'fast-xml-parser'

interface XrdsIdentifier {
  Type: string[] | string
  URI: string
  LocalID: string
  priority: string
}
interface Xrd {
  Service: XrdsIdentifier[]
}
interface XrdsDocument {
  XRDS: { XRD: Xrd }
}

function hasType(types: string[] | string, type: string) {
  if (typeof types === 'string') {
    return types === type
  }
  return types.includes(type)
}

export async function parseXrds(input: string): Promise<[string, string]> {
  const xrdsDoc: XrdsDocument = parser.parse(input, { ignoreNameSpace: true })
  if (!xrdsDoc?.XRDS?.XRD) {
    throw new Error('XRDS document missing XRD tag')
  }

  const Service = ([] as XrdsIdentifier[]).concat(xrdsDoc.XRDS.XRD.Service)

  // 7.3.2.2.  Extracting Authentication Data
  // Once the Relying Party has obtained an XRDS document, it
  // MUST first search the document (following the rules
  // described in [XRI_Resolution_2.0]) for an OP Identifier
  // Element. If none is found, the RP will search for a Claimed
  // Identifier Element.
  for (let service of Service) {
    // 7.3.2.1.1.  OP Identifier Element
    // An OP Identifier Element is an <xrd:Service> element with the
    // following information:
    // An <xrd:Type> tag whose text content is
    //     "http://specs.openid.net/auth/2.0/server".
    // An <xrd:URI> tag whose text content is the OP Endpoint URL
    if (hasType(service.Type, 'http://specs.openid.net/auth/2.0/server')) {
      return [service.URI, '']
    }
  }

  for (let service of Service) {
    // 7.3.2.1.2.  Claimed Identifier Element
    // A Claimed Identifier Element is an <xrd:Service> element
    // with the following information:
    // An <xrd:Type> tag whose text content is
    //     "http://specs.openid.net/auth/2.0/signon".
    // An <xrd:URI> tag whose text content is the OP Endpoint
    //     URL.
    // An <xrd:LocalID> tag (optional) whose text content is the
    //     OP-Local Identifier.
    if (hasType(service.Type, 'http://specs.openid.net/auth/2.0/signon')) {
      let opEndpoint = service.URI
      let opLocalID = service.LocalID
      return [opEndpoint, opLocalID]
    }
  }

  throw new Error('Could not find a compatible service')
}
