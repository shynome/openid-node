import { Normalize } from './normalizer'

describe('normalizer', () => {
  it('Normalize', () => {
    function doNormalize(idIn: string, idOut: string, pass: boolean) {
      let result: boolean
      try {
        result = Normalize(idIn) === idOut
      } catch (e) {
        result = false
      }
      expect(result).toEqual(pass)
    }
    // OpenID 2.0 spec Appendix A.1. Normalization
    doNormalize('example.com', 'http://example.com/', true)
    doNormalize('http://example.com', 'http://example.com/', true)
    doNormalize('https://example.com/', 'https://example.com/', true)
    doNormalize('http://example.com/user', 'http://example.com/user', true)
    doNormalize('http://example.com/user/', 'http://example.com/user/', true)
    doNormalize('http://example.com/', 'http://example.com/', true)
    doNormalize('=example', '=example', false) // XRI not supported
    doNormalize('(=example)', '(=example)', false) // XRI not supported
    doNormalize('xri://=example', '=example', false) // XRI not supported

    // Empty
    doNormalize('', '', false)
    doNormalize(' ', '', false)
    doNormalize('	', '', false)
    doNormalize('xri://', '', false)
    doNormalize('http://', '', false)
    doNormalize('https://', '', false)

    // Padded with spacing
    doNormalize(' example.com  ', 'http://example.com/', true)
    doNormalize(' 	http://example.com		 ', 'http://example.com/', true)

    // XRI not supported
    doNormalize('xri://asdf', 'asdf', false)
    doNormalize('=asdf', '=asdf', false)
    doNormalize('@asdf', '@asdf', false)

    // HTTP
    doNormalize('foo.com', 'http://foo.com/', true)
    doNormalize('http://foo.com', 'http://foo.com/', true)
    doNormalize('https://foo.com', 'https://foo.com/', true)

    // Fragment need to be removed
    doNormalize('http://foo.com#bar', 'http://foo.com/', true)
    doNormalize('http://foo.com/page#bar', 'http://foo.com/page', true)
  })
})
