const dns = require('dns');

export default async function checkDNS(record) {
  return new Promise((resolve, reject) => {
    dns.lookup(record, (err, address) => {
      if (err) reject(err);
      resolve(address);
    });
  });
}
