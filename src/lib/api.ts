/**
 * Safe API request utility to handle JSON parsing, network errors,
 * and proxy/HTML response errors gracefully without crashing on SyntaxError.
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export async function safeApiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(
      netErr?.message || 'Network connection failed. Please verify the server is running.'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    try {
      const data = await response.json();
      if (!response.ok) {
        const errMsg = data?.error || `Server responded with error code ${response.status}`;
        throw new Error(errMsg);
      }
      return data as T;
    } catch (parseErr: any) {
      if (parseErr.message && !parseErr.message.includes('Unexpected token')) {
        throw parseErr;
      }
      throw new Error(`Invalid JSON response received from ${url}`);
    }
  } else {
    // Non-JSON response (e.g. HTML error page from proxy or server)
    const rawText = await response.text();
    let cleanMessage = '';

    if (rawText.includes('<title>')) {
      const match = rawText.match(/<title>(.*?)<\/title>/i);
      if (match && match[1]) {
        cleanMessage = match[1].trim();
      }
    }

    if (!cleanMessage) {
      // Strip HTML tags if any
      cleanMessage = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (!cleanMessage || cleanMessage.length > 150) {
      cleanMessage = `Server returned status ${response.status} (${response.statusText || 'Error'})`;
    }

    throw new Error(cleanMessage);
  }
}
