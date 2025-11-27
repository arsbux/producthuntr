/**
 * Product Hunt OAuth Token Manager
 * Handles OAuth 2.0 client credentials flow for better rate limits
 */

interface OAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    created_at: number;
}

let cachedToken: OAuthToken | null = null;

/**
 * Get a valid OAuth access token for Product Hunt API
 * Uses client credentials grant type
 * Caches the token and reuses it until expiry
 */
export async function getProductHuntOAuthToken(): Promise<string> {
    const apiKey = process.env.PRODUCT_HUNT_API_KEY;
    const apiSecret = process.env.PRODUCT_HUNT_API_SECRET;

    if (!apiKey || !apiSecret) {
        console.warn('Product Hunt OAuth credentials not found, falling back to developer token');
        return process.env.PRODUCT_HUNT_API_TOKEN || '';
    }

    // Check if we have a valid cached token
    if (cachedToken) {
        const expiresAt = cachedToken.created_at + (cachedToken.expires_in * 1000);
        const now = Date.now();

        // If token expires in more than 5 minutes, use it
        if (expiresAt - now > 5 * 60 * 1000) {
            return cachedToken.access_token;
        }
    }

    // Request a new token
    try {
        // Product Hunt requires Basic Auth with base64(client_id:client_secret)
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

        const response = await fetch('https://api.producthunt.com/v2/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
            }),
        });

        if (!response.ok) {
            throw new Error(`OAuth token request failed: ${response.status}`);
        }

        const data: OAuthToken = await response.json();

        // Add created_at timestamp
        cachedToken = {
            ...data,
            created_at: Date.now(),
        };

        console.log(`New OAuth token obtained, expires in ${data.expires_in} seconds`);
        return cachedToken.access_token;
    } catch (error) {
        console.error('Failed to get OAuth token:', error);
        // Fall back to developer token if OAuth fails
        console.warn('Falling back to developer token');
        return process.env.PRODUCT_HUNT_API_TOKEN || '';
    }
}

/**
 * Clear the cached token (useful for testing or forcing refresh)
 */
export function clearOAuthTokenCache(): void {
    cachedToken = null;
}
