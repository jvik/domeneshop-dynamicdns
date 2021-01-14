const dns = require("dns");

export default async function checkDNS() {
  return new Promise((resolve, reject) => {
    dns.lookup(`${process.env.RECORD}.${process.env.DOMAIN}`, (err, address) => {
      if (err) reject(err);
      resolve(address);
    });
  });
}
