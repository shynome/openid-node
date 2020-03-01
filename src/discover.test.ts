import { testInstance } from './fake_getter.test'

async function expectOpIDErr(
  uri: string,
  exOpEndpoint: string,
  exOpLocalID: string,
  exClaimedID: string,
  exErr: boolean,
) {
  try {
    const d = await testInstance.Discover(uri)
    expect(d.OpEndpoint).toEqual(exOpEndpoint)
    expect(d.OpLocalID).toEqual(exOpLocalID)
    expect(d.ClaimedID).toEqual(exClaimedID)
  } catch (e) {
    expect(!!e).toEqual(exErr)
  }
}

describe('discover', () => {
  it('DiscoverWithYadis', async () => {
    // They all redirect to the same XRDS document
    await expectOpIDErr('example.com/xrds', 'foo', 'bar', '', false)
    await expectOpIDErr('http://example.com/xrds', 'foo', 'bar', '', false)
    await expectOpIDErr('http://example.com/xrds-loc', 'foo', 'bar', '', false)
    await expectOpIDErr('http://example.com/xrds-meta', 'foo', 'bar', '', false)
  })
  it('DiscoverWithHtml', async () => {
    // Yadis discovery will fail, and fall back to html.
    await expectOpIDErr(
      'http://example.com/html',
      'example.com/openid',
      'bar-name',
      'http://example.com/html',
      false,
    )
    // The first url redirects to a different URL. The redirected-to
    // url should be used as claimedID.
    await expectOpIDErr(
      'http://example.com/html-redirect',
      'example.com/openid',
      'bar-name',
      'http://example.com/html',
      false,
    )

    await expectOpIDErr(
      'http://example.com/html-multi-rel',
      'http://www.livejournal.com/openid/server.bml',
      'http://exampleuser.livejournal.com/',
      'http://example.com/html-multi-rel',
      false,
    )
  })
  it('DiscoverBadUrl', async () => {
    await expectOpIDErr('http://example.com/404', '', '', '', true)
  })
})
