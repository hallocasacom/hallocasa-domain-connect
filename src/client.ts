import axios from 'axios';
import { 
  DomainConnectSettings, 
  DomainConnectOptions, 
  DomainConnectResult,
  Template,
  DnsProviderInfo,
  DnsProvider
} from './types';
import { promises as dns } from 'dns';

/**
 * Domain Connect client for discovering settings and applying templates
 */
export class DomainConnectClient {
  
  // Map of common DNS providers based on nameserver patterns
  private dnsProviders: DnsProvider[] = [
    {
      name: '1&1 IONOS',
      domains: ['1and1.com', 'ionos.com'],
      loginUrl: 'https://login.ionos.com',
      iconUrl: 'https://www.ionos.com/favicon.ico',
      cnameInstructions: '1. Login to IONOS Control Panel\n2. Go to "Domains & SSL"\n3. Select your domain\n4. Click on "DNS"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Prefix" field\n8. Enter the target domain in the "Value" field\n9. Click "Save"'
    },
    {
      name: '123-Reg',
      domains: ['123-reg.com'],
      loginUrl: 'https://sso.123-reg.co.uk/',
      iconUrl: 'https://img1.wsimg.com/cdn/Image/All/Website/1/en-GB/d9dffa7e-f966-4d54-a159-f351362c9fbc/android-chrome-192x192.png',
      cnameInstructions: '1. Login to 123-Reg\n2. Go to "Manage Domains"\n3. Select your domain\n4. Click "Manage DNS"\n5. Click "Add New Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Value" field\n9. Click "Add Record"'
    },
    {
      name: 'A2Hosting',
      domains: ['a2hosting.com'],
      loginUrl: 'https://www.a2hosting.com/login',
      iconUrl: 'https://www.a2hosting.com/favicon.ico',
      cnameInstructions: '1. Login to A2Hosting\n2. Navigate to "Domains"\n3. Select your domain\n4. Click "DNS Management"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Value" field\n9. Click "Save Changes"'
    },
    {
      name: 'Amazon Route 53',
      domains: ['awsdns', 'aws.amazon.com'],
      loginUrl: 'https://console.aws.amazon.com/route53/',
      iconUrl: 'https://aws.amazon.com/favicon.ico',
      cnameInstructions: '1. Login to AWS Console\n2. Navigate to Route 53\n3. Click on "Hosted zones"\n4. Select your domain name\n5. Click "Create Record Set"\n6. Enter the hostname in the "Name" field\n7. Select "CNAME" as the "Type"\n8. Enter the target domain in the "Value" field\n9. Click "Create"'
    },
    {
      name: 'Arsys',
      domains: ['arsys.net'],
      loginUrl: 'https://www.arsys.es/clientes',
      iconUrl: 'https://www.arsys.es/favicon.ico',
      cnameInstructions: '1. Login to Arsys\n2. Go to "Dominios"\n3. Select your domain\n4. Click "Gestionar DNS"\n5. Click "Añadir registro"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Nombre" field\n8. Enter the target domain in the "Valor" field\n9. Click "Guardar"'
    },
    {
      name: 'Aruba IT',
      domains: ['aruba.it'],
      loginUrl: 'https://www.arubacloud.com/login.aspx',
      iconUrl: 'https://logo.clearbit.com/arubacloud.com',
      cnameInstructions: '1. Login to Aruba Control Panel\n2. Navigate to "Domains"\n3. Select your domain\n4. Click "DNS Zone"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
    },
    {
      name: 'Bluehost',
      domains: ['bluehost.com'],
      loginUrl: 'https://www.bluehost.com/my-account/login',
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
      name: 'Crazy Domains',
      domains: ['crazydomains.com'],
      loginUrl: 'https://www.crazydomains.com/login/',
      iconUrl: 'https://www.crazydomains.com/favicon.ico',
      cnameInstructions: '1. Login to Crazy Domains\n2. Go to "My Domains"\n3. Select your domain\n4. Click "Manage DNS"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
    },
    {
      name: 'DigitalOcean',
      domains: ['digitalocean.com'],
      loginUrl: 'https://cloud.digitalocean.com/login',
      iconUrl: 'https://assets.digitalocean.com/favicon.ico',
      cnameInstructions: '1. Login to DigitalOcean\n2. Navigate to "Networking"\n3. Click on "Domains"\n4. Select your domain\n5. Click "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Hostname" field\n8. Enter the target domain in the "Is an alias of" field\n9. Click "Create Record"'
    },
    {
      name: 'DNSimple',
      domains: ['dnsimple.com'],
      loginUrl: 'https://dnsimple.com/login',
      iconUrl: 'https://dnsimple.com/favicon.ico',
      cnameInstructions: '1. Login to DNSimple\n2. Click on your domain\n3. Go to "DNS" tab\n4. Click "Add Record"\n5. Select "CNAME" from the dropdown\n6. Enter the hostname in the "Name" field\n7. Enter the target domain in the "Content" field\n8. Click "Add Record"'
    },
    {
      name: 'Domain.com',
      domains: ['domain.com', 'domain-dns.com'],
      loginUrl: 'https://www.domain.com/my-account/login',
      iconUrl: 'https://www.domain.com/favicon.ico',
      cnameInstructions: '1. Login to Domain.com\n2. Go to "My Domains"\n3. Find and click on your domain\n4. Scroll down and click Advanced Tools \n5. Click Advanced DNS Records -> Manage\n6. Click "Add Record"\n7. Select "CNAME" as the record type\n8. Enter the hostname in the "Host" field\n9. Enter the target domain in the "Points to" field\n10. Click "Save Changes"'
    },
    {
      name: 'DreamHost',
      domains: ['dreamhost.com'],
      loginUrl: 'https://panel.dreamhost.com/',
      iconUrl: 'https://panel.dreamhost.com/favicon.ico',
      cnameInstructions: '1. Login to DreamHost Panel\n2. Go to "Domains" > "Manage Domains"\n3. Click on your domain name\n4. Click "DNS" tab\n5. Scroll to "Add Record"\n6. Select "CNAME" record type\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Value" field\n9. Click "Add Record Now"'
    },
    {
      name: 'Dynadot',
      domains: ['dynadot.com'],
      loginUrl: 'https://www.dynadot.com/account/',
      iconUrl: 'https://www.dynadot.com/favicon.ico',
      cnameInstructions: '1. Login to Dynadot\n2. Go to "Domains"\n3. Select your domain\n4. Click "Manage DNS"\n5. Click "Add Record"\n6. Select "CNAME" from the type dropdown\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Content" field\n9. Click "Save"'
    },
    {
      name: 'EasyDNS',
      domains: ['easydns.com'],
      loginUrl: 'https://cp.easydns.com/login.php',
      iconUrl: 'https://www.easydns.com/favicon.ico',
      cnameInstructions: '1. Login to EasyDNS\n2. Go to "Domains"\n3. Click on your domain\n4. Select "DNS" tab\n5. Click "Add New Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Hostname" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
    },
    {
      name: 'Enom',
      domains: ['enom.com'],
      loginUrl: 'https://cp.enom.com/',
      iconUrl: 'https://149463845.v2.pressablecdn.com/wp-content/uploads/2022/12/cropped-enom-favicon-cropped-32x32.png',
      cnameInstructions: '1. Login to Enom\n2. Go to "Domains"\n3. Select your domain\n4. Click "Manage DNS"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Address" field\n9. Click "Save"'
    },
    {
      name: 'Fasthosts',
      domains: ['fasthosts.co.uk'],
      loginUrl: 'https://login.fasthosts.co.uk/',
      iconUrl: 'https://www.fasthosts.co.uk/favicon.ico',
      cnameInstructions: '1. Login to Fasthosts\n2. Navigate to "Domains"\n3. Select your domain\n4. Click "Manage DNS"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
    },
    {
      name: 'Gandi',
      domains: ['gandi.net'],
      loginUrl: 'https://id.gandi.net/login',
      iconUrl: 'https://www.gandi.net/favicon.ico',
      cnameInstructions: '1. Login to Gandi\n2. Go to "Domain Names"\n3. Select your domain\n4. Click "DNS Records"\n5. Click "Add" button\n6. Select "CNAME" from the record type dropdown\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Value" field\n9. Click "Create record"'
    },
    {
      name: 'GoDaddy',
      domains: ['domaincontrol.com', 'godaddy.com'],
      loginUrl: 'https://sso.godaddy.com',
      iconUrl: 'https://img6.wsimg.com/ux/favicon/favicon.ico',
      cnameInstructions: '1. Login to GoDaddy\n2. Go to your Domain List\n3. Click on the domain you want to manage\n4. Click "DNS"\n5. Scroll to the "Records" section\n6. Click "Add" and select "CNAME"\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
    },
    {
      name: 'Hetzner',
      domains: ['hetzner.com'],
      loginUrl: 'https://accounts.hetzner.com/login',
      iconUrl: 'https://www.hetzner.com/favicon.ico',
      cnameInstructions: '1. Login to Hetzner Console\n2. Navigate to "DNS"\n3. Select your zone\n4. Click "Add Record"\n5. Select "CNAME" as the type\n6. Enter the hostname in the "Name" field\n7. Enter the target domain in the "Value" field\n8. Click "Save"'
    },
    {
      name: 'Home.pl',
      domains: ['home.pl'],
      loginUrl: 'https://home.pl/login',
      iconUrl: 'https://home.pl/img/home/base/favicon/favicon-32x32.png',
      cnameInstructions: '1. Login to Home.pl\n2. Go to "Domains"\n3. Select your domain\n4. Click "DNS Settings"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Subdomain" field\n8. Enter the target domain in the "Target" field\n9. Click "Save"'
    },
    {
      name: 'HostGator',
      domains: ['hostgator.com'],
      loginUrl: 'https://portal.hostgator.com/login',
      iconUrl: 'https://www.hostgator.com/favicon.ico',
      cnameInstructions: '1. Login to HostGator\n2. Navigate to "Domains"\n3. Click on your domain\n4. Click "DNS Records"\n5. Scroll to "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Content" field\n9. Click "Add Record"'
    },
    {
      name: 'Hostgator BR',
      domains: ['hostgator.com.br'],
      loginUrl: 'https://financeiro.hostgator.com.br/',
      iconUrl: 'https://www.hostgator.com/favicon.ico',
      cnameInstructions: '1. Login to Hostgator BR\n2. Navigate to "Meus Domínios"\n3. Click on your domain\n4. Click "Gerenciar DNS"\n5. Click "Adicionar Registro"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Nome" field\n8. Enter the target domain in the "Conteúdo" field\n9. Click "Adicionar"'
    },
    {
      name: 'Hostinger',
      domains: ['hostinger.com'],
      loginUrl: 'https://hpanel.hostinger.com/login',
      iconUrl: 'https://www.hostinger.com/favicon.ico',
      cnameInstructions: '1. Login to Hostinger\n2. Go to "Domains"\n3. Select your domain\n4. Click "DNS / Nameservers"\n5. Click "Add Record"\n6. Select "CNAME" from the Type dropdown\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Add Record"'
    },
    {
      name: 'Hover',
      domains: ['hover.com'],
      loginUrl: 'https://www.hover.com/signin',
      iconUrl: 'https://www.hover.com/favicon.ico',
      cnameInstructions: '1. Login to Hover\n2. Go to "Domains"\n3. Select your domain\n4. Click "DNS"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Hostname" field\n8. Enter the target domain in the "Target Host" field\n9. Click "Add Record"'
    },
    {
      name: 'Inmotion Hosting',
      domains: ['inmotionhosting.com'],
      loginUrl: 'https://www.inmotionhosting.com/login',
      iconUrl: 'https://www.inmotionhosting.com/favicon.ico',
      cnameInstructions: '1. Login to InMotion Hosting\n2. Navigate to "Domains"\n3. Select your domain\n4. Click "DNS Zone Editor"\n5. Click "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Points To" field\n9. Click "Add Record"'
    },
    {
      name: 'IONOS',
      domains: ['ionos.com'],
      loginUrl: 'https://login.ionos.com',
      iconUrl: 'https://www.ionos.com/favicon.ico',
      cnameInstructions: '1. Login to IONOS Control Panel\n2. Go to "Domains & SSL"\n3. Select your domain\n4. Click on "DNS"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Prefix" field\n8. Enter the target domain in the "Value" field\n9. Click "Save"'
    },
    {
      name: 'iwantmyname',
      domains: ['iwantmyname.com'],
      loginUrl: 'https://iwantmyname.com/signin',
      iconUrl: 'https://iwantmyname.com/favicon.ico',
      cnameInstructions: '1. Login to iwantmyname\n2. Go to "Domains"\n3. Select your domain\n4. Click "Manage DNS Records"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Value" field\n9. Click "Add"'
    },
    {
      name: 'Locaweb',
      domains: ['locaweb.com.br'],
      loginUrl: 'https://login.locaweb.com.br/',
      iconUrl: 'https://login.locaweb.com.br/favicon.ico',
      cnameInstructions: '1. Login to Locaweb\n2. Navigate to "DNS"\n3. Select your domain\n4. Click "Gerenciar DNS"\n5. Click "Adicionar"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Nome" field\n8. Enter the target domain in the "Valor" field\n9. Click "Salvar"'
    },
    {
      name: 'Name.com',
      domains: ['name.com'],
      loginUrl: 'https://www.name.com/account/login',
      iconUrl: 'https://www.name.com/favicon.ico',
      cnameInstructions: '1. Login to Name.com\n2. Click on your domain in "My Domains"\n3. Click "Manage DNS Records"\n4. Click "Add Record"\n5. Select "CNAME" from the record type dropdown\n6. Enter the hostname in the "Host" field\n7. Enter the target domain in the "Answer" field\n8. Click "Add Record"'
    },
    {
      name: 'NameBright',
      domains: ['namebright.com'],
      loginUrl: 'https://www.namebright.com/Login',
      iconUrl: 'https://www.namebright.com/favicon.ico',
      cnameInstructions: '1. Login to NameBright\n2. Go to "My Domains"\n3. Select your domain\n4. Click "DNS & Nameservers"\n5. Click "Add New Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Value" field\n9. Click "Save"'
    },
    {
      name: 'Namecheap',
      domains: ['registrar-servers.com', 'namecheap.com'],
      loginUrl: 'https://www.namecheap.com/myaccount/login/',
      iconUrl: 'https://www.namecheap.com/favicon.ico',
      cnameInstructions: '1. Login to Namecheap\n2. Go to "Domain List"\n3. Click "Manage" next to your domain\n4. Select the "Advanced DNS" tab\n5. Under "Host Records", click "Add New Record"\n6. Select "CNAME Record" from the dropdown\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Value" field\n9. Set TTL as desired\n10. Click the checkmark to save'
    },
    {
      name: 'NameSilo',
      domains: ['namesilo.com'],
      loginUrl: 'https://www.namesilo.com/login',
      iconUrl: 'https://www.namesilo.com/favicon.ico',
      cnameInstructions: '1. Login to NameSilo\n2. Go to "Manage My Domains"\n3. Click on your domain\n4. Click "Update DNS Records"\n5. Find the "CNAME Records" section\n6. Enter the hostname in the "Host" field\n7. Enter the target domain in the "Value" field\n8. Click "Submit"'
    },
    {
      name: 'Netlify',
      domains: ['netlify.com'],
      loginUrl: 'https://app.netlify.com/login',
      iconUrl: 'https://www.netlify.com/favicon.ico',
      cnameInstructions: '1. Login to Netlify\n2. Go to your site\n3. Click "Domain settings"\n4. Click "Add domain alias"\n5. Enter your domain\n6. Configure DNS settings\n7. Add a CNAME record with your hostname\n8. Point it to your Netlify site domain\n9. Click "Save"'
    },
    {
      name: 'Network Solutions',
      domains: ['networksolutions.com'],
      loginUrl: 'https://www.networksolutions.com/manage-it/index.jsp',
      iconUrl: 'https://www.networksolutions.com/favicon.ico',
      cnameInstructions: '1. Login to Network Solutions\n2. Go to "Manage Account"\n3. Select your domain\n4. Click "Manage DNS"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Alias" field\n8. Enter the target domain in the "Points To" field\n9. Click "Continue" then "Apply Changes"'
    },
    {
      name: 'One.com',
      domains: ['one.com'],
      loginUrl: 'https://www.one.com/admin/login.do',
      iconUrl: 'https://www.one.com/favicon.ico',
      cnameInstructions: '1. Login to One.com\n2. Go to "Domains"\n3. Select your domain\n4. Click "DNS Settings"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
    },
    {
      name: 'OpenSrs',
      domains: ['opensrs.com'],
      loginUrl: 'https://manage.opensrs.com/',
      iconUrl: 'https://opensrs.com/wp-content/uploads/cropped-tucows-opensrs-favicon-cropped-32x32.png',
      cnameInstructions: '1. Login to OpenSRS\n2. Go to "Domains"\n3. Select your domain\n4. Click "DNS" tab\n5. Click "Add New Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save Changes"'
    },
    {
      name: 'OVH Global',
      domains: ['ovh.net', 'ovh.com'],
      loginUrl: 'https://www.ovh.com/auth/',
      iconUrl: 'https://www.ovh.com/favicon.ico',
      cnameInstructions: '1. Login to OVH Manager\n2. Navigate to "Domains"\n3. Select your domain\n4. Click on the "DNS Zone" tab\n5. Click "Add an entry"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Sub-domain" field\n8. Enter the target domain in the "Target" field\n9. Click "Next" and then "Confirm"'
    },
    {
      name: 'Porkbun',
      domains: ['porkbun.com'],
      loginUrl: 'https://porkbun.com/account/login',
      iconUrl: 'https://porkbun.com/favicon.ico',
      cnameInstructions: '1. Login to Porkbun\n2. Go to "Domain Management"\n3. Click on your domain\n4. Click "DNS Records"\n5. Click "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Content" field\n9. Click "Add"'
    },
    {
      name: 'Register.com',
      domains: ['register.com'],
      loginUrl: 'https://www.register.com/myaccount/productdisplay.rcmx',
      iconUrl: 'https://www.register.com/favicon.ico',
      cnameInstructions: '1. Login to Register.com\n2. Go to "My Domains"\n3. Click on your domain\n4. Select "Advanced Technical Settings"\n5. Click "Edit" next to "DNS Records"\n6. Click "Add Record"\n7. Select "CNAME" as the type\n8. Enter the hostname in the "Host" field\n9. Enter the target domain in the "Points To" field\n10. Click "Continue" and then "Save Changes"'
    },
    {
      name: 'Register.it',
      domains: ['register.it'],
      loginUrl: 'https://www.register.it/login/',
      iconUrl: 'https://www.register.it/favicon.ico',
      cnameInstructions: '1. Login to Register.it\n2. Go to "I miei Domini"\n3. Select your domain\n4. Click "DNS"\n5. Click "Aggiungi Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Nome" field\n8. Enter the target domain in the "Valore" field\n9. Click "Salva"'
    },
    {
      name: 'Registro.br',
      domains: ['registro.br'],
      loginUrl: 'https://registro.br/login/',
      iconUrl: 'https://registro.br/assets/img/favicon/favicon-32x32.png',
      cnameInstructions: '1. Login to Registro.br\n2. Go to "Meus Domínios"\n3. Select your domain\n4. Click "Editar Zona"\n5. Click "Adicionar Registro"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Nome" field\n8. Enter the target domain in the "Dados" field\n9. Click "Salvar"'
    },
    {
      name: 'Simply',
      domains: ['simply.com'],
      loginUrl: 'https://www.simply.com/dk/',
      iconUrl: 'https://www.simply.com/favicon.ico',
      cnameInstructions: '1. Login to Simply\n2. Go to "Domains"\n3. Select your domain\n4. Click "DNS Settings"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save Changes"'
    },
    {
      name: 'SiteGround',
      domains: ['siteground.com'],
      loginUrl: 'https://login.siteground.com/',
      iconUrl: 'https://www.siteground.com/favicon.ico',
      cnameInstructions: '1. Login to SiteGround\n2. Go to "Websites"\n3. Click on "Site Tools"\n4. Navigate to "Domain" > "DNS Zone Editor"\n5. Click "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Value" field\n9. Click "Create"'
    },
    {
      name: 'Spaceship',
      domains: ['spaceship.com'],
      loginUrl: 'https://www.spaceship.com/',
      iconUrl: 'https://spaceship-cdn.com/static/spaceship/favicon/spaceship-icon.svg',
      cnameInstructions: '1. Login to Spaceship\n2. Navigate to "Domains"\n3. Select your domain\n4. Click "DNS Settings"\n5. Click "Add New Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
    },
    {
      name: 'Strato',
      domains: ['strato.de'],
      loginUrl: 'https://www.strato.de/apps/CustomerService',
      iconUrl: 'https://www.strato.de/favicon.ico',
      cnameInstructions: '1. Login to Strato\n2. Go to "Domains"\n3. Select your domain\n4. Click "DNS Settings"\n5. Click "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Target" field\n9. Click "Save"'
    },
    {
      name: 'TransIP',
      domains: ['transip.co.uk'],
      loginUrl: 'https://www.transip.co.uk/cp/',
      iconUrl: 'https://www.transip.co.uk/cache-66e7fd04/img/transip/favicons/favicon.png',
      cnameInstructions: '1. Login to TransIP\n2. Go to "Domains"\n3. Click on your domain\n4. Go to "DNS Settings"\n5. Click "Add Record"\n6. Select "CNAME" from the dropdown\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Content" field\n9. Click "Save"'
    },
    {
      name: 'United Domains DE',
      domains: ['united-domains.de'],
      loginUrl: 'https://www.united-domains.de/',
      iconUrl: 'https://www.united-domains.de/favicon.ico',
      cnameInstructions: '1. Login to United Domains\n2. Go to "Meine Domains"\n3. Select your domain\n4. Click "DNS Verwaltung"\n5. Click "Neuer Eintrag"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Name" field\n8. Enter the target domain in the "Wert" field\n9. Click "Speichern"'
    },
    {
      name: 'Web.com',
      domains: ['web.com'],
      loginUrl: 'https://www.web.com/my-account/login',
      iconUrl: 'https://www.web.com/favicon.ico',
      cnameInstructions: '1. Login to Web.com\n2. Go to "Manage Account"\n3. Select your domain\n4. Click "DNS Settings"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points To" field\n9. Click "Add Record"'
    },
    {
      name: 'Wix',
      domains: ['wix.com'],
      loginUrl: 'https://users.wix.com/signin',
      iconUrl: 'https://www.wix.com/favicon.ico',
      cnameInstructions: '1. Login to Wix\n2. Go to your site\'s dashboard\n3. Click "Settings"\n4. Click "Domains"\n5. Select your connected domain\n6. Click "Advanced"\n7. Click "Add Record"\n8. Select "CNAME" from the dropdown\n9. Enter the hostname in the "Host Name" field\n10. Enter the target domain in the "Points to" field\n11. Click "Save"'
    },
    {
      name: 'WordPress',
      domains: ['wordpress.com'],
      loginUrl: 'https://wordpress.com/log-in',
      iconUrl: 'https://wordpress.com/favicon.ico',
      cnameInstructions: '1. Login to WordPress.com\n2. Go to "My Sites"\n3. Select your site\n4. Go to "Domains"\n5. Click on your domain\n6. Click "DNS Records"\n7. Click "Add New Record"\n8. Select "CNAME" from the dropdown\n9. Enter the hostname in the "Host" field\n10. Enter the target domain in the "Value" field\n11. Click "Add Record"'
    },
    {
      name: 'Xneelo',
      domains: ['xneelo.co.za'],
      loginUrl: 'https://xneelo.co.za/#',
      iconUrl: 'https://www.xneelo.co.za/favicon.ico',
      cnameInstructions: '1. Login to Xneelo\n2. Navigate to "Domains"\n3. Select your domain\n4. Click "DNS Records"\n5. Click "Add Record"\n6. Select "CNAME" as the type\n7. Enter the hostname in the "Host" field\n8. Enter the target domain in the "Points to" field\n9. Click "Save"'
    },
  ];
  
  /**
   * Gets all DNS provider information
   * @returns Record of all DNS providers with their details
   */
  public getAllDnsProviders() {
    return [...this.dnsProviders];
  }
  
  /**
   * Gets the login URL for a DNS provider
   * @param provider Name of the DNS provider
   * @returns The login URL for the provider or null if not found
   */
  public getProviderLoginUrl(provider: string) {
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
  public getProviderIconUrl(provider: string) {
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
  public getProviderCnameInstructions(provider: string) {
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
  public async getDnsProvider(domain: string): Promise<DnsProvider> {
    try {
      // Get nameservers for the domain using our safe method. Only get the last two parts of the domain.
      const nameservers = await dns.resolveNs(domain.split('.').slice(-2).join('.'));
      
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
    } catch (error) {
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
  private identifyDnsProvider(nameservers: string[]): string | undefined {
    if (!nameservers || nameservers.length === 0) {
      return undefined;
    }
    
    // Convert nameservers to lowercase for comparison
    const lowerNameservers = nameservers.map(ns => ns.toLowerCase());
    
    // Check against known providers
    for (const provider of this.dnsProviders) {
      if (provider.domains.some(domain => 
        lowerNameservers.some(ns => ns.includes(domain.toLowerCase()))
      )) {
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
    } catch (e) {
      // Ignore parsing errors
    }
    
    return undefined;
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