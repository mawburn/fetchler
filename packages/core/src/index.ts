interface ErrorHandlers {
  errorHandler?: (response: Response) => void
  handler401?: () => void
  handler403?: () => void
}

export interface FetchlerOptions extends ErrorHandlers {
  customHeaders?: Headers
}

export default class Fetchler {
  headers: Headers
  token: string | null = null
  customHeaderName?: string
  errorHandlers: ErrorHandlers

  constructor(
    token: string | null = null,
    tokenType: string = 'Bearer',
    opts: FetchlerOptions
  ) {
    this.headers = new Headers()

    if (token) {
      this.tokenSetter(token, tokenType)

      this.headers.set('Authorization', token)
    }

    if (opts.customHeaders) {
      for (const [key, val] of opts.customHeaders.entries()) {
        this.headers.set(key, val)
      }
    }

    this.errorHandlers = {}

    if (opts.errorHandler) {
      this.errorHandlers.errorHandler = opts.errorHandler
    }

    if (opts.handler401) {
      this.errorHandlers.handler401 = opts.handler401
    }

    if (opts.handler403) {
      this.errorHandlers.handler403 = opts.handler403
    }
  }

  private tokenSetter(token: string, tokenType?: string) {
    this.token =
      tokenType && tokenType.length > 0 ? `${tokenType} ${token}` : token
  }

  private async fetchIt(url: string, init: RequestInit) {
    return fetch(url, init).then((res) => {
      if (!res.ok) {
        if (res.status === 401 && this.errorHandlers.handler401) {
          return this.errorHandlers.handler401()
        } else if (res.status === 403 && this.errorHandlers.handler403) {
          return this.errorHandlers.handler403()
        } else if (this.errorHandlers.errorHandler) {
          return this.errorHandlers.errorHandler(res)
        } else {
          throw new Error(`Error in fetch request: ${res.status}`)
        }
      }

      if (res.status === 204) {
        return
      }
    })
  }

  updateToken(token: string, tokenType?: string) {
    const tokenArr = this.token ? this.token.split(' ') : []

    if (tokenArr.length > 1) {
      const newType = tokenArr[0] !== tokenType ? tokenType : tokenArr[0]
      this.tokenSetter(token, newType)
    } else {
      this.tokenSetter(token, tokenType)
    }
  }

  get(url: string, params: object | string, init?: RequestInit) {}

  head(url: string, params: object | string, init?: RequestInit) {}

  post(url: string, params: object | string, init?: RequestInit) {}

  put(url: string, params: object | string, init?: RequestInit) {}

  del(url: string, params: object | string, init?: RequestInit) {
    return this.delete(url, params, init)
  }

  delete(url: string, params: object | string, init?: RequestInit) {}
}
