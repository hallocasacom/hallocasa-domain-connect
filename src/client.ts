import axios from 'axios';
import { 
  DomainConnectSettings, 
  DomainConnectOptions, 
  DomainConnectResult,
  Template
} from './types';

/**
 * Domain Connect client for discovering settings and applying templates
 */
export class DomainConnectClient {
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