import { SimpleDiscoveryCache, DiscoveredInfo } from './discovery_cache'

describe('discovery_cache', () => {
  it('SimpleDiscoveryCache', async () => {
    const dc = new SimpleDiscoveryCache()

    // Put some initial values
    dc.put('foo', { OpEndpoint: 'a', OpLocalID: 'b', ClaimedID: 'c' })

    let di = await dc.get('foo')
    expect(di).toBeDefined()
    expect(di).toStrictEqual({
      OpEndpoint: 'a',
      OpLocalID: 'b',
      ClaimedID: 'c',
    } as DiscoveredInfo)
    // Attempt to get a non-existent value
    di = await dc.get('bar')
    expect(di).toBeUndefined()
  })
})
