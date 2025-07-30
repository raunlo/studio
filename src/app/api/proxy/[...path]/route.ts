
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import type { IdTokenClient } from 'google-auth-library/build/src/auth/idtokenclient';

const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL;

if (!privateApiBaseUrl) {
  throw new Error('PRIVATE_API_BASE_URL is not set in environment variables');
}

const auth = new GoogleAuth();
let client: IdTokenClient | null = null;

async function getAuthenticatedClient() {
  if (client) {
    return client;
  }
  try {
    console.log(`Authenticating for audience: ${privateApiBaseUrl}`);
    // Create an authenticated client with the target audience
    client = await auth.getIdTokenClient(privateApiBaseUrl);
    console.log('Successfully created authenticated client.');
    return client;
  } catch (error) {
    console.error('Error creating authenticated client:', error);
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

    const requestHeaders: Record<string, string> = {
      // The host header must match the target service's host.
      host: new URL(privateApiBaseUrl).host,
    };
    req.headers.forEach((value, key) => {
      // Exclude the original host header
      if (key.toLowerCase() !== 'host') {
        requestHeaders[key] = value;
      }
    });

    const bodyBuffer = await req.arrayBuffer();

    const response = await authedClient.request({
      url: targetUrl,
      method: req.method,
      headers: requestHeaders,
      body: bodyBuffer.byteLength > 0 ? Buffer.from(bodyBuffer) : undefined,
      responseType: 'stream',
    });

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
    // Attempt to read the error response stream for better debugging
    let errorMessage = error.message || 'An error occurred during proxying.';
    if (error.response?.data?.readable) {
        try {
            const chunks = [];
            for await (const chunk of error.response.data) {
                chunks.push(chunk);
            }
            errorMessage = Buffer.concat(chunks).toString('utf8');
        } catch (streamError) {
            console.error('Error reading error stream:', streamError);
        }
    } else if (error.response?.data){
        errorMessage = JSON.stringify(error.response.data);
    }
    
    console.error(`Error proxying request:`, errorMessage);

    return new NextResponse(
      JSON.stringify({ message: 'Error proxying request', details: errorMessage }),
      { status: error.response?.status || 500, headers: { 'Content-Type': 'application/json' } }
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
