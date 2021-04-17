import Domeneshop from "domeneshop.js";
import publicIp from "public-ip";
import cron from "node-cron";
import checkDNS from "./checkdns";

require('dotenv-safe').config();

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
          console.log(`${fullRecord} was not found, and should have been updated`, myNewRecord);
        } else if (domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data !== currentPublicIP) {
          console.log(`${fullRecord} already exists, but has been updated`);
  
          api.dns.modifyRecord(myDomain.id, domainRecordToCheckOrUpdate.id, myNewRecord);
        } else if (domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data === currentPublicIP) {
          console.log(`${fullRecord} was probably recently updated. Wait for TTL to expire`)
        }
        else {
          throw new Error("Something was not configured correctly");
        }
      }

      for (const correctRecord of correctRecords) {
        console.log(`${correctRecord}.${process.env.DOMAIN} already correct`);
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

publicIp.v4().then((ourIp) => {
  // Do one run first and then run cronjob
  console.log(`Started with IP ${ourIp}. Running once and then every ${process.env.CHECK_MINUTES} minutes`);
  checkAndUpdate();

  // Run every hour at X minutes.
  cron.schedule(`0 */${process.env.CHECK_MINUTES} * * * *`, () => {
    checkAndUpdate();
  });
});
