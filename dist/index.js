"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _domeneshop = _interopRequireDefault(require("domeneshop.js"));

var _publicIp = _interopRequireDefault(require("public-ip"));

var _nodeCron = _interopRequireDefault(require("node-cron"));

var _checkdns = _interopRequireDefault(require("./checkdns"));

require("dotenv").config();

var api = new _domeneshop["default"](process.env.TOKEN, process.env.SECRET);

var doStuff = function doStuff() {
  api.getDomains().then( /*#__PURE__*/function () {
    var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(domains) {
      var myNewIp, DNSLookup, misMatchBetweenMyIPAndRecord, myDomain, myDomainRecords, domainRecordToCheckOrUpdate, myNewRecord;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _publicIp["default"].v4();

            case 2:
              myNewIp = _context.sent;
              _context.next = 5;
              return (0, _checkdns["default"])();

            case 5:
              DNSLookup = _context.sent;
              misMatchBetweenMyIPAndRecord = myNewIp === DNSLookup;

              if (!misMatchBetweenMyIPAndRecord) {
                _context.next = 10;
                break;
              }

              console.log("IP has not changed since last time");
              return _context.abrupt("return");

            case 10:
              myDomain = domains.find(function (domain) {
                return domain.domain === process.env.DOMAIN;
              });
              _context.next = 13;
              return api.dns.getRecords(myDomain.id);

            case 13:
              myDomainRecords = _context.sent;
              domainRecordToCheckOrUpdate = myDomainRecords.find(function (record) {
                return record.host === process.env.RECORD;
              });
              myNewRecord = {
                data: myNewIp,
                host: process.env.RECORD,
                ttl: process.env.TTL,
                type: "A"
              };

              if (domainRecordToCheckOrUpdate) {
                _context.next = 21;
                break;
              }

              api.dns.createRecord(myDomain.id, myNewRecord);
              console.log("wat1");
              _context.next = 31;
              break;

            case 21:
              if (!(domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data !== myNewIp)) {
                _context.next = 26;
                break;
              }

              console.log("The record already exists, but has been changed");
              api.dns.modifyRecord(myDomain.id, domainRecordToCheckOrUpdate.id, myNewRecord);
              _context.next = 31;
              break;

            case 26:
              if (!(domainRecordToCheckOrUpdate.type === "A" && domainRecordToCheckOrUpdate.data === myNewIp)) {
                _context.next = 30;
                break;
              }

              console.log("Domain record already correct");
              _context.next = 31;
              break;

            case 30:
              throw new Error("Something was not configured correctly");

            case 31:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }())["catch"](function (err) {
    console.log(err);
    throw new Error(err);
  });
};

_publicIp["default"].v4().then(function (ourIp) {
  console.log("Started with IP ".concat(ourIp, ". Running once and then every ").concat(process.env.CHECK_MINUTES, " minutes"));
  doStuff();

  _nodeCron["default"].schedule("0 */".concat(process.env.CHECK_MINUTES, " * * * *"), function () {
    doStuff();
  });
});