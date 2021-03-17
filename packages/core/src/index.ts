interface GetParamsObject {
  [key: string]: string | string[]
}

interface ErrorHandlers {
  handlerError?: (response?: Response) => void
  handler401?: (response?: Response) => void
  handler403?: (response?: Response) => void
}

export interface FetchlerOptions extends ErrorHandlers {
  baseUrl?: string
  token?: string | null
  tokenType?: string
  customHeaders?: Headers
  defaultInitOptions?: RequestInit
}

export type FetchlerResponse = Response | string | boolean | object

export default class Fetchler {
  errorHandlers: ErrorHandlers
  headers: Headers
  customHeaderName?: string
  defaultInitOpts?: RequestInit
  baseUrl: string

  constructor(opts?: FetchlerOptions) {
    this.baseUrl = opts.baseUrl ?? ''

    this.headers = new Headers()

    if (opts.token) {
      this.tokenSetter(opts.token, opts.tokenType)
    }

    if (opts.customHeaders) {
      for (const [key, val] of opts.customHeaders.entries()) {
        this.headers.set(key, val)
      }
    }

    if (opts.defaultInitOptions) {
      this.defaultInitOpts = opts.defaultInitOptions
    }

    this.errorHandlers = {}

    if (opts.handlerError) {
      this.errorHandlers.handlerError = opts.handlerError
    }

    if (opts.handler401) {
      this.errorHandlers.handler401 = opts.handler401
    }

    if (opts.handler403) {
      this.errorHandlers.handler403 = opts.handler403
    }
  }

  private tokenSetter(token: string | null, tokenType?: string) {
    if (token === null) {
      this.headers.delete('Authorization')
    }

    const authStr =
      tokenType && tokenType.length > 0 ? `${tokenType} ${token}` : token

    this.headers.set('Authorization', authStr)
  }

  private async fetchIt<T extends FetchlerResponse>(
    url: string,
    init: RequestInit,
    disableAuth: boolean
  ): Promise<T> {
    const headersClone = new Headers(this.headers)

    if (disableAuth && headersClone.has('Authorization')) {
      headersClone.delete('Authorization')
    }

    const headers = new Headers(headersClone)

    if (!!init.headers) {
      const initHeaders = new Headers(init.headers)

      for (const [key, val] of initHeaders.entries()) {
        headers.append(key, val)
      }
    }

    if (
      !headers.has('Content-Type') &&
      init.method !== 'GET' &&
      init.method !== 'HEAD'
    ) {
      headers.set(
        'Content-Type',
        init.body instanceof FormData
          ? 'multipart/form-data'
          : 'application/json'
      )
    }

    const res = await fetch(url, { ...init, headers })

    if (!res.ok) {
      if (res.status === 401 && this.errorHandlers.handler401) {
        this.errorHandlers.handler401(res)
        return
      } else if (res.status === 403 && this.errorHandlers.handler403) {
        this.errorHandlers.handler403(res)
        return
      } else if (this.errorHandlers.handlerError) {
        this.errorHandlers.handlerError(res)
        return
      } else {
        throw new Error(`Fetch Error: ${res.status}`)
      }
    }

    if (res.status === 204) {
      return true as T
    }

    if (res.headers.get('Content-Type')?.includes('json')) {
      return res.json() as Promise<T>
    } else if (res.headers.get('Content-Type')?.includes('text')) {
      return res.text() as Promise<T>
    } else {
      return res as T
    }
  }

  clearToken() {
    this.tokenSetter(null)
  }

  updateToken(token: string | null, tokenType: string = 'Bearer') {
    if (token === null) {
      this.tokenSetter(null)
      return
    } else if (!this.headers.has('Authorization')) {
      this.tokenSetter(token, tokenType)
      return
    }

    const authHeader = this.headers.get('Authorization')
    const tokenArr = authHeader ? authHeader.split(' ') : []

    if (tokenArr.length > 1) {
      const newType = tokenArr[0] !== tokenType ? tokenType : tokenArr[0]
      this.tokenSetter(token, newType)
    } else {
      this.tokenSetter(token, tokenType)
    }
  }

  updateHeader(key: string, value: string) {
    this.headers.set(key, value)
  }

  removeHeader(key: string) {
    this.headers.delete(key)
  }

  updateDefaultHandler(
    type: '401' | 401 | '403' | 403 | 'error',
    handler: (res?: Response) => void
  ) {
    const key: 'handler401' | 'handler403' | 'handlerError' =
      type === 'error'
        ? 'handlerError'
        : (`handler${type}` as 'handler401' | 'handler403')

    this.errorHandlers[key] = handler
  }

  get<T extends FetchlerResponse>(
    url: string,
    params: GetParamsObject | string = '',
    init: RequestInit = {},
    disableAuth?: boolean
  ) {
    let fetchUrl = null

    if (params === '') {
      fetchUrl = `${url}`
    } else if (typeof params === 'string') {
      fetchUrl = params.startsWith('?')
        ? `${fetchUrl}${params}`
        : `${fetchUrl}?${params}`
    } else {
      const paramArr: string[] = Object.entries(params).map(([key, val]) =>
        Array.isArray(val) ? `${key}=${val.join(',')}` : `${key}=${val}`
      )

      fetchUrl = `${url}?${paramArr.join('&')}`
    }

    return this.fetchIt<T>(
      fetchUrl,
      { ...this.defaultInitOpts, ...init, method: 'GET' },
      !!disableAuth
    )
  }

  head(
    url: string,
    params: GetParamsObject | string,
    init?: RequestInit,
    disableAuth?: boolean
  ) {
    let fetchUrl = null

    if (params === '') {
      fetchUrl = `${url}`
    } else if (typeof params === 'string') {
      fetchUrl = params.startsWith('?')
        ? `${fetchUrl}${params}`
        : `${fetchUrl}?${params}`
    } else {
      const paramArr: string[] = Object.entries(params).map(([key, val]) =>
        Array.isArray(val) ? `${key}=${val.join(',')}` : `${key}=${val}`
      )

      fetchUrl = `${url}?${paramArr.join('&')}`
    }

    return this.fetchIt<boolean>(
      url,
      { ...this.defaultInitOpts, ...init, method: 'HEAD' },
      !!disableAuth
    )
  }

  post<T extends FetchlerResponse>(
    url: string,
    params: object | string | FormData,
    init?: RequestInit,
    disableAuth?: boolean
  ) {
    const body =
      typeof params === 'object' && !(params instanceof FormData)
        ? JSON.stringify(params)
        : params

    return this.fetchIt<T>(
      url,
      { ...this.defaultInitOpts, ...init, method: 'POST', body },
      !!disableAuth
    )
  }

  put<T extends FetchlerResponse>(
    url: string,
    params: object | string | FormData,
    init?: RequestInit,
    disableAuth?: boolean
  ) {
    const body =
      typeof params === 'object' && !(params instanceof FormData)
        ? JSON.stringify(params)
        : params

    return this.fetchIt<T>(
      url,
      { ...this.defaultInitOpts, ...init, method: 'PUT', body },
      !!disableAuth
    )
  }

  del<T extends FetchlerResponse>(
    url: string,
    params?: object | string | FormData,
    init?: RequestInit,
    disableAuth?: boolean
  ) {
    return this.delete<T>(url, params, init, disableAuth)
  }

  delete<T extends FetchlerResponse>(
    url: string,
    params?: object | string | FormData,
    init?: RequestInit,
    disableAuth?: boolean
  ) {
    const body =
      typeof params === 'object' && !(params instanceof FormData)
        ? JSON.stringify(params)
        : params

    return this.fetchIt<T>(
      url,
      { ...this.defaultInitOpts, ...init, method: 'DELETE', body },
      !!disableAuth
    )
  }
}
