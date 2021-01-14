import Domeneshop from "domeneshop.js";
import publicIp from "public-ip";
import checkDNS from "./checkdns";

const api = new Domeneshop(process.env.TOKEN, process.env.SECRET);

export default function runUpdater() {
console.log('🚀 ~ file: runUpdater.js ~ line 8 ~ process.env.TOKEN', process.env.TOKEN)
  api
    .getDomains()
    .then(async (domains) => {
      const currentPublicIP = await publicIp.v4();
      const DNSLookup = await checkDNS();
      const misMatchBetweenMyIPAndRecord = currentPublicIP === DNSLookup;

      if (misMatchBetweenMyIPAndRecord) {
        console.log("Provided IP is equal to public DNS record. If this is incorrect wait until existing TTL is over.");
        return;
      }

      const myDomain = domains.find((domain) => domain.domain === process.env.DOMAIN);
      const myDomainRecords = await api.dns.getRecords(myDomain.id);

      if (!myDomain) {
        throw new Error("Could not find your domain")
      }

      const domainRecordToCheckOrUpdate = myDomainRecords.find((record) => record.host === process.env.RECORD);

      const myNewRecord = {
        data: currentPublicIP,
        host: process.env.RECORD,
        ttl: process.env.TTL,
        type: "A",
      };

      if (!domainRecordToCheckOrUpdate) {
        api.dns.createRecord(myDomain.id, myNewRecord);
        console.log("The record was not found, and should have been created");
      } else if (domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data !== currentPublicIP) {
        console.log("The record already exists, but has been changed");

        api.dns.modifyRecord(myDomain.id, domainRecordToCheckOrUpdate.id, myNewRecord);
      } else if (domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data === currentPublicIP) {
        console.log("Domain record already correct");
      } else {
        throw new Error("Something was not configured correctly");
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};