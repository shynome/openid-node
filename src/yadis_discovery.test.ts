import { findMetaXrdsLocation } from './yadis_discovery'

function searchMeta(doc: string, loc: string, err: boolean) {
  try {
    let r = findMetaXrdsLocation(doc)
    expect(r).toEqual(loc)
  } catch (e) {
    expect(!!e).toEqual(err)
  }
}

describe('yadis_discovery', () => {
  it('FindMetaXrdsLocation', () => {
    searchMeta(
      `
    <html>
      <head>
        <meta http-equiv="X-XRDS-Location" content="foo.com">
    `,
      'foo.com',
      false,
    )
    searchMeta(
      `
    <html>
      <head>
        <meta http-equiv="other" content="blah.com">
        <meta http-equiv="X-XRDS-Location" content="foo.com">
    `,
      'foo.com',
      false,
    )
  })
  it('MetaXrdsLocationOutsideHead', () => {
    searchMeta(
      `
    <html>
      <meta http-equiv="X-XRDS-Location" content="foo.com">
    `,
      '',
      true,
    )
    searchMeta(
      `
    <html>
      <head></head>
      <meta http-equiv="X-XRDS-Location" content="foo.com">
    `,
      '',
      true,
    )
  })
  it('NoMetaXrdsLocation', () => {
    searchMeta(
      `
    <html><head>
      <meta http-equiv="bad-tag" content="foo.com">
    `,
      '',
      true,
    )
  })
})
