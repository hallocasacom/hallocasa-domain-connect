/**
 * Domain Connect TypeScript Library - Basic Usage Example
 */

import { DomainConnectClient, validateParameters, Template } from '../src';

/**
 * Synchronous Flow Example
 */
async function synchronousExample() {
  const client = new DomainConnectClient();
  const domain = 'example.com';

  try {
    // Step 1: Discover settings
    console.log(`Discovering Domain Connect settings for ${domain}...`);
    const settings = await client.discoverSettings(domain);
    
    if (!settings) {
      console.error('Domain does not support Domain Connect');
      return;
    }
    
    console.log('Domain Connect settings discovered:', settings);
    
    // Check if synchronous mode is supported
    if (!settings.syncEnabled) {
      console.error('Synchronous mode not supported for this domain');
      return;
    }
    
    // Step 2: Define service parameters
    const options = {
      domain,
      providerId: 'hosting-provider',
      serviceId: 'web-hosting',
      params: {
        ip: '192.0.2.10',
        www: true
      },
      host: 'blog'
    };
    
    // Step 3: Apply template synchronously
    console.log('Applying template synchronously...');
    const result = await client.applyTemplateSynchronous(settings, options);
    
    if (result.success) {
      console.log('DNS records applied successfully');
    } else {
      console.error('Failed to apply DNS records:', result.error);
    }
  } catch (error) {
    console.error('Error in synchronous flow:', error);
  }
}

/**
 * Asynchronous Flow Example
 */
async function asynchronousExample() {
  const client = new DomainConnectClient();
  const domain = 'example.com';
  
  try {
    // Step 1: Discover settings
    console.log(`Discovering Domain Connect settings for ${domain}...`);
    const settings = await client.discoverSettings(domain);
    
    if (!settings) {
      console.error('Domain does not support Domain Connect');
      return;
    }
    
    console.log('Domain Connect settings discovered:', settings);
    
    // Check if asynchronous mode is supported
    if (!settings.asyncEnabled) {
      console.error('Asynchronous mode not supported for this domain');
      return;
    }
    
    // Step 2: Define service parameters
    const options = {
      domain,
      providerId: 'hosting-provider',
      serviceId: 'web-hosting',
      params: {
        ip: '192.0.2.10',
        www: true
      },
      host: 'blog',
      redirectUri: 'https://your-app.example/callback',
      state: 'random-state-token',
      forcePermission: false
    };
    
    // Step 3: Generate authorization URL
    console.log('Generating authorization URL...');
    const asyncResult = await client.applyTemplateAsynchronous(settings, options);
    
    if (asyncResult.success && asyncResult.redirectUrl) {
      console.log('Redirect user to:', asyncResult.redirectUrl);
      console.log('After user authorizes, they will be redirected back to your callback URL');
      
      // Step 4: In your callback handler, you'd get the status URL
      // This is just a simulation for the example
      const statusUrl = 'https://api.domainconnect.example.com/v2/domainTemplates/status/abc123';
      
      // Step 5: Check status
      console.log('Checking status...');
      const statusResult = await client.checkAsyncStatus(statusUrl);
      
      if (statusResult.success) {
        console.log('DNS records applied successfully');
      } else {
        console.error('Failed to apply DNS records:', statusResult.error);
      }
    } else {
      console.error('Failed to generate authorization URL:', asyncResult.error);
    }
  } catch (error) {
    console.error('Error in asynchronous flow:', error);
  }
}

/**
 * Template Validation Example
 */
function templateValidationExample() {
  // A simple template example
  const template: Template = {
    providerId: 'hosting-provider',
    serviceId: 'web-hosting',
    parameters: [
      { name: 'ip', dataType: 'STRING', required: true },
      { name: 'www', dataType: 'BOOLEAN', required: false }
    ],
    records: [
      { type: 'A', host: '@', pointsTo: '%ip%' },
      { type: 'A', host: 'www', pointsTo: '%ip%' }
    ]
  };
  
  // Valid parameters
  const validParams = {
    ip: '192.0.2.10',
    www: true
  };
  
  // Invalid parameters (missing required 'ip')
  const invalidParams = {
    www: true
  };
  
  // Validate parameters
  const validResult = validateParameters(template, validParams);
  const invalidResult = validateParameters(template, invalidParams);
  
  console.log('Valid parameters check:', validResult);
  console.log('Invalid parameters check:', invalidResult);
}

// Run examples (in a real app, you'd call these separately)
// synchronousExample();
// asynchronousExample();
// templateValidationExample(); 