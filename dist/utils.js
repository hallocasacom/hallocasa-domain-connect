"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecords = generateRecords;
exports.replaceVariables = replaceVariables;
exports.validateParameters = validateParameters;
exports.convertToPunycode = convertToPunycode;
exports.supportsDomainConnect = supportsDomainConnect;
exports.splitHostname = splitHostname;
exports.parseRedirectUri = parseRedirectUri;
exports.formatSettingsUrl = formatSettingsUrl;
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
function generateRecords(template, params, domain, host) {
    return template.records.map(record => {
        // Create a copy of the record for modification
        const resolvedRecord = Object.assign({}, record);
        // Replace variables in host field
        resolvedRecord.host = replaceVariables(record.host, params);
        // If host is provided, handle subdomain concatenation
        if (host) {
            if (resolvedRecord.host === '@') {
                resolvedRecord.host = host;
            }
            else if (resolvedRecord.host !== '%host%') {
                resolvedRecord.host = `${resolvedRecord.host}.${host}`;
            }
        }
        // Replace %host% with the actual host value
        if (resolvedRecord.host === '%host%' && host) {
            resolvedRecord.host = host;
        }
        else if (resolvedRecord.host === '%host%' && !host) {
            resolvedRecord.host = '@';
        }
        // Replace variables in pointsTo field if it exists
        if (resolvedRecord.pointsTo) {
            resolvedRecord.pointsTo = replaceVariables(record.pointsTo || '', params);
        }
        return resolvedRecord;
    });
}
/**
 * Replace variables in a string with values from params
 * @param text String containing variables like %var%
 * @param params Parameters containing values for variables
 * @returns String with all variables replaced
 */
function replaceVariables(text, params) {
    return text.replace(/%([a-zA-Z0-9_]+)%/g, (match, varName) => {
        if (params[varName] !== undefined) {
            return String(params[varName]);
        }
        return match; // Keep the original if no replacement found
    });
}
/**
 * Validate that all required parameters are provided
 * @param template Template with parameter definitions
 * @param params Provided parameters
 * @returns Object containing validation result and missing parameters
 */
function validateParameters(template, params) {
    if (!template.parameters) {
        return { valid: true, missing: [] };
    }
    const missingParams = template.parameters
        .filter(param => param.required && params[param.name] === undefined)
        .map(param => param.name);
    return {
        valid: missingParams.length === 0,
        missing: missingParams
    };
}
/**
 * Convert a domain to punycode for internationalized domain names
 * @param domain Domain name that might contain unicode characters
 * @returns Punycode representation of the domain
 */
function convertToPunycode(domain) {
    try {
        const url = new URL(`https://${domain}`);
        return url.hostname;
    }
    catch (error) {
        console.error('Error converting domain to punycode:', error);
        return domain;
    }
}
/**
 * Check if domain supports Domain Connect protocol
 * @param domain Domain to check
 * @returns Promise resolving to boolean
 */
async function supportsDomainConnect(domain) {
    try {
        // Try to query the _domainconnect DNS record
        // In a real implementation, this would be a DNS lookup
        // Here we just check if an HTTP request to the standard endpoint succeeds
        const response = await fetch(`https://_domainconnect.${domain}/.well-known/domain-connect.json`);
        return response.status === 200;
    }
    catch (error) {
        return false;
    }
}
/**
 * Extract domain and subdomain from a full hostname
 * @param hostname Full hostname (e.g., "www.example.com")
 * @returns Object containing domain and subdomain
 */
function splitHostname(hostname) {
    const parts = hostname.split('.');
    // Handle special cases like co.uk, com.au, etc.
    if (parts.length > 2) {
        const tld = parts.slice(-2).join('.');
        if (tld.match(/^(co|com|net|org|gov|edu)\.[a-z]{2}$/)) {
            if (parts.length > 3) {
                return {
                    domain: parts.slice(-3).join('.'),
                    subdomain: parts.slice(0, -3).join('.')
                };
            }
            return { domain: hostname };
        }
        return {
            domain: parts.slice(-2).join('.'),
            subdomain: parts.slice(0, -2).join('.')
        };
    }
    return { domain: hostname };
}
/**
 * Parse redirect URI and extract state and code
 * @param redirectUri The URI to parse
 * @returns Object containing state and code if found
 */
function parseRedirectUri(redirectUri) {
    try {
        const url = new URL(redirectUri);
        const state = url.searchParams.get('state') || undefined;
        const code = url.searchParams.get('code') || undefined;
        return { state, code };
    }
    catch (error) {
        console.error('Error parsing redirect URI:', error);
        return {};
    }
}
/**
 * Format Domain Connect settings URL based on domain
 * @param domain Domain name
 * @param settings Optional partial settings to override defaults
 * @returns Domain Connect settings object
 */
function formatSettingsUrl(domain, settings) {
    // Default settings
    const defaultSettings = {
        urlAPI: `https://api.domainconnect.${domain}`,
        syncEnabled: true,
        asyncEnabled: true,
        urlAsyncAPI: `https://api.domainconnect.${domain}`
    };
    return Object.assign(Object.assign({}, defaultSettings), settings);
}
//# sourceMappingURL=utils.js.map