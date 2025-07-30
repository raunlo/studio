
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL;

if (!privateApiBaseUrl) {
  throw new Error('PRIVATE_API_BASE_URL is not set in environment variables');
}

// Instantiate the auth client once outside the handler
const auth = new GoogleAuth();
let client: ReturnType<typeof auth.getIdTokenClient> | null = null;

async function getAuthenticatedClient() {
  if (client) {
    return client;
  }
  try {
    console.log(`Authenticating for audience: ${privateApiBaseUrl}`);
    client = await auth.getIdTokenClient(privateApiBaseUrl);
    console.log('Successfully created authenticated client.');
    return client;
  } catch (error) {
    console.error('Error getting authenticated client:', error);
    throw new Error('Could not create an authenticated client.');
  }
}

async function handler(req: NextRequest) {
  try {
    const authedClient = await getAuthenticatedClient();
    
    const incomingUrl = new URL(req.nextUrl);
    const requestPath = incomingUrl.pathname.replace('/api/proxy', '');
    const targetUrl = `${privateApiBaseUrl}/api/v1${requestPath}${incomingUrl.search}`;

    console.log(`Proxying request to: ${targetUrl}`);

    const requestHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') { // Exclude the original host header
        requestHeaders[key] = value;
      }
    });

    const response = await authedClient.request({
      url: targetUrl,
      method: req.method,
      headers: {
        ...requestHeaders,
        // The host header must match the target service's host.
        host: new URL(privateApiBaseUrl).host,
      },
      // Pass the request body stream directly
      body: req.body,
      // Tell the client not to process the response body stream, so we can pipe it
      responseType: 'stream',
    });

    // Re-create headers for the NextResponse
    const responseHeaders = new Headers();
    if (response.headers && typeof response.headers === 'object') {
        Object.entries(response.headers).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              const headerValue = Array.isArray(value) ? value.join(', ') : `${value}`;
              responseHeaders.set(key, headerValue);
            }
        });
    }

    return new NextResponse(response.data as any, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    const errorMessage = error.response?.data ? (await streamToString(error.response.data)) : (error.message || 'An error occurred during proxying.');
    console.error(`Error proxying request:`, errorMessage);
    return new NextResponse(
      errorMessage,
      { status: error.response?.status || 500 }
    );
  }
}

async function streamToString(stream: any): Promise<string> {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}


export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
