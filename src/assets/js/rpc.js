import md5 from 'js-md5'

function ajaxGet (url) {
  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest()
    req.open('GET', url)
    req.onload = () => {
      if (req.status === 200) {
        resolve(req.response)
      } else {
        reject(new RPCError(req.statusText))
      }
    }

    req.onerror = () => {
      reject(new RPCError('Network error'))
    }

    req.send()
  })
}

function ajaxPost (url, data) {
  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest()
    req.open('POST', url)
    req.onload = () => {
      if (req.status === 200) {
        resolve(req.response)
      } else {
        reject(new RPCError(req.statusText))
      }
    }

    req.onerror = () => {
      reject(new RPCError('Network Error'))
    }

    req.send(data)
  })
}
class RPCError {
  constructor (msg, code) {
    this.message = msg
    this.code = code || -1
  }

  toString (t) {
    return t('RPC Error: {0}', [t(this.message)]) + (this.code === -1 ? '' : ' (' + this.code + ')')
  }
}
class JsonRPC {
  constructor (endpoint, secret, uri) {
    this.endpoint = endpoint
    this.secret = secret
    this.uri = uri || '/jsonrpc'
  }

  call (cmd, resolve, reject, args, kwargs) {
    if (!this.endpoint) return reject(new RPCError('Endpoint not set'))
    var payload = {
      jsonrpc: '2.0',
      method: 'xeH.' + cmd,
      id: '' + Date.now(),
      params: [args || [], kwargs || {}]
    }
    if (this.secret) {
      payload.params[0].splice(0, 0, this.secret)
    }
    ajaxPost(this.endpoint + this.uri, JSON.stringify(payload))
      .then(JSON.parse)
      .then((r) => {
        if (r.error) reject(r.error)
        else resolve(r.result)
      })
      .catch((e) => {
        reject(e)
      })
  }

  getSign (uri) {
    let secret = ''
    if (this.secret) {
      secret = this.secret.match(/token:(.+)/)[1] || ''
    }
    return md5(secret + '-xehentai-' + uri).substr(0, 8)
  }

  download () {
    ajaxGet('')
  }
}

export {
  JsonRPC as
  default
}
