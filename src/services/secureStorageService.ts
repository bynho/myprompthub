import errorService from './errorService';

/**
 * Secure storage wrapper for sensitive data
 * Uses memory storage for current session and
 * encrypted storage for persistence when available
 */
class SecureStorageService {
    private memoryStorage: Map<string, any> = new Map();
    private isEncryptionAvailable: boolean = false;
    private encryptionKey: CryptoKey | null = null;

    constructor() {
        // Initialize encryption capability
        this.initEncryption();
    }

    /**
     * Initialize encryption capabilities if supported
     */
    private async initEncryption(): Promise<void> {
        try {
            // Check if the Web Crypto API is available
            if (window.crypto && window.crypto.subtle) {
                // Generate or retrieve encryption key
                this.encryptionKey = await this.getOrCreateEncryptionKey();
                this.isEncryptionAvailable = !!this.encryptionKey;
            } else {
                console.warn('Web Crypto API not available. Falling back to less secure storage.');
                this.isEncryptionAvailable = false;
            }
        } catch (error) {
            errorService.handleError(error as Error, {
                severity: 'medium',
                context: { component: 'SecureStorageService', method: 'initEncryption' },
                userMessage: 'Unable to initialize secure storage'
            });
            this.isEncryptionAvailable = false;
        }
    }

    /**
     * Get or create an encryption key for this application
     */
    private async getOrCreateEncryptionKey(): Promise<CryptoKey | null> {
        try {
            // Get the key from sessionStorage if it exists
            const storedKeyData = sessionStorage.getItem('app_encryption_key');

            if (storedKeyData) {
                // Import the existing key
                const keyData = JSON.parse(storedKeyData);
                const keyBuffer = new Uint8Array(Object.values(keyData));

                return await window.crypto.subtle.importKey(
                    'raw',
                    keyBuffer,
                    { name: 'AES-GCM' },
                    false,
                    ['encrypt', 'decrypt']
                );
            }

            // Generate a new encryption key
            const key = await window.crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );

            // Export the key to store in sessionStorage
            const rawKey = await window.crypto.subtle.exportKey('raw', key);
            sessionStorage.setItem('app_encryption_key', JSON.stringify(Array.from(new Uint8Array(rawKey))));

            return key;
        } catch (error) {
            errorService.handleError(error as Error, {
                severity: 'medium',
                context: { component: 'SecureStorageService', method: 'getOrCreateEncryptionKey' }
            });
            return null;
        }
    }

    /**
     * Encrypt text data
     */
    private async encrypt(data: string): Promise<string> {
        if (!this.isEncryptionAvailable || !this.encryptionKey) {
            return btoa(data); // Fallback to simple encoding
        }

        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);

            // Create a random initialization vector
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Encrypt the data
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv
                },
                this.encryptionKey,
                dataBuffer
            );

            // Combine IV and encrypted data and convert to base64
            const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encryptedBuffer), iv.length);

            return btoa(String.fromCharCode(...result));
        } catch (error) {
            errorService.handleError(error as Error, {
                severity: 'medium',
                context: { component: 'SecureStorageService', method: 'encrypt' }
            });
            return btoa(data); // Fallback to simple encoding
        }
    }

    /**
     * Decrypt text data
     */
    private async decrypt(encryptedData: string): Promise<string> {
        if (!this.isEncryptionAvailable || !this.encryptionKey) {
            return atob(encryptedData); // Fallback to simple decoding
        }

        try {
            const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

            // Extract the IV (first 12 bytes)
            const iv = encryptedBytes.slice(0, 12);
            const encryptedBuffer = encryptedBytes.slice(12);

            // Decrypt the data
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv
                },
                this.encryptionKey,
                encryptedBuffer
            );

            // Convert the decrypted data back to a string
            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        } catch (error) {
            errorService.handleError(error as Error, {
                severity: 'medium',
                context: { component: 'SecureStorageService', method: 'decrypt' }
            });
            return atob(encryptedData); // Fallback to simple decoding
        }
    }

    /**
     * Securely set a value in storage
     */
    async setItem(key: string, value: any): Promise<void> {
        // Store in memory for immediate access
        this.memoryStorage.set(key, value);

        try {
            // Prepare data for storage
            const serialized = JSON.stringify(value);
            const encrypted = await this.encrypt(serialized);

            // Store with added security measures
            localStorage.setItem(`secure_${key}`, encrypted);
            localStorage.setItem(`secure_${key}_integrity`, this.generateIntegrityHash(encrypted));
        } catch (error) {
            errorService.handleError(error as Error, {
                severity: 'medium',
                context: { component: 'SecureStorageService', method: 'setItem', key }
            });
        }
    }

    /**
     * Securely get a value from storage
     */
    async getItem<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
        // Check memory storage first for performance
        if (this.memoryStorage.has(key)) {
            return this.memoryStorage.get(key);
        }

        try {
            // Get from localStorage with integrity check
            const encrypted = localStorage.getItem(`secure_${key}`);
            if (!encrypted) return defaultValue;

            // Verify data integrity
            const storedIntegrity = localStorage.getItem(`secure_${key}_integrity`);
            const calculatedIntegrity = this.generateIntegrityHash(encrypted);

            if (storedIntegrity !== calculatedIntegrity) {
                throw new Error('Data integrity check failed');
            }

            // Decrypt and parse
            const decrypted = await this.decrypt(encrypted);
            const parsed = JSON.parse(decrypted);

            // Cache in memory
            this.memoryStorage.set(key, parsed);

            return parsed;
        } catch (error) {
            errorService.handleError(error as Error, {
                severity: 'medium',
                context: { component: 'SecureStorageService', method: 'getItem', key }
            });
            return defaultValue;
        }
    }

    /**
     * Remove an item from secure storage
     */
    removeItem(key: string): void {
        // Remove from memory
        this.memoryStorage.delete(key);

        // Remove from localStorage
        localStorage.removeItem(`secure_${key}`);
        localStorage.removeItem(`secure_${key}_integrity`);
    }

    /**
     * Clear all secure storage items
     */
    clear(): void {
        // Clear memory storage
        this.memoryStorage.clear();

        // Clear localStorage items that start with 'secure_'
        Object.keys(localStorage)
            .filter(key => key.startsWith('secure_'))
            .forEach(key => localStorage.removeItem(key));
    }

    /**
     * Generate a simple integrity hash for data validation
     * Note: This is not cryptographically secure, just tamper detection
     */
    private generateIntegrityHash(data: string): string {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }
}

// Create singleton instance
const secureStorageService = new SecureStorageService();
export default secureStorageService;
