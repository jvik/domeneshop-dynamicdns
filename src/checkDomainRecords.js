import Domeneshop from "domeneshop.js";
import publicIp from "public-ip";
import checkDNS from "./checkdns";
import logger from "./logger";

const api = new Domeneshop(process.env.TOKEN, process.env.SECRET);
const updateRecords = process.env.RECORDS.split(',');


const checkAndUpdate = () => {
  api
    .getDomains()
    .then(async (domains) => {
      const myDomain = domains.find((domain) => domain.domain === process.env.DOMAIN);
      const myDomainRecords = await api.dns.getRecords(myDomain.id);
      const currentPublicIP = await publicIp.v4();
      const incorrectRecords = [];
      const correctRecords = [];

      for (const record of updateRecords) {
        const DNSLookup = await checkDNS(record);
        const misMatchBetweenMyIPAndRecord = currentPublicIP !== DNSLookup;

        if (misMatchBetweenMyIPAndRecord) {
          incorrectRecords.push(record);
        } else {
          correctRecords.push(record);
        }
      };

      for (const incorrectRecord of incorrectRecords) {
        const domainRecordToCheckOrUpdate = myDomainRecords.find((record) => record.host === incorrectRecord);

        const myNewRecord = {
          data: currentPublicIP,
          host: incorrectRecord,
          ttl: process.env.TTL,
          type: "A",
        };

        const fullRecord = `${incorrectRecord}.${process.env.DOMAIN}`

        if (!domainRecordToCheckOrUpdate) {
          api.dns.createRecord(myDomain.id, myNewRecord);
          logger.warn(`${fullRecord} was not found, and should have been created`, myNewRecord);
        } else if (domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data !== currentPublicIP) {
          logger.warn(`${fullRecord} already exists with incorrect IP, and has been updated`);
  
          api.dns.modifyRecord(myDomain.id, domainRecordToCheckOrUpdate.id, myNewRecord);
        } else if (domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data === currentPublicIP) {
          logger.warn(`${fullRecord} was probably recently updated. Wait for TTL to expire`)
        }
        else {
          throw new Error("Something was not configured correctly");
        }
      }

      for (const correctRecord of correctRecords) {
        logger.info(`${correctRecord}.${process.env.DOMAIN} already correct`);
      }
    })
    .catch((err) => {
      logger.error(err);
      throw new Error(err);
    });
};

export default checkAndUpdate;