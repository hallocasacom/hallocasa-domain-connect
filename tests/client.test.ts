import { DomainConnectClient } from '../src/client';
import { DomainConnectSettings, DomainConnectOptions } from '../src/types';
import axios from 'axios';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
  
  describe('discoverSettings', () => {
    test('returns settings when discovered via DNS', async () => {
      const mockResponse = {
        status: 200,
        data: {
          urlAPI: 'https://api.domainconnect.example.com',
          syncEnabled: true,
          asyncEnabled: true,
          urlAsyncAPI: 'https://async.domainconnect.example.com'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.discoverSettings('example.com');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('https://_domainconnect.example.com/v2/domainTemplates/providers');
      expect(result).toEqual(mockResponse.data);
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