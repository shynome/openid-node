// @ts-check

const Hapi = require('@hapi/hapi')
const { OpenID, SimpleDiscoveryCache, SimpleNonceStore } = require('../lib')

const nonceStore = new SimpleNonceStore()
const discoveryCache = new SimpleDiscoveryCache()
// @ts-ignore
const openid = new OpenID()

const server = new Hapi.Server({
  port: 8080,
  debug: {
    request: ['error'],
  },
})

server.route({
  path: '/',
  method: ['GET'],
  handler: req => {
    return `
    <html>
      <head>
        <title>go OpenID sample app</title>
      </head>
      <body>
        <h1>go OpenID sample app</h1>
        <a href="/login">Login</a>
      </body>
    </html>
    `
  },
})

server.route({
  path: '/login',
  method: ['GET'],
  handler: req => {
    return `
    <html>
    <head>
      <title>go OpenID sample app</title>
      <script>
      function setId(id) {
        document.forms[0].id.value = id;
        document.forms[0].submit();
        return false;
      }
      </script>
    </head>
    <body>
      <h1>Login</h1>

      <form action="/discover" method="POST">
        <input type="hidden" name="id">
      </form>

      <h2>Sign in with:</h2>
      <ul>
        <li>
          <button onclick="return setId('https://me.yahoo.com')">
            Yahoo!
          </button>
        </li>
        <li>
          <button onclick="return setId('http://steamcommunity.com/openid')">
            Steam
          </button>
        </li>
        <li>
          <!-- 
            OpenID 2.0 Spec point 7.1 http://openid.net/specs/openid-authentication-2_0.html#initiation
            
            Browser extensions or other software that support OpenID Authentication
            can detect an OpenID input field if it has the "name" attribute set to "openid_identifier"
          -->
          <input type="text" id="idfield" name="openid_identifier">
          <button onclick="return setId(document.getElementById('idfield').value);">
            Go
          </button>
        </li>
      </ul>
    </body>
  </html>
    `
  },
})

server.route({
  path: '/discover',
  method: ['POST', 'GET'],
  handler: async (req, h) => {
    let url = await openid.RedirectURL(
      req.payload['id'],
      'http://localhost:8080/openidcallback',
      'http://localhost:8080/',
    )
    return h
      .response()
      .code(303)
      .redirect(url)
  },
})

server.route({
  path: '/openidcallback',
  method: ['GET'],
  handler: async req => {
    let fullUrl = req.url.toString()
    let id = await openid.Verify(fullUrl, discoveryCache, nonceStore)
    return `
    <html>
      <head>
        <title>go OpenID sample app</title>
      </head>
      <body>
        <h1>go OpenID sample app</h1>
        <p>Welcome ${id}.</p>
        <p>Devs: set a cookie, or this kind of things to
          identify the user across different pages.</p>
      </body>
    </html>
    `
  },
})

server.start()
