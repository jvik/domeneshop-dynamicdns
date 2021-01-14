import Domeneshop from "domeneshop.js";
import publicIp from "public-ip";
import cron from "node-cron";
import checkDNS from "./checkdns";

require("dotenv").config();

const api = new Domeneshop(process.env.TOKEN, process.env.SECRET);

const doStuff = () => {
  api
    .getDomains()
    .then(async (domains) => {
      const myNewIp = await publicIp.v4();
      const DNSLookup = await checkDNS();
      const misMatchBetweenMyIPAndRecord = myNewIp === DNSLookup;

      if (misMatchBetweenMyIPAndRecord) {
        console.log("IP has not changed since last time");
        return;
      }

      const myDomain = domains.find((domain) => domain.domain === process.env.DOMAIN);
      const myDomainRecords = await api.dns.getRecords(myDomain.id);
      const domainRecordToCheckOrUpdate = myDomainRecords.find((record) => record.host === process.env.RECORD);

      const myNewRecord = {
        data: myNewIp,
        host: process.env.RECORD,
        ttl: process.env.TTL,
        type: "A",
      };

      if (!domainRecordToCheckOrUpdate) {
        api.dns.createRecord(myDomain.id, myNewRecord);
        console.log("wat1");
      } else if (domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data !== myNewIp) {
        console.log("The record already exists, but has been changed");

        api.dns.modifyRecord(myDomain.id, domainRecordToCheckOrUpdate.id, myNewRecord);
      } else if (domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data === myNewIp) {
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

publicIp.v4().then((ourIp) => {
  console.log(`Started with IP ${ourIp}. Running once and then every ${process.env.CHECK_MINUTES} minutes`);
  doStuff();

  cron.schedule(`0 */${process.env.CHECK_MINUTES} * * * *`, () => {
    doStuff();
  });
});
