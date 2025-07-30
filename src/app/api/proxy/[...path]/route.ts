
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL;

if (!privateApiBaseUrl) {
  throw new Error('PRIVATE_API_BASE_URL is not set in environment variables');
}

const auth = new GoogleAuth();

async function getAuthenticatedClient() {
  try {
    const client = await auth.getIdTokenClient(privateApiBaseUrl);
    return client;
  } catch (error) {
    console.error('Error getting authenticated client:', error);
    throw new Error('Could not create an authenticated client.');
  }
}

async function handler(req: NextRequest) {
  const client = await getAuthenticatedClient();
  
  const incomingUrl = new URL(req.nextUrl);
  const requestPath = incomingUrl.pathname.replace('/api/proxy', '');
  const targetUrl = `${privateApiBaseUrl}/api/v1${requestPath}${incomingUrl.search}`;

  // Explicitly read the body to handle different content types
  const bodyBuffer = await req.text();
  const data = bodyBuffer.length > 0 ? JSON.parse(bodyBuffer) : undefined;

  try {
    const response = await client.request({
      url: targetUrl,
      method: req.method,
      headers: {
        ...req.headers,
        // The host header must match the target service's host.
        host: new URL(privateApiBaseUrl).host,
      },
      data: data,
      responseType: 'arraybuffer', // Get response as a buffer to handle any content type
    });

    // Create a new NextResponse with the response data and headers
    const headers = new Headers();
    if (response.headers && typeof response.headers === 'object') {
        Object.entries(response.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers.set(key, value);
            } else if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            }
        });
    }

    return new NextResponse(response.data, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  } catch (error: any) {
    const errorResponse = error.response?.data ? Buffer.from(error.response.data).toString() : 'An error occurred during proxying.';
    console.error(`Error proxying request to ${targetUrl}:`, errorResponse);
    return new NextResponse(
      errorResponse,
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
