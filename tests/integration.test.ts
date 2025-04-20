import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { DomainConnectClient } from '../src/client';
import { generateRecords, validateParameters } from '../src/utils';
import { Template } from '../src/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Domain Connect Integration', () => {
  const client = new DomainConnectClient();

  // Example template for a web hosting service
  const webHostingTemplate: Template = {
    providerId: 'hosting-provider',
    serviceId: 'web-hosting',
    name: 'Web Hosting Service',
    description: 'Set up DNS for a web hosting service',
    version: '1',
    hostRequired: true,
    syncSupported: true,
    asyncSupported: true,
    parameters: [
      {
        name: 'ip',
        dataType: 'STRING',
        required: true,
        description: 'IP address of the web server'
      },
      {
        name: 'www',
        dataType: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: 'Whether to create a www subdomain'
      }
    ],
    records: [
      {
        type: 'A',
        host: '@',
        pointsTo: '%ip%',
        ttl: 3600
      },
      {
        type: 'A',
        host: 'www',
        pointsTo: '%ip%',
        ttl: 3600
      }
    ]
  };

  // Mock domain connect settings
  const mockSettings = {
    urlAPI: 'https://api.domainconnect.example.com',
    syncEnabled: true,
    asyncEnabled: true,
    urlAsyncAPI: 'https://api.domainconnect.example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-end sync flow', () => {
    test('complete synchronous domain connect flow', async () => {
      // Step 1: Discover settings
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockSettings
      });

      const settings = await client.discoverSettings('example.com');
      expect(settings).not.toBeNull();
      expect(settings?.urlAPI).toBe('https://api.domainconnect.example.com');

      // Step 2: Get template
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: webHostingTemplate
      });

      const template = await client.getTemplate(
        mockSettings,
        'hosting-provider',
        'web-hosting'
      );
      expect(template).not.toBeNull();
      expect(template?.providerId).toBe('hosting-provider');

      // Step 3: Validate parameters
      const params = {
        ip: '192.0.2.10',
        www: true
      };

      const validation = validateParameters(webHostingTemplate, params);
      expect(validation.valid).toBe(true);

      // Step 4: Apply template synchronously
      mockedAxios.get.mockResolvedValueOnce({
        status: 200
      });

      const applyResult = await client.applyTemplateSynchronous(mockSettings, {
        domain: 'example.com',
        providerId: 'hosting-provider',
        serviceId: 'web-hosting',
        host: 'blog',
        params
      });

      expect(applyResult.success).toBe(true);

      // Verify the records that would be created
      const generatedRecords = generateRecords(webHostingTemplate, params, 'example.com', 'blog');
      
      expect(generatedRecords).toHaveLength(2);
      expect(generatedRecords[0]).toEqual({
        type: 'A',
        host: 'blog',
        pointsTo: '192.0.2.10',
        ttl: 3600
      });
      
      expect(generatedRecords[1]).toEqual({
        type: 'A',
        host: 'www.blog',
        pointsTo: '192.0.2.10',
        ttl: 3600
      });
    });
  });

  describe('End-to-end async flow', () => {
    test('complete asynchronous domain connect flow', async () => {
      // Step 1: Discover settings
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockSettings
      });

      const settings = await client.discoverSettings('example.com');
      expect(settings).not.toBeNull();

      // Step 2: Get template
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: webHostingTemplate
      });

      const template = await client.getTemplate(
        mockSettings,
        'hosting-provider',
        'web-hosting'
      );
      expect(template).not.toBeNull();

      // Step 3: Validate parameters
      const params = {
        ip: '192.0.2.10',
        www: true
      };

      const validation = validateParameters(webHostingTemplate, params);
      expect(validation.valid).toBe(true);

      // Step 4: Generate consent URL
      const asyncResult = await client.applyTemplateAsynchronous(mockSettings, {
        domain: 'example.com',
        providerId: 'hosting-provider',
        serviceId: 'web-hosting',
        host: 'blog',
        params,
        redirectUri: 'https://hosting-provider.example/callback',
        state: 'random-state',
        forcePermission: false
      });

      expect(asyncResult.success).toBe(true);
      expect(asyncResult.redirectUrl).toContain('https://api.domainconnect.example.com');
      expect(asyncResult.redirectUrl).toContain('hosting-provider');
      expect(asyncResult.redirectUrl).toContain('web-hosting');
      expect(asyncResult.redirectUrl).toContain('domain=example.com');
      expect(asyncResult.redirectUrl).toContain('ip=192.0.2.10');

      // Step 5: Check status (simulating callback after user approves)
      mockedAxios.get.mockResolvedValueOnce({
        status: 200
      });

      // Simulate a status URL that would be returned after consent
      const statusUrl = 'https://api.domainconnect.example.com/v2/domainTemplates/status/abc123';
      const statusResult = await client.checkAsyncStatus(statusUrl);

      expect(statusResult.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('handles invalid parameters', () => {
      const params = {
        // Missing required 'ip' parameter
        www: true
      };

      const validation = validateParameters(webHostingTemplate, params);
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('ip');
    });

    test('handles DNS provider not supporting Domain Connect', async () => {
      // Both discovery methods fail
      mockedAxios.get.mockRejectedValueOnce(new Error('DNS lookup failed'));
      mockedAxios.get.mockRejectedValueOnce(new Error('API request failed'));

      const settings = await client.discoverSettings('example.com');
      expect(settings).toBeNull();
    });

    test('handles template not found', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Template not found'));

      const template = await client.getTemplate(
        mockSettings,
        'nonexistent-provider',
        'nonexistent-service'
      );

      expect(template).toBeNull();
    });

    test('handles API errors in synchronous flow', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      const result = await client.applyTemplateSynchronous(mockSettings, {
        domain: 'example.com',
        providerId: 'hosting-provider',
        serviceId: 'web-hosting',
        host: 'blog',
        params: { ip: '192.0.2.10' }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
    });
  });
}); 