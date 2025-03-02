import secureStorageService from './secureStorageService';
import errorService from './errorService';

/**
 * CSRF protection service for API requests
 */
class CsrfProtectionService {
    private csrfToken: string | null = null;
    private tokenKey = 'csrf-token';

    constructor() {
        this.initialize();
    }

    /**
     * Initialize CSRF protection
     */
    private async initialize(): Promise<void> {
        try {
            // Try to load existing token
            this.csrfToken = await secureStorageService.getItem<string>(this.tokenKey);

            // If no token exists, generate a new one
            if (!this.csrfToken) {
                this.csrfToken = this.generateToken();
                await secureStorageService.setItem(this.tokenKey, this.csrfToken);
            }
        } catch (error) {
            errorService.handleError(error as Error, {
                context: { component: 'CsrfProtectionService', method: 'initialize' },
                severity: 'medium'
            });
        }
    }

    /**
     * Generate a secure random token
     */
    private generateToken(): string {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Get the current CSRF token
     */
    getToken(): string | null {
        return this.csrfToken;
    }

    /**
     * Reset the CSRF token
     */
    async resetToken(): Promise<string> {
        this.csrfToken = this.generateToken();
        await secureStorageService.setItem(this.tokenKey, this.csrfToken);
        return this.csrfToken;
    }

    /**
     * Add CSRF token to a fetch request
     */
    addCsrfToRequest(request: RequestInit): RequestInit {
        if (!this.csrfToken) {
            throw new Error('CSRF token not initialized');
        }

        // Create a new headers object if it doesn't exist
        const headers = new Headers(request.headers);
        headers.append('X-CSRF-Token', this.csrfToken);

        return {
            ...request,
            headers
        };
    }

    /**
     * Verify a CSRF token from a request
     */
    verifyToken(token: string): boolean {
        return !!this.csrfToken && token === this.csrfToken;
    }

    /**
     * Create a fetch wrapper with CSRF protection
     */
    createProtectedFetch(): typeof fetch {
        return (input: RequestInfo | URL, init?: RequestInit) => {
            // Only add CSRF token for non-GET requests to same origin
            if (init &&
                (init.method === 'POST' || init.method === 'PUT' || init.method === 'DELETE') &&
                this.isSameOrigin(input)) {
                const protectedInit = this.addCsrfToRequest(init);
                return fetch(input, protectedInit);
            }

            // Otherwise use normal fetch
            return fetch(input, init);
        };
    }

    /**
     * Check if a URL is same-origin
     */
    private isSameOrigin(url: RequestInfo | URL): boolean {
        if (typeof url === 'string') {
            try {
                const parsedUrl = new URL(url, window.location.origin);
                return parsedUrl.origin === window.location.origin;
            } catch (e) {
                // If URL parsing fails, assume it's a relative URL (same origin)
                return true;
            }
        } else if (url instanceof URL) {
            return url.origin === window.location.origin;
        } else {
            // Request object - assume it's same origin if no URL is provided
            return true;
        }
    }
}

// Create singleton instance
const csrfProtection = new CsrfProtectionService();

// Create protected fetch function
export const protectedFetch = csrfProtection.createProtectedFetch();

export default csrfProtection;
