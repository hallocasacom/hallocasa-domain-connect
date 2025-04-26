import axios from 'axios';
import { 
  DomainConnectSettings, 
  DomainConnectOptions, 
  DomainConnectResult,
  Template,
  DnsProviderInfo
} from './types';
import { promises as dns } from 'dns';

/**
 * Domain Connect client for discovering settings and applying templates
 */
export class DomainConnectClient {
  
  // Map of common DNS providers based on nameserver patterns
  private dnsProviders: Record<string, { domains: string[], loginUrl: string }> = {
    'Cloudflare': { 
      domains: ['cloudflare.com', 'cloudflare-dns.com'],
      loginUrl: 'https://dash.cloudflare.com/login'
    },
    'GoDaddy': { 
      domains: ['domaincontrol.com', 'godaddy.com'],
      loginUrl: 'https://sso.godaddy.com'
    },
    'Namecheap': { 
      domains: ['registrar-servers.com', 'namecheap.com'],
      loginUrl: 'https://www.namecheap.com/myaccount/login/'
    },
    'Google Domains': { 
      domains: ['googledomains.com', 'domains.google.com'],
      loginUrl: 'https://domains.google.com/registrar/login'
    },
    'Amazon Route 53': { 
      domains: ['awsdns'],
      loginUrl: 'https://console.aws.amazon.com/route53/'
    },
    'DigitalOcean': { 
      domains: ['digitalocean.com'],
      loginUrl: 'https://cloud.digitalocean.com/login'
    },
    'Bluehost': { 
      domains: ['bluehost.com'],
      loginUrl: 'https://my.bluehost.com/hosting/login'
    },
    'HostGator': { 
      domains: ['hostgator.com'],
      loginUrl: 'https://portal.hostgator.com/login'
    },
    'DreamHost': { 
      domains: ['dreamhost.com'],
      loginUrl: 'https://panel.dreamhost.com/login'
    },
    'Name.com': { 
      domains: ['name.com'],
      loginUrl: 'https://www.name.com/account/login'
    },
    'OVH': { 
      domains: ['ovh.net'],
      loginUrl: 'https://www.ovh.com/auth/'
    },
    '1&1 IONOS': { 
      domains: ['1and1.com', 'ionos.com'],
      loginUrl: 'https://login.ionos.com'
    },
  };
  
  /**
   * Gets the login URL for a DNS provider
   * @param provider Name of the DNS provider
   * @returns The login URL for the provider or null if not found
   */
  public getProviderLoginUrl(provider: string): string | null {
    if (this.dnsProviders[provider]) {
      return this.dnsProviders[provider].loginUrl;
    }
    return null;
  }
  
  /**
   * Discovers the DNS provider for a domain and checks if Domain Connect is supported
   * @param domain The domain to check
   * @returns Information about the DNS provider and Domain Connect support
   */
  public async getDnsProviderInfo(domain: string): Promise<DnsProviderInfo> {
    try {
      // Get nameservers for the domain using our safe method
      const nameservers = await dns.resolveNs(domain);
      
      // Determine the DNS provider
      const provider = this.identifyDnsProvider(nameservers);
      
      // Get the login URL
      const loginUrl = provider ? this.getProviderLoginUrl(provider) : null;
      
      return {
        domain,
        nameservers,
        provider: provider || 'Unknown',
        loginUrl
      };
    } catch (error) {
      // If any part of the process fails, return basic error info
      return {
        domain,
        nameservers: [],
        provider: 'Unknown',
        loginUrl: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Identifies the DNS provider based on nameservers
   * @param nameservers Array of nameserver hostnames
   * @returns The identified provider name or null if unknown
   */
  private identifyDnsProvider(nameservers: string[]): string | null {
    if (!nameservers || nameservers.length === 0) {
      return null;
    }
    
    // Convert nameservers to lowercase for comparison
    const lowerNameservers = nameservers.map(ns => ns.toLowerCase());
    
    // Check against known providers
    for (const [provider, { domains }] of Object.entries(this.dnsProviders)) {
      if (domains.some(domain => 
        lowerNameservers.some(ns => ns.includes(domain.toLowerCase()))
      )) {
        return provider;
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
    } catch (e) {
      // Ignore parsing errors
    }
    
    return null;
  }
  
  /**
   * Discover Domain Connect settings for a domain
   * @param domain Domain name to discover settings for
   * @returns Promise resolving to Domain Connect settings or null if not found
   */
  async discoverSettings(domain: string): Promise<DomainConnectSettings | null> {
    try {
      // First try to get settings from _domainconnect.{domain}
      const dnsQuery = `_domainconnect.${domain}`;
      
      try {
        // In a real implementation, this would do an actual DNS query
        // Here we simulate a DNS lookup with an HTTP request to a well-known endpoint
        const response = await axios.get(`https://${dnsQuery}/v2/domainTemplates/providers`);
        
        if (response.status === 200 && response.data) {
          return {
            urlAPI: response.data.urlAPI,
            syncEnabled: response.data.syncEnabled,
            asyncEnabled: response.data.asyncEnabled,
            urlAsyncAPI: response.data.urlAsyncAPI
          };
        }
      } catch (error) {
        // DNS lookup failed, try the alternative method
        console.log(`DNS lookup failed for ${dnsQuery}, trying alternative method`);
      }
      
      // Alternative method: try getting settings from the domain's API directly
      try {
        const response = await axios.get(`https://${domain}/.well-known/domain-connect.json`);
        
        if (response.status === 200 && response.data) {
          return {
            urlAPI: response.data.urlAPI,
            syncEnabled: response.data.syncEnabled,
            asyncEnabled: response.data.asyncEnabled,
            urlAsyncAPI: response.data.urlAsyncAPI
          };
        }
      } catch (error) {
        console.log(`Alternative method failed for ${domain}`);
      }
      
      return null;
    } catch (error) {
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
  async getTemplate(
    settings: DomainConnectSettings,
    providerId: string,
    serviceId: string
  ): Promise<Template | null> {
    try {
      const templateUrl = `${settings.urlAPI}/v2/domainTemplates/providers/${providerId}/services/${serviceId}`;
      const response = await axios.get(templateUrl);
      
      if (response.status === 200 && response.data) {
        return response.data as Template;
      }
      
      return null;
    } catch (error) {
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
  async applyTemplateSynchronous(
    settings: DomainConnectSettings,
    options: DomainConnectOptions
  ): Promise<DomainConnectResult> {
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
      const response = await axios.get(apiUrl);
      
      if (response.status === 200) {
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: `Unexpected status code: ${response.status}`
        };
      }
    } catch (error) {
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
  async applyTemplateAsynchronous(
    settings: DomainConnectSettings,
    options: DomainConnectOptions
  ): Promise<DomainConnectResult> {
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
    } catch (error) {
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
  async checkAsyncStatus(statusUrl: string): Promise<DomainConnectResult> {
    try {
      const response = await axios.get(statusUrl);
      
      if (response.status === 200) {
        return {
          success: true
        };
      } else if (response.status === 202) {
        return {
          success: false,
          error: 'Operation still in progress'
        };
      } else {
        return {
          success: false,
          error: `Unexpected status code: ${response.status}`
        };
      }
    } catch (error) {
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
  generateSyncURL(
    settings: DomainConnectSettings,
    options: DomainConnectOptions
  ): string {
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
  generateAsyncURL(
    settings: DomainConnectSettings,
    options: DomainConnectOptions
  ): string | null {
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