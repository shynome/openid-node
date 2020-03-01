export interface Response {
  [k: string]: any
  data: string
  headers: { [k: string]: string }
  request: { url: string }
}

export interface httpGetter {
  Get(uri: string, headers: { [k: string]: string }): Promise<Response>
  Post(uri: string, form: { [k: string]: string }): Promise<Response>
}

import qs from 'querystring'
export class AxiosHttpGetter implements httpGetter {
  public client: import('axios').AxiosInstance
  constructor() {
    this.client = require('axios')
  }
  async Get(uri: string, headers: { [k: string]: string }) {
    const resp = await this.client.get<string>(uri, { headers })
    return {
      data: resp.data,
      headers: resp.headers,
      request: { url: resp.config.url as string },
    }
  }
  async Post(uri: string, form: { [k: string]: string }) {
    const resp = await this.client.post<string>(uri, qs.stringify(form))
    return {
      data: resp.data,
      headers: resp.headers,
      request: { url: resp.config.url as string },
    }
  }
}
