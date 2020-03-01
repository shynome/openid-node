import cheerio from 'cheerio'
import { isEmptyString } from './utils'
import { httpGetter } from './getter'
import { DiscoveredInfo } from './discovery_cache'

export async function htmlDiscovery(
  id: string,
  getter: httpGetter,
): Promise<DiscoveredInfo> {
  const resp = await getter.Get(id, {})
  const d = findProviderFromHeadLink(resp.data)
  return {
    ...d,
    ClaimedID: resp.request.url as string,
  }
}

export function findProviderFromHeadLink(
  input: string,
): Pick<DiscoveredInfo, 'OpEndpoint' | 'OpLocalID'> {
  const $ = cheerio.load(input)

  const opEndpoint = $(`head>link[rel~='openid2.provider']`).attr('href') || ''
  if (isEmptyString(opEndpoint)) {
    throw new Error('LINK with rel=openid2.provider not found')
  }

  const opLocalID = $(`head>link[rel~='openid2.local_id']`).attr('href') || ''

  return {
    OpEndpoint: opEndpoint,
    OpLocalID: opLocalID,
  }
}
