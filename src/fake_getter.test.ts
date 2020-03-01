import { httpGetter, Response } from './getter'
import { parseResponse } from 'http-string-parser'
import { OpenID } from './openid'

class TestGetter implements httpGetter {
  constructor(
    public urls: { [k: string]: string } = {},
    public redirects: { [k: string]: string } = {},
  ) {}
  async Get(uri: string, headers: { [k: string]: string }): Promise<Response> {
    let key = uri
    for (let k in headers) {
      key += '#' + k + '#' + headers[k]
    }
    let doc = this.urls[key]
    if (typeof doc === 'string') {
      const resp = parseResponse(doc)
      let headers: { [k: string]: string } = {}
      for (let k in resp.headers) {
        headers[k.toLowerCase()] = resp.headers[k]
      }
      return {
        data: resp.body,
        headers: headers,
        request: { url: uri },
      }
    }
    uri = this.redirects[key]
    if (typeof uri === 'string') {
      return this.Get(uri, headers)
    }
    throw new Error('404 not found')
  }
  async Post(uri: string, headers: { [k: string]: string }): Promise<Response> {
    return this.Get('POST@' + uri, {})
  }
}

const testGetter = new TestGetter()
export const testInstance = new OpenID(testGetter)

// === For Yadis discovery ==================================
// Directly reffers a valid XRDS document
testGetter.urls[
  'http://example.com/xrds#Accept#application/xrds+xml'
] = `HTTP/1.0 200 OK
Content-Type: application/xrds+xml; charset=UTF-8

<?xml version="1.0" encoding="UTF-8"?>
<xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)"
xmlns:openid="http://openid.net/xmlns/1.0">
  <XRD>
    <Service xmlns="xri://$xrd*($v*2.0)">
      <Type>http://specs.openid.net/auth/2.0/signon</Type>
      <URI>foo</URI>
      <LocalID>bar</LocalID>
    </Service>
  </XRD>
</xrds:XRDS>`

// Uses a X-XRDS-Location header to redirect to the valid XRDS document.
testGetter.urls[
  'http://example.com/xrds-loc#Accept#application/xrds+xml'
] = `HTTP/1.0 200 OK
X-XRDS-Location: http://example.com/xrds

nothing interesting here`

// Html document, with meta tag X-XRDS-Location. Points to the
// previous valid XRDS document.
testGetter.urls[
  'http://example.com/xrds-meta#Accept#application/xrds+xml'
] = `HTTP/1.0 200 OK
Content-Type: text/html

<html>
<head>
<meta http-equiv="X-XRDS-Location" content="http://example.com/xrds">`

// === For HTML discovery ===================================
testGetter.urls['http://example.com/html'] = `HTTP/1.0 200 OK

<html>
<head>
<link rel="openid2.provider" href="example.com/openid">
<link rel="openid2.local_id" href="bar-name">`

testGetter.redirects['http://example.com/html-redirect'] =
  'http://example.com/html'

testGetter.urls['http://example.com/html-multi-rel'] = `HTTP/1.0 200 OK
Content-Type: text/html

<html>
<head>
<link rel="openid2.provider openid.server"
	  href="http://www.livejournal.com/openid/server.bml">
<link rel="openid2.local_id openid.delegate"
      href="http://exampleuser.livejournal.com/">`

describe('fake_getter', () => {
  it('testInstance', () => {
    expect(testInstance).toBeDefined()
  })
})
