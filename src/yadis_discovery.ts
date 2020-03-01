import cheerio from 'cheerio'
import { isEmptyString } from './utils'
import { httpGetter } from './getter'
import { parseXrds } from './xrds'

const yadisHeaders = {
  Accept: 'application/xrds+xml',
}

export async function yadisDiscovery(id: string, getter: httpGetter) {
  // Section 6.2.4 of Yadis 1.0 specifications.
  // The Yadis Protocol is initiated by the Relying Party Agent
  // with an initial HTTP request using the Yadis URL.

  // This request MUST be either a GET or a HEAD request.

  // A GET or HEAD request MAY include an HTTP Accept
  // request-header (HTTP 14.1) specifying MIME media type,
  // application/xrds+xml.
  const resp = await getter.Get(id, yadisHeaders)

  // Section 6.2.5 from Yadis 1.0 spec: Response

  const contentType: string = resp.headers['Content-Type']

  // The response MUST be one of:
  // (see 6.2.6 for precedence)
  let l = resp.headers['X-XRDS-Location'] || ''
  if (l !== '') {
    // 2. HTTP response-headers that include an X-XRDS-Location
    // response-header, together with a document
    return getYadisResourceDescriptor(l, getter)
  } else if (contentType.includes('text/html')) {
    // 1. An HTML document with a <head> element that includes a
    // <meta> element with http-equiv attribute, X-XRDS-Location,

    const metaContent = findMetaXrdsLocation(resp.data)
    return getYadisResourceDescriptor(metaContent, getter)
  } else if (contentType.includes('application/xrds+xml')) {
    // 4. A document of MIME media type, application/xrds+xml.
    return parseXrds(resp.data)
  }
  // 3. HTTP response-headers only, which MAY include an
  // X-XRDS-Location response-header, a content-type
  // response-header specifying MIME media type,
  // application/xrds+xml, or both.
  //   (this is handled by one of the 2 previous if statements)
  throw new Error('No expected header, or content type')
}

// Similar as above, but we expect an absolute Yadis document URL.
export async function getYadisResourceDescriptor(
  id: string,
  getter: httpGetter,
) {
  const resp = await getter.Get(id, yadisHeaders)
  return parseXrds(resp.data)
}

// Search for
// <head>
//    <meta http-equiv="X-XRDS-Location" content="....">
export function findMetaXrdsLocation(input: string) {
  const $ = cheerio.load(input)
  const location = $(`head>meta[http-equiv~='X-XRDS-Location']`).attr('content')
  if (typeof location === 'undefined' || isEmptyString(location)) {
    throw new Error('Meta X-XRDS-Location not found')
  }
  return location
}
