# Domain Connect TypeScript Library

A TypeScript implementation of the [Domain Connect](https://www.domainconnect.org/) protocol, which simplifies the process of adding DNS records when integrating domains with service providers.

## Installation

```bash
npm install domain-connect-ts
```

## Usage

### Basic Example

```typescript
import { DomainConnectClient } from 'domain-connect-ts';

const client = new DomainConnectClient();

// Discover Domain Connect settings for a domain
async function setupDomain() {
  // Step 1: Discover settings
  const settings = await client.discoverSettings('example.com');
  if (!settings) {
    console.error('Domain does not support Domain Connect');
    return;
  }

  // Step 2: Apply a template synchronously
  const result = await client.applyTemplateSynchronous(settings, {
    domain: 'example.com',
    providerId: 'hosting-provider',
    serviceId: 'web-hosting',
    params: {
      ip: '192.0.2.1',
      www: true
    }
  });

  if (result.success) {
    console.log('DNS records applied successfully');
  } else {
    console.error('Failed to apply DNS records:', result.error);
  }
}

setupDomain();
```

### Asynchronous Flow (with user consent)

```typescript
import { DomainConnectClient } from 'domain-connect-ts';

const client = new DomainConnectClient();

// Start the async flow
async function startAsyncFlow() {
  // Step 1: Discover settings
  const settings = await client.discoverSettings('example.com');
  if (!settings) {
    console.error('Domain does not support Domain Connect');
    return;
  }

  // Step 2: Get URL for user consent
  const asyncResult = await client.applyTemplateAsynchronous(settings, {
    domain: 'example.com',
    providerId: 'hosting-provider',
    serviceId: 'web-hosting',
    params: {
      ip: '192.0.2.1',
      www: true
    },
    redirectUri: 'https://your-app.example/callback',
    state: 'random-state-token'
  });

  if (asyncResult.success && asyncResult.redirectUrl) {
    // Redirect the user to the consent URL
    console.log('Redirect user to:', asyncResult.redirectUrl);
  } else {
    console.error('Failed to start async flow:', asyncResult.error);
  }
}

// Handle the callback after user consent
async function handleCallback(statusUrl: string) {
  const statusResult = await client.checkAsyncStatus(statusUrl);
  
  if (statusResult.success) {
    console.log('DNS records applied successfully');
  } else {
    console.error('Failed to apply DNS records:', statusResult.error);
  }
}

startAsyncFlow();
```

### Utility Functions

```typescript
import { 
  generateRecords, 
  validateParameters, 
  splitHostname,
  supportsDomainConnect
} from 'domain-connect-ts';

// Check if a domain supports Domain Connect
const supported = await supportsDomainConnect('example.com');

// Split a hostname into domain and subdomain
const { domain, subdomain } = splitHostname('www.example.com');
// domain: 'example.com', subdomain: 'www'

// Validate template parameters
const validation = validateParameters(template, {
  ip: '192.0.2.1'
});

if (!validation.valid) {
  console.error('Missing parameters:', validation.missing.join(', '));
}

// Generate DNS records from a template
const records = generateRecords(template, params, 'example.com', 'blog');
```

## API Reference

### DomainConnectClient

* `discoverSettings(domain: string): Promise<DomainConnectSettings | null>`
* `getTemplate(settings: DomainConnectSettings, providerId: string, serviceId: string): Promise<Template | null>`
* `applyTemplateSynchronous(settings: DomainConnectSettings, options: DomainConnectOptions): Promise<DomainConnectResult>`
* `applyTemplateAsynchronous(settings: DomainConnectSettings, options: DomainConnectOptions): Promise<DomainConnectResult>`
* `checkAsyncStatus(statusUrl: string): Promise<DomainConnectResult>`
* `generateSyncURL(settings: DomainConnectSettings, options: DomainConnectOptions): string`
* `generateAsyncURL(settings: DomainConnectSettings, options: DomainConnectOptions): string | null`

### Utility Functions

* `generateRecords(template: Template, params: Record<string, any>, domain: string, host?: string): TemplateRecord[]`
* `replaceVariables(text: string, params: Record<string, any>): string`
* `validateParameters(template: Template, params: Record<string, any>): { valid: boolean; missing: string[] }`
* `convertToPunycode(domain: string): string`
* `supportsDomainConnect(domain: string): Promise<boolean>`
* `splitHostname(hostname: string): { domain: string; subdomain?: string }`
* `parseRedirectUri(redirectUri: string): { state?: string; code?: string }`
* `formatSettingsUrl(domain: string, settings?: Partial<DomainConnectSettings>): DomainConnectSettings`

## License

MIT 