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
