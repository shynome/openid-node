import { BuildRedirectURL } from './redirect'
import { compareQueryParams } from './verify'
import url from 'url'
import { testInstance } from './fake_getter.test'

describe('redirect', () => {
  it('BuildRedirectURL', () => {
    expectURL(
      'https://endpoint/a',
      'opLocalId',
      'claimedId',
      'returnTo',
      'realm',
      'https://endpoint/a?' +
        'openid.ns=http://specs.openid.net/auth/2.0' +
        '&openid.mode=checkid_setup' +
        '&openid.return_to=returnTo' +
        '&openid.claimed_id=claimedId' +
        '&openid.identity=opLocalId' +
        '&openid.realm=realm',
    )
    // No realm.
    expectURL(
      'https://endpoint/a',
      'opLocalId',
      'claimedId',
      'returnTo',
      '',
      'https://endpoint/a?' +
        'openid.ns=http://specs.openid.net/auth/2.0' +
        '&openid.mode=checkid_setup' +
        '&openid.return_to=returnTo' +
        '&openid.claimed_id=claimedId' +
        '&openid.identity=opLocalId',
    )
    // No realm, no localId
    expectURL(
      'https://endpoint/a',
      '',
      'claimedId',
      'returnTo',
      '',
      'https://endpoint/a?' +
        'openid.ns=http://specs.openid.net/auth/2.0' +
        '&openid.mode=checkid_setup' +
        '&openid.return_to=returnTo' +
        '&openid.claimed_id=claimedId' +
        '&openid.identity=claimedId',
    )
    // No realm, no claimedId
    expectURL(
      'https://endpoint/a',
      'opLocalId',
      '',
      'returnTo',
      '',
      'https://endpoint/a?' +
        'openid.ns=http://specs.openid.net/auth/2.0' +
        '&openid.mode=checkid_setup' +
        '&openid.return_to=returnTo' +
        '&openid.claimed_id=' +
        'http://specs.openid.net/auth/2.0/identifier_select' +
        '&openid.identity=' +
        'http://specs.openid.net/auth/2.0/identifier_select',
    )
  })
  it('RedirectWithDiscovery', async () => {
    const expected =
      'foo?' +
      'openid.ns=http://specs.openid.net/auth/2.0' +
      '&openid.mode=checkid_setup' +
      '&openid.return_to=mysite/cb' +
      '&openid.claimed_id=' +
      'http://specs.openid.net/auth/2.0/identifier_select' +
      '&openid.identity=' +
      'http://specs.openid.net/auth/2.0/identifier_select'

    // They all redirect to the same XRDS document
    await expectRedirect(
      'http://example.com/xrds',
      'mysite/cb',
      '',
      expected,
      false,
    )
    await expectRedirect(
      'http://example.com/xrds-loc',
      'mysite/cb',
      '',
      expected,
      false,
    )
    await expectRedirect(
      'http://example.com/xrds-meta',
      'mysite/cb',
      '',
      expected,
      false,
    )
  })
})

function expectURL(
  opEndpoint: string,
  opLocalID: string,
  claimedID: string,
  returnTo: string,
  realm: string,
  expected: string,
) {
  const u = BuildRedirectURL(opEndpoint, opLocalID, claimedID, returnTo, realm)
  compareUrls(u, expected)
}

async function expectRedirect(
  uri: string,
  callback: string,
  realm: string,
  exRedirect: string,
  exErr: boolean,
) {
  try {
    const redirect = await testInstance.RedirectURL(uri, callback, realm)
    compareUrls(redirect, exRedirect)
  } catch (e) {
    expect(!!e).toEqual(exErr)
  }
}

function compareUrls(url1: string, expected: string) {
  const p1 = url.parse(url1, true)
  const p2 = url.parse(expected, true)
  if (
    p1.protocol != p2.protocol ||
    p1.host != p2.host ||
    (p1.path != null && decodeURIComponent(p1.path) != p2.path)
  ) {
    throw new Error(`URLs don't match: ${url1} vs ${expected}`)
  }
  const q1 = p1.query
  const q2 = p2.query
  compareQueryParams(q1, q2)
}
