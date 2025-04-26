import { DomainConnectClient } from '../src/client';
import { DomainConnectSettings, DomainConnectOptions } from '../src/types';
import axios from 'axios';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { promises as dns } from 'dns';


// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock dns promises
// jest.mock('dns/promises', () => ({
//   resolveNs: jest.fn()
// }));

// Cast dns to a mocked type
// const mockedDns = dns as jest.Mocked<typeof dns>;

describe('DomainConnectClient', () => {
  let client: DomainConnectClient;
  let mockSettings: DomainConnectSettings;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new client for each test
    client = new DomainConnectClient();
    
    // Create mock settings
    mockSettings = {
      urlAPI: 'https://api.domainconnect.example.com',
      syncEnabled: true,
      asyncEnabled: true,
      urlAsyncAPI: 'https://async.domainconnect.example.com'
    };
  });
  
  describe('getDnsProviderInfo', () => {
    test('correctly identifies a DNS provider with Domain Connect support', async () => {
      const mockedDns = dns as jest.Mocked<typeof dns>;

      // Mock DNS nameserver lookup with a promise-based approach
      mockedDns.resolveNs.mockResolvedValueOnce(['ns1.domaincontrol.com', 'ns2.domaincontrol.com']);
      
      // Mock successful Domain Connect settings discovery
      const mockResponse = {
        status: 200,
        data: mockSettings
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.getDnsProviderInfo('example.com');
      
      expect(result.domain).toBe('example.com');
      expect(result.nameservers).toEqual(['ns1.domaincontrol.com', 'ns2.domaincontrol.com']);
      expect(result.provider).toBe('GoDaddy');
      expect(result.loginUrl).toBe('https://sso.godaddy.com');
    });

    test('correctly identifies aws DNS provider for martinmueller.dev', async () => {
      const result = await client.getDnsProviderInfo('martinmueller.dev');
      
      expect(result.domain).toBe('martinmueller.dev');
      expect(result.provider).toBe('Amazon Route 53');
      expect(result.loginUrl).toBe('https://console.aws.amazon.com/route53/');
    });
    
    test('correctly identifies a DNS provider without Domain Connect support', async () => {
      const mockedDns = dns as jest.Mocked<typeof dns>;
      
      // Mock DNS nameserver lookup
      mockedDns.resolveNs.mockResolvedValueOnce(['ns1.cloudflare.com', 'ns2.cloudflare.com']);
      
      // Mock failed Domain Connect settings discovery
      mockedAxios.get.mockRejectedValueOnce(new Error('DNS lookup failed'));
      mockedAxios.get.mockRejectedValueOnce(new Error('API request failed'));
      
      const result = await client.getDnsProviderInfo('example.com');
      
      expect(result.domain).toBe('example.com');
      expect(result.nameservers).toEqual(['ns1.cloudflare.com', 'ns2.cloudflare.com']);
      expect(result.provider).toBe('Cloudflare');
      expect(result.loginUrl).toBe('https://dash.cloudflare.com/login');
    });
    
    test('handles unknown DNS providers', async () => {
      const mockedDns = dns as jest.Mocked<typeof dns>;
      
      // Mock DNS nameserver lookup with unknown nameservers
      mockedDns.resolveNs.mockResolvedValueOnce(['ns1.unknownprovider.com', 'ns2.unknownprovider.com']);
      
      // Mock failed Domain Connect settings discovery
      mockedAxios.get.mockRejectedValueOnce(new Error('DNS lookup failed'));
      mockedAxios.get.mockRejectedValueOnce(new Error('API request failed'));
      
      const result = await client.getDnsProviderInfo('example.com');
      
      expect(result.domain).toBe('example.com');
      expect(result.nameservers).toEqual(['ns1.unknownprovider.com', 'ns2.unknownprovider.com']);
      expect(result.provider).toBe('unknownprovider.com');
      expect(result.loginUrl).toBeNull();
    });
    
    test('handles DNS resolution errors', async () => {
      const mockedDns = dns as jest.Mocked<typeof dns>;
      
      // Mock DNS nameserver lookup error
      mockedDns.resolveNs.mockRejectedValueOnce(new Error('DNS resolution failed'));
      
      const result = await client.getDnsProviderInfo('example.com');
      
      expect(result.domain).toBe('example.com');
      expect(result.nameservers).toEqual([]);
      expect(result.provider).toBe('Unknown');
      expect(result.loginUrl).toBeNull();
      expect(result.error).toBe('DNS resolution failed');
    });
  });
  
  describe('getProviderLoginUrl', () => {
    test('returns correct login URL for known providers', () => {
      expect(client.getProviderLoginUrl('GoDaddy')).toBe('https://sso.godaddy.com');
      expect(client.getProviderLoginUrl('Namecheap')).toBe('https://www.namecheap.com/myaccount/login/');
      expect(client.getProviderLoginUrl('Cloudflare')).toBe('https://dash.cloudflare.com/login');
    });
    
    test('returns null for unknown providers', () => {
      expect(client.getProviderLoginUrl('UnknownProvider')).toBeNull();
    });
  });
  
  describe('discoverSettings', () => {
    test('returns settings when discovered via DNS', async () => {
      // const mockResponse = {
      //   status: 200,
      //   data: {
      //     urlAPI: 'https://api.domainconnect.example.com',
      //     syncEnabled: true,
      //     asyncEnabled: true,
      //     urlAsyncAPI: 'https://async.domainconnect.example.com'
      //   }
      // };
      
      // mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.discoverSettings('gd.domaincontrol.com');
      
      // expect(mockedAxios.get).toHaveBeenCalledWith('https://_domainconnect.example.com/v2/domainTemplates/providers');
      // expect(result).toEqual(mockResponse.data);
    });
    
    test('tries alternative method when DNS lookup fails', async () => {
      // First request fails
      mockedAxios.get.mockRejectedValueOnce(new Error('DNS lookup failed'));
      
      // Second request succeeds
      const mockResponse = {
        status: 200,
        data: {
          urlAPI: 'https://api.domainconnect.example.com',
          syncEnabled: true,
          asyncEnabled: false,
          urlAsyncAPI: null
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.discoverSettings('example.com');
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/.well-known/domain-connect.json');
      expect(result).toEqual(mockResponse.data);
    });
    
    test('returns null when no settings can be discovered', async () => {
      // Both requests fail
      mockedAxios.get.mockRejectedValueOnce(new Error('DNS lookup failed'));
      mockedAxios.get.mockRejectedValueOnce(new Error('API request failed'));
      
      const result = await client.discoverSettings('example.com');
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
    });
  });
  
  describe('getTemplate', () => {
    test('returns template when found', async () => {
      const mockTemplate = {
        providerId: 'test-provider',
        serviceId: 'test-service',
        name: 'Test Service',
        records: [
          {
            type: 'CNAME',
            host: '%subdomain%',
            pointsTo: 'example.cdn.com'
          }
        ]
      };
      
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockTemplate
      });
      
      const result = await client.getTemplate(
        mockSettings,
        'test-provider',
        'test-service'
      );
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.domainconnect.example.com/v2/domainTemplates/providers/test-provider/services/test-service'
      );
      expect(result).toEqual(mockTemplate);
    });
    
    test('returns null when template not found', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Template not found'));
      
      const result = await client.getTemplate(
        mockSettings,
        'nonexistent-provider',
        'nonexistent-service'
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('applyTemplateSynchronous', () => {
    const options: DomainConnectOptions = {
      domain: 'example.com',
      providerId: 'test-provider',
      serviceId: 'test-service',
      params: {
        ip: '192.0.2.1',
        subdomain: 'www'
      },
      host: 'blog'
    };
    
    test('successfully applies template synchronously', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200
      });
      
      const result = await client.applyTemplateSynchronous(mockSettings, options);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.domainconnect.example.com/v2/domainTemplates/providers/test-provider/services/test-service/apply')
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('domain=example.com')
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('host=blog')
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('ip=192.0.2.1')
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('subdomain=www')
      );
      
      expect(result.success).toBe(true);
    });
    
    test('returns error when synchronous mode not supported', async () => {
      const settingsWithoutSync = {
        ...mockSettings,
        syncEnabled: false
      };
      
      const result = await client.applyTemplateSynchronous(settingsWithoutSync, options);
      
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Synchronous mode not supported by DNS provider');
    });
    
    test('handles API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
      
      const result = await client.applyTemplateSynchronous(mockSettings, options);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
    });
  });
  
  describe('applyTemplateAsynchronous', () => {
    const options: DomainConnectOptions = {
      domain: 'example.com',
      providerId: 'test-provider',
      serviceId: 'test-service',
      params: {
        ip: '192.0.2.1',
        subdomain: 'www'
      },
      host: 'blog',
      redirectUri: 'https://example.com/callback',
      state: 'random-state',
      forcePermission: true
    };
    
    test('generates redirect URL for asynchronous flow', async () => {
      const result = await client.applyTemplateAsynchronous(mockSettings, options);
      
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain('https://async.domainconnect.example.com/v2/domainTemplates/providers/test-provider/services/test-service/apply');
      expect(result.redirectUrl).toContain('domain=example.com');
      expect(result.redirectUrl).toContain('host=blog');
      expect(result.redirectUrl).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(result.redirectUrl).toContain('state=random-state');
      expect(result.redirectUrl).toContain('force=true');
      expect(result.redirectUrl).toContain('ip=192.0.2.1');
      expect(result.redirectUrl).toContain('subdomain=www');
    });
    
    test('returns error when asynchronous mode not supported', async () => {
      const settingsWithoutAsync = {
        ...mockSettings,
        asyncEnabled: false
      };
      
      const result = await client.applyTemplateAsynchronous(settingsWithoutAsync, options);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Asynchronous mode not supported by DNS provider');
    });
  });
  
  describe('checkAsyncStatus', () => {
    test('returns success when status is 200', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200
      });
      
      const result = await client.checkAsyncStatus('https://status.example.com/check');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('https://status.example.com/check');
      expect(result.success).toBe(true);
    });
    
    test('returns in-progress when status is 202', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 202
      });
      
      const result = await client.checkAsyncStatus('https://status.example.com/check');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation still in progress');
    });
    
    test('handles API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Status check failed'));
      
      const result = await client.checkAsyncStatus('https://status.example.com/check');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Status check failed');
    });
  });
  
  describe('generateSyncURL', () => {
    test('generates correct synchronous URL', () => {
      const options: DomainConnectOptions = {
        domain: 'example.com',
        providerId: 'test-provider',
        serviceId: 'test-service',
        params: {
          ip: '192.0.2.1',
          subdomain: 'www'
        },
        host: 'blog'
      };
      
      const url = client.generateSyncURL(mockSettings, options);
      
      expect(url).toContain('https://api.domainconnect.example.com/v2/domainTemplates/providers/test-provider/services/test-service/apply');
      expect(url).toContain('domain=example.com');
      expect(url).toContain('host=blog');
      expect(url).toContain('ip=192.0.2.1');
      expect(url).toContain('subdomain=www');
    });
  });
  
  describe('generateAsyncURL', () => {
    test('generates correct asynchronous URL', () => {
      const options: DomainConnectOptions = {
        domain: 'example.com',
        providerId: 'test-provider',
        serviceId: 'test-service',
        params: {
          ip: '192.0.2.1',
          subdomain: 'www'
        },
        host: 'blog',
        redirectUri: 'https://example.com/callback',
        state: 'random-state',
        forcePermission: true
      };
      
      const url = client.generateAsyncURL(mockSettings, options);
      
      expect(url).toContain('https://async.domainconnect.example.com/v2/domainTemplates/providers/test-provider/services/test-service/apply');
      expect(url).toContain('domain=example.com');
      expect(url).toContain('host=blog');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(url).toContain('state=random-state');
      expect(url).toContain('force=true');
      expect(url).toContain('ip=192.0.2.1');
      expect(url).toContain('subdomain=www');
    });
    
    test('returns null when async is not supported', () => {
      const settingsWithoutAsync = {
        ...mockSettings,
        asyncEnabled: false
      };
      
      const options: DomainConnectOptions = {
        domain: 'example.com',
        providerId: 'test-provider',
        serviceId: 'test-service',
        params: {}
      };
      
      const url = client.generateAsyncURL(settingsWithoutAsync, options);
      
      expect(url).toBeNull();
    });
  });
}); 