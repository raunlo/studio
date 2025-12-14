
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import type { IdTokenClient } from 'google-auth-library/build/src/auth/idtokenclient';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ProxyAPI');
const auth = new GoogleAuth();
const useMockAuth = process.env.MOCK_AUTH === 'true';

class MockIdTokenClient {
  async getRequestHeaders(_url?: string) {
    const token = process.env.MOCK_ID_TOKEN || 'mock-token';
    return { Authorization: `Bearer ${token}` } as Record<string, string>;
  }
  async request(opts: RequestOptions) {
    const res = await fetch(opts.url, {
      method: opts.method,
      headers: opts.headers,
      body: opts.body as BodyInit,
    });
    return {
      data: opts.responseType === 'stream' ? res.body : await res.text(),
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
    } as ResponseData;
  }
}

interface RequestOptions {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: Buffer | string;
  responseType?: string;
}

interface ResponseData {
  data: ReadableStream | string | Buffer;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

const clientCache = new Map<string, IdTokenClient | MockIdTokenClient>();

async function getAuthenticatedClient(baseUrl: string) {
  if (clientCache.has(baseUrl)) {
    return clientCache.get(baseUrl)!;
  }
  if (useMockAuth) {
    logger.info('Using mock authentication client');
    const mockClient = new MockIdTokenClient();
    clientCache.set(baseUrl, mockClient);
    return mockClient;
  }
  try {
    logger.info(`Authenticating for audience: ${baseUrl}`);
    const authedClient = await auth.getIdTokenClient(baseUrl);
    logger.info('Successfully created authenticated client.');
    clientCache.set(baseUrl, authedClient);
    return authedClient;
  } catch (error) {
    logger.error('Error creating authenticated client:', error);
    throw new Error('Could not create an authenticated client.');
  }
}

async function handler(req: NextRequest) {
  // Skip NextAuth API routes - don't proxy them
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.json(
      { message: 'NextAuth routes are not proxied' },
      { status: 404 },
    );
  }

  const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL;
  if (!privateApiBaseUrl) {
    logger.error(
      'PRIVATE_API_BASE_URL is not set in environment variables'
    );
    return NextResponse.json(
      { message: 'PRIVATE_API_BASE_URL is not configured' },
      { status: 500 },
    );
  }

  try {
    const authedClient = await getAuthenticatedClient(privateApiBaseUrl);

    const incomingUrl = new URL(req.nextUrl);
    const requestPath = incomingUrl.pathname.replace('/api/proxy', '');
    const targetUrl = `${privateApiBaseUrl}${requestPath}${incomingUrl.search}`;

    logger.info(`Proxying request to: ${targetUrl}`);
    
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
    const response = res as ResponseData;
    
    return new NextResponse(response.data as BodyInit, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: { error?: string } | string; status?: number } };
    logger.error(`Error proxying request:`, err.message || error);
    
    const errorData = err.response?.data || err.message;

    return NextResponse.json(
      { message: 'Error proxying request', details: errorData },
      { status: err.response?.status || 500 }
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

