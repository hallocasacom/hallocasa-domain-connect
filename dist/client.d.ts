import { DomainConnectSettings, DomainConnectOptions, DomainConnectResult, Template } from './types';
/**
 * Domain Connect client for discovering settings and applying templates
 */
export declare class DomainConnectClient {
    /**
     * Discover Domain Connect settings for a domain
     * @param domain Domain name to discover settings for
     * @returns Promise resolving to Domain Connect settings or null if not found
     */
    discoverSettings(domain: string): Promise<DomainConnectSettings | null>;
    /**
     * Get a template for a provider and service
     * @param settings Domain Connect settings
     * @param providerId Provider ID
     * @param serviceId Service ID
     * @returns Promise resolving to the template or null if not found
     */
    getTemplate(settings: DomainConnectSettings, providerId: string, serviceId: string): Promise<Template | null>;
    /**
     * Apply a template synchronously (instant setup)
     * @param settings Domain Connect settings
     * @param options Domain Connect options
     * @returns Promise resolving to the result of the operation
     */
    applyTemplateSynchronous(settings: DomainConnectSettings, options: DomainConnectOptions): Promise<DomainConnectResult>;
    /**
     * Start an asynchronous template application (requires user consent)
     * @param settings Domain Connect settings
     * @param options Domain Connect options
     * @returns Promise resolving to the result with redirect URL
     */
    applyTemplateAsynchronous(settings: DomainConnectSettings, options: DomainConnectOptions): Promise<DomainConnectResult>;
    /**
     * Check the status of an asynchronous operation
     * @param statusUrl URL for checking the status
     * @returns Promise resolving to the current status
     */
    checkAsyncStatus(statusUrl: string): Promise<DomainConnectResult>;
    /**
     * Generate a URL for the synchronous application flow
     * @param settings Domain Connect settings
     * @param options Domain Connect options
     * @returns The URL to apply the template synchronously
     */
    generateSyncURL(settings: DomainConnectSettings, options: DomainConnectOptions): string;
    /**
     * Generate a URL for the asynchronous application flow
     * @param settings Domain Connect settings
     * @param options Domain Connect options
     * @returns The URL to start the asynchronous template application
     */
    generateAsyncURL(settings: DomainConnectSettings, options: DomainConnectOptions): string | null;
}
