"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainConnectClient = void 0;
const axios_1 = __importDefault(require("axios"));
const dns_1 = require("dns");
/**
 * Domain Connect client for discovering settings and applying templates
 */
class DomainConnectClient {
    constructor() {
        // Map of common DNS providers based on nameserver patterns
        this.dnsProviders = [
            {
                name: '1&1 IONOS',
                domains: ['1and1.com', 'ionos.com'],
                loginUrl: 'https://login.ionos.com',
                iconUrl: 'https://www.ionos.com/favicon.ico',
                cnameInstructions: '1. Login to IONOS Control Panel\n2. Go to "Domains & SSL"\n3. Select your domain\n4. Click on "DNS"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Prefix" field\n8. Enter the target domain in the "Value" field\n9. Click "Save"'
            },
            {
                name: 'Amazon Route 53',
                domains: ['awsdns'],
                loginUrl: 'https://console.aws.amazon.com/route53/',
                iconUrl: 'https://aws.amazon.com/favicon.ico',
                cnameInstructions: '1. Login to AWS Console\n2. Navigate to Route 53\n3. Click on "Hosted zones"\n4. Select your domain name\n5. Click "Create Record Set"\n6. Enter the hostname in the "Name" field\n7. Select "CNAME" as the "Type"\n8. Enter the target domain in the "Value" field\n9. Click "Create"'
            },
            {
                name: 'Bluehost',
                domains: ['bluehost.com'],
                loginUrl: 'https://my.bluehost.com/hosting/login',
                iconUrl: 'https://www.bluehost.com/favicon.ico',
                cnameInstructions: '1. Login to Bluehost\n2. Go to "Domains" section\n3. Click on your domain name\n4. Click "DNS" or "Zone Editor"\n5. Click "Add Record"\n6. Select "CNAME" as the record type\n7. Enter the hostname in the "Host Record" field\n8. Enter the target domain in the "Points To" field\n9. Set TTL as desired\n10. Click "Add Record"'
            },
            {
                name: 'Cloudflare',
                domains: ['cloudflare.com', 'cloudflare-dns.com'],
                loginUrl: 'https://dash.cloudflare.com/login',
                iconUrl: 'https://www.cloudflare.com/favicon.ico',
                cnameInstructions: '1. Login to Cloudflare dashboard\n2. Select your domain\n3. Go to the DNS tab\n4. Click "Add record"\n5. Select "CNAME" from the type dropdown\n6. Enter the hostname in the "Name" field\n7. Enter the target domain in the "Target" field\n8. Click "Save"'
            },
            {
                name: 'DigitalOcean',
                domains: ['digitalocean.com'],
                loginUrl: 'https://cloud.digitalocean.com/login',
                iconUrl: 'https://assets.digitalocean.com/favicon.ico',
                cnameInstructions: '1. Login to DigitalOcean\n2. Navigate to "Networking"\n3. Click on "Domains"\n4. Select your domain\n5. Click "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Hostname" field\n8. Enter the target domain in the "Is an alias of" field\n9. Click "Create Record"'
            },
            {
                name: 'Domain.com',
                domains: ['domain.com', 'domain-dns.com'],
                loginUrl: 'https://www.domain.com/login',
                iconUrl: 'https://www.domain.com/favicon.ico',
                cnameInstructions: '1. Login to Domain.com\n2. Go to "My Domains"\n3. Find and click on your domain\n4. Click on "DNS & Nameservers"\n5. Scroll to the "DNS Records" section\n6. Click "Add Record"\n7. Select "CNAME" as the record type\n8. Enter the hostname in the "Host" field\n9. Enter the target domain in the "Points to" field\n10. Click "Save Changes"'
            },
            {
                name: 'DreamHost',
                domains: ['dreamhost.com'],
                loginUrl: 'https://panel.dreamhost.com/login',
                iconUrl: 'https://panel.dreamhost.com/favicon.ico',
                cnameInstructions: '1. Login to DreamHost Panel\n2. Go to "Domains" > "Manage Domains"\n3. Click on your domain name\n4. Click "DNS" tab\n5. Scroll to "Add Record"\n6. Select "CNAME" record type\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Value" field\n9. Click "Add Record Now"'
            },
            {
                name: 'GoDaddy',
                domains: ['domaincontrol.com', 'godaddy.com'],
                loginUrl: 'https://sso.godaddy.com',
                iconUrl: 'https://img6.wsimg.com/ux/favicon/favicon.ico',
                cnameInstructions: '1. Login to GoDaddy\n2. Go to your Domain List\n3. Click on the domain you want to manage\n4. Click "DNS"\n5. Scroll to the "Records" section\n6. Click "Add" and select "CNAME"\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
            },
            {
                name: 'Google Domains',
                domains: ['googledomains.com', 'domains.google.com'],
                loginUrl: 'https://domains.google.com/registrar/login',
                iconUrl: 'https://www.google.com/favicon.ico',
                cnameInstructions: '1. Login to Google Domains\n2. Select your domain\n3. Click "DNS" in the left menu\n4. Scroll to "Custom resource records"\n5. Enter the hostname in the first field\n6. Select "CNAME" from the dropdown\n7. Enter the target domain in the "Data" field\n8. Click "Add"'
            },
            {
                name: 'HostGator',
                domains: ['hostgator.com'],
                loginUrl: 'https://portal.hostgator.com/login',
                iconUrl: 'https://www.hostgator.com/favicon.ico',
                cnameInstructions: '1. Login to HostGator\n2. Navigate to "Domains"\n3. Click on your domain\n4. Click "DNS Records"\n5. Scroll to "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Content" field\n9. Click "Add Record"'
            },
            {
                name: 'Name.com',
                domains: ['name.com'],
                loginUrl: 'https://www.name.com/account/login',
                iconUrl: 'https://www.name.com/favicon.ico',
                cnameInstructions: '1. Login to Name.com\n2. Click on your domain in "My Domains"\n3. Click "Manage DNS Records"\n4. Click "Add Record"\n5. Select "CNAME" from the record type dropdown\n6. Enter the hostname in the "Host" field\n7. Enter the target domain in the "Answer" field\n8. Click "Add Record"'
            },
            {
                name: 'Namecheap',
                domains: ['registrar-servers.com', 'namecheap.com'],
                loginUrl: 'https://www.namecheap.com/myaccount/login/',
                iconUrl: 'https://www.namecheap.com/favicon.ico',
                cnameInstructions: '1. Login to Namecheap\n2. Go to "Domain List"\n3. Click "Manage" next to your domain\n4. Select the "Advanced DNS" tab\n5. Under "Host Records", click "Add New Record"\n6. Select "CNAME Record" from the dropdown\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Value" field\n9. Set TTL as desired\n10. Click the checkmark to save'
            },
            {
                name: 'OVH',
                domains: ['ovh.net'],
                loginUrl: 'https://www.ovh.com/auth/',
                iconUrl: 'https://www.ovh.com/favicon.ico',
                cnameInstructions: '1. Login to OVH Manager\n2. Navigate to "Domains"\n3. Select your domain\n4. Click on the "DNS Zone" tab\n5. Click "Add an entry"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Sub-domain" field\n8. Enter the target domain in the "Target" field\n9. Click "Next" and then "Confirm"'
            },
        ];
    }
    /**
     * Gets all DNS provider information
     * @returns Record of all DNS providers with their details
     */
    getAllDnsProviders() {
        return [...this.dnsProviders];
    }
    /**
     * Gets the login URL for a DNS provider
     * @param provider Name of the DNS provider
     * @returns The login URL for the provider or null if not found
     */
    getProviderLoginUrl(provider) {
        const found = this.dnsProviders.find(p => p.name === provider);
        if (found) {
            return found.loginUrl;
        }
    }
    /**
     * Gets the icon URL for a DNS provider
     * @param provider Name of the DNS provider
     * @returns The icon URL for the provider or null if not found
     */
    getProviderIconUrl(provider) {
        const found = this.dnsProviders.find(p => p.name === provider);
        if (found) {
            return found.iconUrl;
        }
    }
    /**
     * Gets the CNAME record setup instructions for a DNS provider
     * @param provider Name of the DNS provider
     * @returns The CNAME setup instructions for the provider or null if not found
     */
    getProviderCnameInstructions(provider) {
        const found = this.dnsProviders.find(p => p.name === provider);
        if (found) {
            return found.cnameInstructions;
        }
    }
    /**
     * Discovers the DNS provider for a domain and checks if Domain Connect is supported
     * @param domain The domain to check
     * @returns Information about the DNS provider and Domain Connect support
     */
    async getDnsProvider(domain) {
        try {
            // Get nameservers for the domain using our safe method. Only get the last two parts of the domain.
            const nameservers = await dns_1.promises.resolveNs(domain.split('.').slice(-2).join('.'));
            // Determine the DNS provider
            const provider = this.identifyDnsProvider(nameservers);
            // Get the login URL
            const loginUrl = provider ? this.getProviderLoginUrl(provider) : undefined;
            // Get the icon URL
            const iconUrl = provider ? this.getProviderIconUrl(provider) : undefined;
            // Get the CNAME instructions
            const cnameInstructions = provider ? this.getProviderCnameInstructions(provider) : undefined;
            return {
                domains: [],
                name: provider || 'Unknown',
                loginUrl: loginUrl || '',
                iconUrl: iconUrl || '',
                cnameInstructions: cnameInstructions || ''
            };
        }
        catch (error) {
            // If any part of the process fails, return basic error info
            return {
                domains: [],
                name: 'Unknown',
                loginUrl: '',
                iconUrl: '',
                cnameInstructions: '',
            };
        }
    }
    /**
     * Identifies the DNS provider based on nameservers
     * @param nameservers Array of nameserver hostnames
     * @returns The identified provider name or null if unknown
     */
    identifyDnsProvider(nameservers) {
        if (!nameservers || nameservers.length === 0) {
            return undefined;
        }
        // Convert nameservers to lowercase for comparison
        const lowerNameservers = nameservers.map(ns => ns.toLowerCase());
        // Check against known providers
        for (const provider of this.dnsProviders) {
            if (provider.domains.some(domain => lowerNameservers.some(ns => ns.includes(domain.toLowerCase())))) {
                return provider.name;
            }
        }
        // If we can't identify the provider, return the nameserver domain
        try {
            // Extract the base domain from the first nameserver
            const nsParts = lowerNameservers[0].split('.');
            if (nsParts.length >= 2) {
                const baseDomain = `${nsParts[nsParts.length - 2]}.${nsParts[nsParts.length - 1]}`;
                return baseDomain;
            }
        }
        catch (e) {
            // Ignore parsing errors
        }
        return undefined;
    }
    /**
     * Discover Domain Connect settings for a domain
     * @param domain Domain name to discover settings for
     * @returns Promise resolving to Domain Connect settings or null if not found
     */
    async discoverSettings(domain) {
        try {
            // First try to get settings from _domainconnect.{domain}
            const dnsQuery = `_domainconnect.${domain}`;
            try {
                // In a real implementation, this would do an actual DNS query
                // Here we simulate a DNS lookup with an HTTP request to a well-known endpoint
                const response = await axios_1.default.get(`https://${dnsQuery}/v2/domainTemplates/providers`);
                if (response.status === 200 && response.data) {
                    return {
                        urlAPI: response.data.urlAPI,
                        syncEnabled: response.data.syncEnabled,
                        asyncEnabled: response.data.asyncEnabled,
                        urlAsyncAPI: response.data.urlAsyncAPI
                    };
                }
            }
            catch (error) {
                // DNS lookup failed, try the alternative method
                console.log(`DNS lookup failed for ${dnsQuery}, trying alternative method`);
            }
            // Alternative method: try getting settings from the domain's API directly
            try {
                const response = await axios_1.default.get(`https://${domain}/.well-known/domain-connect.json`);
                if (response.status === 200 && response.data) {
                    return {
                        urlAPI: response.data.urlAPI,
                        syncEnabled: response.data.syncEnabled,
                        asyncEnabled: response.data.asyncEnabled,
                        urlAsyncAPI: response.data.urlAsyncAPI
                    };
                }
            }
            catch (error) {
                console.log(`Alternative method failed for ${domain}`);
            }
            return null;
        }
        catch (error) {
            console.error('Error discovering Domain Connect settings:', error);
            return null;
        }
    }
    /**
     * Get a template for a provider and service
     * @param settings Domain Connect settings
     * @param providerId Provider ID
     * @param serviceId Service ID
     * @returns Promise resolving to the template or null if not found
     */
    async getTemplate(settings, providerId, serviceId) {
        try {
            const templateUrl = `${settings.urlAPI}/v2/domainTemplates/providers/${providerId}/services/${serviceId}`;
            const response = await axios_1.default.get(templateUrl);
            if (response.status === 200 && response.data) {
                return response.data;
            }
            return null;
        }
        catch (error) {
            console.error('Error getting Domain Connect template:', error);
            return null;
        }
    }
    /**
     * Apply a template synchronously (instant setup)
     * @param settings Domain Connect settings
     * @param options Domain Connect options
     * @returns Promise resolving to the result of the operation
     */
    async applyTemplateSynchronous(settings, options) {
        try {
            if (!settings.syncEnabled) {
                return {
                    success: false,
                    error: 'Synchronous mode not supported by DNS provider'
                };
            }
            // Build the synchronous API URL with query parameters
            const { domain, providerId, serviceId, params, host } = options;
            let apiUrl = `${settings.urlAPI}/v2/domainTemplates/providers/${providerId}/services/${serviceId}/apply`;
            // Add the domain and host parameters
            const queryParams = new URLSearchParams();
            queryParams.append('domain', domain);
            if (host) {
                queryParams.append('host', host);
            }
            // Add all the custom parameters
            Object.entries(params).forEach(([key, value]) => {
                queryParams.append(key, String(value));
            });
            // Add the query string to the URL
            apiUrl += `?${queryParams.toString()}`;
            // Make the request
            const response = await axios_1.default.get(apiUrl);
            if (response.status === 200) {
                return {
                    success: true
                };
            }
            else {
                return {
                    success: false,
                    error: `Unexpected status code: ${response.status}`
                };
            }
        }
        catch (error) {
            console.error('Error applying template synchronously:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Start an asynchronous template application (requires user consent)
     * @param settings Domain Connect settings
     * @param options Domain Connect options
     * @returns Promise resolving to the result with redirect URL
     */
    async applyTemplateAsynchronous(settings, options) {
        try {
            if (!settings.asyncEnabled || !settings.urlAsyncAPI) {
                return {
                    success: false,
                    error: 'Asynchronous mode not supported by DNS provider'
                };
            }
            const { domain, providerId, serviceId, params, host, redirectUri, state, forcePermission } = options;
            // Build the asynchronous API URL for authorization
            let apiUrl = `${settings.urlAsyncAPI}/v2/domainTemplates/providers/${providerId}`;
            apiUrl += `/services/${serviceId}/apply`;
            // Add the required parameters
            const queryParams = new URLSearchParams();
            queryParams.append('domain', domain);
            if (host) {
                queryParams.append('host', host);
            }
            // Add redirect URI and state for OAuth flow
            if (redirectUri) {
                queryParams.append('redirect_uri', redirectUri);
            }
            if (state) {
                queryParams.append('state', state);
            }
            // Force permission prompt if requested
            if (forcePermission) {
                queryParams.append('force', 'true');
            }
            // Add all the custom parameters
            Object.entries(params).forEach(([key, value]) => {
                queryParams.append(key, String(value));
            });
            // Add the query string to the URL
            apiUrl += `?${queryParams.toString()}`;
            return {
                success: true,
                redirectUrl: apiUrl
            };
        }
        catch (error) {
            console.error('Error preparing asynchronous template application:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Check the status of an asynchronous operation
     * @param statusUrl URL for checking the status
     * @returns Promise resolving to the current status
     */
    async checkAsyncStatus(statusUrl) {
        try {
            const response = await axios_1.default.get(statusUrl);
            if (response.status === 200) {
                return {
                    success: true
                };
            }
            else if (response.status === 202) {
                return {
                    success: false,
                    error: 'Operation still in progress'
                };
            }
            else {
                return {
                    success: false,
                    error: `Unexpected status code: ${response.status}`
                };
            }
        }
        catch (error) {
            console.error('Error checking asynchronous status:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Generate a URL for the synchronous application flow
     * @param settings Domain Connect settings
     * @param options Domain Connect options
     * @returns The URL to apply the template synchronously
     */
    generateSyncURL(settings, options) {
        const { domain, providerId, serviceId, params, host } = options;
        let apiUrl = `${settings.urlAPI}/v2/domainTemplates/providers/${providerId}/services/${serviceId}/apply`;
        // Add the domain and host parameters
        const queryParams = new URLSearchParams();
        queryParams.append('domain', domain);
        if (host) {
            queryParams.append('host', host);
        }
        // Add all the custom parameters
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, String(value));
        });
        // Add the query string to the URL
        return `${apiUrl}?${queryParams.toString()}`;
    }
    /**
     * Generate a URL for the asynchronous application flow
     * @param settings Domain Connect settings
     * @param options Domain Connect options
     * @returns The URL to start the asynchronous template application
     */
    generateAsyncURL(settings, options) {
        if (!settings.asyncEnabled || !settings.urlAsyncAPI) {
            return null;
        }
        const { domain, providerId, serviceId, params, host, redirectUri, state, forcePermission } = options;
        // Build the asynchronous API URL for authorization
        let apiUrl = `${settings.urlAsyncAPI}/v2/domainTemplates/providers/${providerId}`;
        apiUrl += `/services/${serviceId}/apply`;
        // Add the required parameters
        const queryParams = new URLSearchParams();
        queryParams.append('domain', domain);
        if (host) {
            queryParams.append('host', host);
        }
        // Add redirect URI and state for OAuth flow
        if (redirectUri) {
            queryParams.append('redirect_uri', redirectUri);
        }
        if (state) {
            queryParams.append('state', state);
        }
        // Force permission prompt if requested
        if (forcePermission) {
            queryParams.append('force', 'true');
        }
        // Add all the custom parameters
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, String(value));
        });
        // Add the query string to the URL
        return `${apiUrl}?${queryParams.toString()}`;
    }
}
exports.DomainConnectClient = DomainConnectClient;
//# sourceMappingURL=client.js.map