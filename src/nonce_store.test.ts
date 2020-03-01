import { SimpleNonceStore, toISOString } from './nonce_store'

describe('nonce_store', () => {
  it('SimpleNonceStore', async () => {
    const maxNonceAge = 60e3
    const now = Date.now()
    /**30 seconds ago */
    const now30s = now - 30e3
    /**2 minutes ago */
    const now2m = now - 2 * 60e3

    const now30sStr = toISOString(new Date(now30s))
    const now2mStr = toISOString(new Date(now2m))

    const ns = new SimpleNonceStore()

    async function accept(op: string, nonce: string) {
      const r = await ns.Accept(op, nonce).then(() => true)
      expect(r).toEqual(true)
    }
    async function reject(op: string, nonce: string) {
      const r = await ns.Accept(op, nonce).then(
        () => true,
        () => false,
      )
      expect(r).toEqual(false)
    }

    await reject('1', 'foo') // invalid nonce
    await reject('1', 'fooBarBazLongerThan20Chars') // invalid nonce

    await accept('1', now30sStr + 'asd')
    await reject('1', now30sStr + 'asd') // same nonce
    await accept('1', now30sStr + 'xxx') // different nonce
    await reject('1', now30sStr + 'xxx') // different nonce again to verify storage of multiple nonces per endpoint
    await accept('2', now30sStr + 'asd') // different endpoint

    await reject('1', now2mStr + 'old') // too old
    await reject('3', now2mStr + 'old') // too old
  })
})
