import { Template, TemplateRecord, DomainConnectSettings } from './types';
/**
 * Utility functions for Domain Connect
 */
/**
 * Generate DNS records from a template with variable substitution
 * @param template The template containing records
 * @param params Parameters for variable substitution
 * @param domain The domain name
 * @param host Optional host (subdomain)
 * @returns Array of fully-resolved DNS records
 */
export declare function generateRecords(template: Template, params: Record<string, string | number | boolean>, domain: string, host?: string): TemplateRecord[];
/**
 * Replace variables in a string with values from params
 * @param text String containing variables like %var%
 * @param params Parameters containing values for variables
 * @returns String with all variables replaced
 */
export declare function replaceVariables(text: string, params: Record<string, string | number | boolean>): string;
/**
 * Validate that all required parameters are provided
 * @param template Template with parameter definitions
 * @param params Provided parameters
 * @returns Object containing validation result and missing parameters
 */
export declare function validateParameters(template: Template, params: Record<string, string | number | boolean>): {
    valid: boolean;
    missing: string[];
};
/**
 * Convert a domain to punycode for internationalized domain names
 * @param domain Domain name that might contain unicode characters
 * @returns Punycode representation of the domain
 */
export declare function convertToPunycode(domain: string): string;
/**
 * Check if domain supports Domain Connect protocol
 * @param domain Domain to check
 * @returns Promise resolving to boolean
 */
export declare function supportsDomainConnect(domain: string): Promise<boolean>;
/**
 * Extract domain and subdomain from a full hostname
 * @param hostname Full hostname (e.g., "www.example.com")
 * @returns Object containing domain and subdomain
 */
export declare function splitHostname(hostname: string): {
    domain: string;
    subdomain?: string;
};
/**
 * Parse redirect URI and extract state and code
 * @param redirectUri The URI to parse
 * @returns Object containing state and code if found
 */
export declare function parseRedirectUri(redirectUri: string): {
    state?: string;
    code?: string;
};
/**
 * Format Domain Connect settings URL based on domain
 * @param domain Domain name
 * @param settings Optional partial settings to override defaults
 * @returns Domain Connect settings object
 */
export declare function formatSettingsUrl(domain: string, settings?: Partial<DomainConnectSettings>): DomainConnectSettings;
