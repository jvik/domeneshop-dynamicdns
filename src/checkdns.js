const dns = require("dns");

export default async function checkDNS(record) {
  return new Promise((resolve, reject) => {
    dns.lookup(`${record}.${process.env.DOMAIN}`, (err, address) => {
      if (err) reject(err);
      resolve(address);
    });
  });
}
