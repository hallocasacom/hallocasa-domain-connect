/**
 * Domain Connect TypeScript Library
 * Types and interfaces for Domain Connect protocol
 */
/**
 * Represents DNS Provider settings discovered through DNS query
 */
export interface DomainConnectSettings {
    /** URL template for the DNS Provider's Domain Connect API */
    urlAPI: string;
    /** Whether the DNS Provider supports synchronous flow */
    syncEnabled?: boolean;
    /** Whether the DNS Provider supports asynchronous flow */
    asyncEnabled?: boolean;
    /** URL for the DNS Provider's Domain Connect API with extended path */
    urlAsyncAPI?: string;
}
/**
 * Parameters for the Domain Connect Template
 */
export interface TemplateParameter {
    /** Name of the parameter */
    name: string;
    /** Data type of the parameter */
    dataType?: "STRING" | "NUMBER" | "EMAIL" | "URL" | "BOOLEAN";
    /** Required flag for parameter */
    required?: boolean;
    /** Default value for parameter */
    defaultValue?: string | number | boolean;
    /** Description of parameter */
    description?: string;
    /** Whether the parameter should be hidden from the user */
    hidden?: boolean;
}
/**
 * DNS Record definition in a Domain Connect template
 */
export interface TemplateRecord {
    /** Type of DNS record (A, CNAME, TXT, etc.) */
    type: "A" | "AAAA" | "CNAME" | "TXT" | "SRV" | "MX" | "NS" | "SPFM" | "PTR";
    /** Host for the DNS record, may contain variable substitutions */
    host: string;
    /** Target/points-to/value for the DNS record, may contain variable substitutions */
    pointsTo?: string;
    /** TTL (Time To Live) for the DNS record */
    ttl?: number;
    /** Priority for certain record types (MX, SRV) */
    priority?: number;
    /** Weight for SRV records */
    weight?: number;
    /** Port for SRV records */
    port?: number;
}
/**
 * Domain Connect Template definition
 */
export interface Template {
    /** Provider ID (typically the company name of the service provider) */
    providerId: string;
    /** Service ID unique to the provider */
    serviceId: string;
    /** Human-readable name of the service */
    name?: string;
    /** Description of what the template does */
    description?: string;
    /** Template version */
    version?: string;
    /** Host name pattern this template applies to */
    hostRequired?: boolean;
    /** Parameters used in the template */
    parameters?: TemplateParameter[];
    /** DNS records contained in the template */
    records: TemplateRecord[];
    /** Logo URL for the service */
    logoUrl?: string;
    /** Whether the template supports the synchronous flow */
    syncSupported?: boolean;
    /** Whether the template supports the asynchronous flow */
    asyncSupported?: boolean;
}
/**
 * Domain Connect API request options
 */
export interface DomainConnectOptions {
    /** Domain to configure DNS for */
    domain: string;
    /** Provider ID */
    providerId: string;
    /** Service ID */
    serviceId: string;
    /** Template parameters */
    params: Record<string, string | number | boolean>;
    /** Host for the service (subdomain) */
    host?: string;
    /** Redirect URI for OAuth */
    redirectUri?: string;
    /** State parameter for OAuth */
    state?: string;
    /** Force permission prompt even if already authorized */
    forcePermission?: boolean;
}
/**
 * Result of Domain Connect API operations
 */
export interface DomainConnectResult {
    /** Whether the operation was successful */
    success: boolean;
    /** URL for redirection (used in async flow) */
    redirectUrl?: string;
    /** Error message if operation failed */
    error?: string;
    /** URL for checking the status of an asynchronous operation */
    asyncStatusUrl?: string;
}
export interface DnsProvider {
    name: string;
    domains: string[];
    loginUrl: string;
    iconUrl: string;
    cnameInstructions: string;
}
/**
 * DNS Provider information with Domain Connect support status
 */
export interface DnsProviderInfo {
    /**
     * The domain that was checked
     */
    domain: string;
    /**
     * List of nameservers for the domain
     */
    nameservers: string[];
    /**
     * Identified DNS provider name
     */
    provider: string;
    /**
     * Login URL for the DNS provider's control panel
     */
    loginUrl: string | null;
    /**
     * Icon URL for the DNS provider
     */
    iconUrl: string | null;
    /**
     * CNAME record setup instructions for the DNS provider
     */
    cnameInstructions?: string | null;
    /**
     * Error message if the check failed
     */
    error?: string;
}
