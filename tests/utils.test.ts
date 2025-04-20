import { describe, test, expect } from '@jest/globals';
import { 
  generateRecords, 
  replaceVariables, 
  validateParameters, 
  splitHostname,
  parseRedirectUri,
  formatSettingsUrl
} from '../src/utils';
import { Template, TemplateRecord } from '../src/types';

describe('Domain Connect Utils', () => {
  describe('replaceVariables', () => {
    test('replaces variables with values from params', () => {
      const text = 'This is a %variable% with %multiple% replacements';
      const params = {
        variable: 'test',
        multiple: 'different'
      };
      
      const result = replaceVariables(text, params);
      expect(result).toBe('This is a test with different replacements');
    });
    
    test('handles numeric and boolean values', () => {
      const text = 'Count: %count%, Enabled: %enabled%';
      const params = {
        count: 42,
        enabled: true
      };
      
      const result = replaceVariables(text, params);
      expect(result).toBe('Count: 42, Enabled: true');
    });
    
    test('preserves variables that are not in params', () => {
      const text = 'This is %undefined% but %defined% is replaced';
      const params = {
        defined: 'value'
      };
      
      const result = replaceVariables(text, params);
      expect(result).toBe('This is %undefined% but value is replaced');
    });
  });
  
  describe('validateParameters', () => {
    const template: Template = {
      providerId: 'example-provider',
      serviceId: 'example-service',
      records: [],
      parameters: [
        { name: 'required1', required: true },
        { name: 'required2', required: true },
        { name: 'optional', required: false }
      ]
    };
    
    test('returns valid for complete parameters', () => {
      const params = {
        required1: 'value1',
        required2: 'value2'
      };
      
      const result = validateParameters(template, params);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
    
    test('returns invalid with missing parameters', () => {
      const params = {
        required1: 'value1'
      };
      
      const result = validateParameters(template, params);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(['required2']);
    });
    
    test('handles templates with no parameters', () => {
      const noParamsTemplate: Template = {
        providerId: 'example-provider',
        serviceId: 'example-service',
        records: []
      };
      
      const result = validateParameters(noParamsTemplate, {});
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });
  
  describe('generateRecords', () => {
    const template: Template = {
      providerId: 'example-provider',
      serviceId: 'example-service',
      records: [
        {
          type: 'CNAME',
          host: '%subdomain%',
          pointsTo: '%target%'
        },
        {
          type: 'A',
          host: '@',
          pointsTo: '%ip%'
        },
        {
          type: 'TXT',
          host: '%host%',
          pointsTo: 'verification=%code%'
        }
      ]
    };
    
    const params = {
      subdomain: 'www',
      target: 'example.cdn.com',
      ip: '192.0.2.1',
      code: 'abc123'
    };
    
    test('generates records with variable substitution', () => {
      const domain = 'example.com';
      const records = generateRecords(template, params, domain);
      
      expect(records).toHaveLength(3);
      
      expect(records[0]).toEqual({
        type: 'CNAME',
        host: 'www',
        pointsTo: 'example.cdn.com'
      });
      
      expect(records[1]).toEqual({
        type: 'A',
        host: '@',
        pointsTo: '192.0.2.1'
      });
      
      expect(records[2]).toEqual({
        type: 'TXT',
        host: '@',
        pointsTo: 'verification=abc123'
      });
    });
    
    test('handles host substitution correctly', () => {
      const domain = 'example.com';
      const host = 'app';
      const records = generateRecords(template, params, domain, host);
      
      expect(records).toHaveLength(3);
      
      expect(records[0]).toEqual({
        type: 'CNAME',
        host: 'www.app',
        pointsTo: 'example.cdn.com'
      });
      
      expect(records[1]).toEqual({
        type: 'A',
        host: 'app',
        pointsTo: '192.0.2.1'
      });
      
      expect(records[2]).toEqual({
        type: 'TXT',
        host: 'app',
        pointsTo: 'verification=abc123'
      });
    });
  });
  
  describe('splitHostname', () => {
    test('extracts domain and subdomain correctly', () => {
      expect(splitHostname('www.example.com')).toEqual({
        domain: 'example.com',
        subdomain: 'www'
      });
      
      expect(splitHostname('example.com')).toEqual({
        domain: 'example.com'
      });
      
      expect(splitHostname('sub.domain.example.com')).toEqual({
        domain: 'example.com',
        subdomain: 'sub.domain'
      });
    });
    
    test('handles special TLDs correctly', () => {
      expect(splitHostname('www.example.co.uk')).toEqual({
        domain: 'example.co.uk',
        subdomain: 'www'
      });
      
      expect(splitHostname('example.co.uk')).toEqual({
        domain: 'example.co.uk'
      });
    });
  });
  
  describe('parseRedirectUri', () => {
    test('extracts state and code correctly', () => {
      const uri = 'https://example.com/callback?state=abcdef&code=123456';
      const result = parseRedirectUri(uri);
      
      expect(result).toEqual({
        state: 'abcdef',
        code: '123456'
      });
    });
    
    test('handles missing parameters', () => {
      const uri = 'https://example.com/callback?state=abcdef';
      const result = parseRedirectUri(uri);
      
      expect(result).toEqual({
        state: 'abcdef',
        code: undefined
      });
    });
    
    test('handles invalid URIs', () => {
      const uri = 'invalid-uri';
      const result = parseRedirectUri(uri);
      
      expect(result).toEqual({});
    });
  });
  
  describe('formatSettingsUrl', () => {
    test('creates default settings for a domain', () => {
      const domain = 'example.com';
      const settings = formatSettingsUrl(domain);
      
      expect(settings).toEqual({
        urlAPI: 'https://api.domainconnect.example.com',
        syncEnabled: true,
        asyncEnabled: true,
        urlAsyncAPI: 'https://api.domainconnect.example.com'
      });
    });
    
    test('overrides default settings with provided values', () => {
      const domain = 'example.com';
      const overrides = {
        syncEnabled: false,
        urlAsyncAPI: 'https://async.domainconnect.example.com'
      };
      
      const settings = formatSettingsUrl(domain, overrides);
      
      expect(settings).toEqual({
        urlAPI: 'https://api.domainconnect.example.com',
        syncEnabled: false,
        asyncEnabled: true,
        urlAsyncAPI: 'https://async.domainconnect.example.com'
      });
    });
  });
}); 