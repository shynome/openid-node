import url from 'url'
import { TrimSpace } from './utils'

export function Normalize(id: string): string {
  id = TrimSpace(id)
  if (id.length === 0) {
    throw new Error('No id provided')
  }

  // 7.2 from openID 2.0 spec.

  //If the user's input starts with the "xri://" prefix, it MUST be
  //stripped off, so that XRIs are used in the canonical form.
  if (id.startsWith('xri://')) {
    id = id.slice(6)
    throw new Error('XRI identifiers not supported')
  }

  // If the first character of the resulting string is an XRI
  // Global Context Symbol ("=", "@", "+", "$", "!") or "(", as
  // defined in Section 2.2.1 of [XRI_Syntax_2.0], then the input
  // SHOULD be treated as an XRI.
  if ('=@+$!('.indexOf(id[0]) !== -1) {
    throw new Error('XRI identifiers not supported')
  }

  // Otherwise, the input SHOULD be treated as an http URL; if it
  // does not include a "http" or "https" scheme, the Identifier
  // MUST be prefixed with the string "http://". If the URL
  // contains a fragment part, it MUST be stripped off together
  // with the fragment delimiter character "#". See Section 11.5.2 for
  // more information.
  if (!id.startsWith('http://') && !id.startsWith('https://')) {
    id = 'http://' + id
  }
  const fragmentIndex = id.indexOf('#')
  if (fragmentIndex != -1) {
    id = id.slice(0, fragmentIndex)
  }
  const u = url.parse(id)
  if (u.host === '') {
    throw new Error('Invalid address provided as id')
  }
  if (u.path === '') {
    u.path = '/'
  }
  id = url.format(u)
  return id
}
