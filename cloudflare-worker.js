// Cloudflare Worker to proxy HTTPS requests to HTTP API on port 8080
// Deploy this at: Workers & Pages > Create Worker

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Get the URL from the request
  const url = new URL(request.url)

  // Replace the hostname and add port 8080
  const apiUrl = `http://he-api-dev-eus2.eastus2.azurecontainer.io:8080${url.pathname}${url.search}`

  // Clone the request headers
  const headers = new Headers(request.headers)
  headers.set('Host', 'he-api-dev-eus2.eastus2.azurecontainer.io')

  // Make the request to the origin API
  const modifiedRequest = new Request(apiUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
  })

  try {
    const response = await fetch(modifiedRequest)

    // Clone the response and add CORS headers
    const modifiedResponse = new Response(response.body, response)
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-key')

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-key',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    return modifiedResponse
  } catch (error) {
    return new Response(`Error connecting to API: ${error.message}`, {
      status: 502,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}
