
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import type { IdTokenClient } from 'google-auth-library/build/src/auth/idtokenclient';

const auth = new GoogleAuth();
const useMockAuth = process.env.MOCK_AUTH === 'true';

class MockIdTokenClient {
  async getRequestHeaders(_url?: string) {
    const token = process.env.MOCK_ID_TOKEN || 'mock-token';
    return { Authorization: `Bearer ${token}` } as any;
  }
  async request(opts: any) {
    const res = await fetch(opts.url, {
      method: opts.method,
      headers: opts.headers,
      body: opts.body,
    });
    return {
      data: opts.responseType === 'stream' ? res.body : await res.text(),
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
    } as any;
  }
}

const clientCache = new Map<string, IdTokenClient | MockIdTokenClient>();

async function getAuthenticatedClient(baseUrl: string) {
  if (clientCache.has(baseUrl)) {
    return clientCache.get(baseUrl)!;
  }
  if (useMockAuth) {
    console.log('Using mock authentication client');
    const mockClient = new MockIdTokenClient();
    clientCache.set(baseUrl, mockClient);
    return mockClient;
  }
  try {
    console.log(`Authenticating for audience: ${baseUrl}`);
    const authedClient = await auth.getIdTokenClient(baseUrl);
    console.log('Successfully created authenticated client.');
    clientCache.set(baseUrl, authedClient);
    return authedClient;
  } catch (error) {
    console.error('Error creating authenticated client:', error);
    throw new Error('Could not create an authenticated client.');
  }
}

async function handler(req: NextRequest) {
  const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL;
  if (!privateApiBaseUrl) {
    console.error(
      new Error('PRIVATE_API_BASE_URL is not set in environment variables')
    );
    return NextResponse.json(
      { message: 'PRIVATE_API_BASE_URL is not configured' },
      { status: 500 }
    );
  }

  try {
    const authedClient = await getAuthenticatedClient(privateApiBaseUrl);

    const incomingUrl = new URL(req.nextUrl);
    const requestPath = incomingUrl.pathname.replace('/api/proxy', '');
    const targetUrl = `${privateApiBaseUrl}${requestPath}${incomingUrl.search}`;

    console.log(`Proxying request to: ${targetUrl}`);
    
    // We explicitly buffer the body to handle different request types (e.g., streaming)
    // and to avoid issues with the underlying http libraries.
    const bodyBuffer = await req.arrayBuffer();

    const requestHeaders = new Headers();
    // Ensure Content-Type is set for methods that have a body, as it can get lost.
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && bodyBuffer.byteLength > 0) {
      if (!requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
      }
    }

    const res = await authedClient.request({
      url: targetUrl,
      method: req.method as "POST" | "PUT" | "PATCH" | "GET" | "HEAD" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE",
      headers: {
        ...Object.fromEntries(requestHeaders.entries()),
        // The host header must match the target service's URL for routing.
        host: new URL(targetUrl).host,
      },
      body: bodyBuffer.byteLength > 0 ? Buffer.from(bodyBuffer) : undefined,
      responseType: 'stream', // Important for handling different content types
    });
    
    // Type assertion to access properties on the response
    const response = res as any;
    
    return new NextResponse(response.data, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error: any) {
    console.error(`Error proxying request:`, error.message || error);
    
    const errorData = error.response?.data?.error || error.response?.data || error.message;

    return NextResponse.json(
      { message: 'Error proxying request', details: errorData },
      { status: error.response?.status || 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;

