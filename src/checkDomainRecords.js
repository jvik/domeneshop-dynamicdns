import psl from 'psl';
import Domeneshop from 'domeneshop.js';
import publicIp from 'public-ip';
import checkDNS from './checkdns';
import logger from './logger';

const api = new Domeneshop(process.env.TOKEN, process.env.SECRET);
const updateRecords = process.env.DOMAINS.split(',');

const checkAndUpdate = async () => {
  const currentPublicIP = await publicIp.v4();
  const incorrectRecords = [];
  const correctRecords = [];

  api.getDomains().then(async (domeneshopDomains) => {
    for (const domainToCheck of updateRecords) {
      const DNSLookup = await checkDNS(domainToCheck);
      const misMatchBetweenMyIPAndRecord = currentPublicIP !== DNSLookup;

      if (misMatchBetweenMyIPAndRecord) {
        incorrectRecords.push(domainToCheck);
      } else {
        correctRecords.push(domainToCheck);
      }
    }

    for (const incorrectRecord of incorrectRecords) {
      const parsedDomain = psl.parse(incorrectRecord);
      if (parsedDomain.subdomain === '@') {
        parsedDomain.subdomain = null;
      }

      const myDomain = domeneshopDomains.find((domeneshopDomain) => domeneshopDomain.domain === parsedDomain.domain);
      const myDomainRecords = await api.dns.getRecords(myDomain.id);
      const domainRecordToCheckOrUpdate = myDomainRecords.find((record) => record.host === parsedDomain.subdomain);

      const myNewRecord = {
        data: currentPublicIP,
        host: parsedDomain.subdomain,
        ttl: process.env.TTL,
        type: 'A',
      };

      if (!domainRecordToCheckOrUpdate) {
        api.dns.createRecord(myDomain.id, myNewRecord);
        logger.warn(`${incorrectRecord} was not found, and should have been created`, myNewRecord);
      } else if (domainRecordToCheckOrUpdate.type === 'A' && domainRecordToCheckOrUpdate.data !== currentPublicIP) {
        logger.warn(`${incorrectRecord} already exists with incorrect IP, and has been updated`);

        api.dns.modifyRecord(myDomain.id, domainRecordToCheckOrUpdate.id, myNewRecord);
      } else if (domainRecordToCheckOrUpdate.type === 'A' && domainRecordToCheckOrUpdate.data === currentPublicIP) {
        logger.warn(`${incorrectRecord} was probably recently updated. Wait for TTL to expire`);
      } else {
        throw new Error('Something was not configured correctly');
      }
    }

    for (const correctRecord of correctRecords) {
      logger.info(`${correctRecord} already correct`);
    }
  });
};

export default checkAndUpdate;
