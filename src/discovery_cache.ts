export interface DiscoveredInfo {
  OpEndpoint: string
  OpLocalID: string
  ClaimedID: string
  // ProtocolVersion: it's always openId 2.
}

export interface DiscoveryCache {
  put(id: string, info: DiscoveredInfo): Promise<void>
  /**Return a discovered info, or nil. */
  get(id: string): Promise<DiscoveredInfo | undefined>
}

export class SimpleDiscoveryCache implements DiscoveryCache {
  private store = new Map<string, DiscoveredInfo>()
  async put(id: string, info: DiscoveredInfo) {
    this.store.set(id, info)
  }
  async get(id: string) {
    return this.store.get(id)
  }
}

export function compareDiscoveredInfo(
  a: DiscoveredInfo,
  opEndpoint: string,
  opLocalID: string,
  claimedID: string,
) {
  return (
    typeof a !== 'undefined' &&
    a.OpEndpoint === opEndpoint &&
    a.OpLocalID === opLocalID &&
    a.ClaimedID === claimedID
  )
}
