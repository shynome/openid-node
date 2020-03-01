import { findProviderFromHeadLink } from './html_discovery'

describe('html_discovery', () => {
  it('FindEndpointFromLink', () => {
    searchLink(
      `
    <html>
      <head>
        <link rel="openid2.provider" href="example.com/openid">
    `,
      'example.com/openid',
      '',
      false,
    )
    searchLink(
      `
    <html>
      <head>
        <link rel="openid2.provider" href="foo.com">
        <link rel="openid2.local_id" href="bar-name">
      </head>
    </html>
    `,
      'foo.com',
      'bar-name',
      false,
    )
    // Self-closing link
    searchLink(
      `
    <html>
      <head>
        <link rel="openid2.provider" href="selfclose.com" />
        <link rel="openid2.local_id" href="selfclose-name" />
      </head>
    </html>
    `,
      'selfclose.com',
      'selfclose-name',
      false,
    )
  })
  it('NoEndpointFromLink', () => {
    searchLink(
      `
    <html>
      <head>
        <link rel="openid2.provider">
    `,
      '',
      '',
      true,
    )
    // Outside of head.
    searchLink(
      `
    <html>
      <head></head>
      <link rel="openid2.provider" href="example.com/openid">
    `,
      '',
      '',
      true,
    )
  })
})

function searchLink(
  doc: string,
  opEndpoint: string,
  claimedID: string,
  err: boolean,
) {
  try {
    const d = findProviderFromHeadLink(doc)
    expect(d.OpEndpoint).toEqual(opEndpoint)
    expect(d.OpLocalID).toEqual(claimedID)
  } catch (e) {
    expect(!!e).toEqual(err)
  }
}
