const find = require("local-devices");
const crypto = require("crypto");
const oui = require("oui");
const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  let started = false;
  let firstScanComplete = false;

  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
      c
    ) {
      const r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function devScan(config, done, node, send) {
    node.status({ fill: "blue", shape: "dot", text: "Scanning..." });

    find(config.baseip)
      .then((devicesScan) => {
        let newDevList = new Array();

        devicesScan.forEach((obj) => {
          let idsha = uuidv4();
          let mnf = "unknown";
          let name = "unknown";

          if (typeof obj.mac == "string") {
            // If not mac, set uuid
            idsha = crypto.createHash("sha256").update(obj.mac).digest("hex");

            // Look up MAC addresses for their vendor in the IEEE OUI database
            mnf = oui(obj.mac.substring(0, 8));
          }

          if (mnf != "unknown") {
            mnf = oui(obj.mac.substring(0, 8)).split("\n")[0];
          }

          if (typeof obj.name == "string") {
            name = obj.name;
          }

          let dev = {
            id: idsha,
            ip: obj.ip,
            name: name,
            manufacturer: mnf,
            timestamp: new Date().toISOString(),
          };
          newDevList.push(dev);
        });
        return newDevList;
      })
      .then((newDevList) => {
        firstScanComplete = true;
        node.status({
          fill: "green",
          shape: "dot",
          text: "Scan Complete: " + new Date().toISOString(),
        });

        if (config.emit) {
          send({ payload: newDevList });
        }

        done();
      })
      .catch((err) => {
        node.status({
          fill: "red",
          shape: "dot",
          text: JSON.stringify(err.message),
        });
        node.log("caught", err.message);
      });
  }

  function NetworkAware(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("network-aware was deployed");
    const node = this;

    node.on("input", function (msg, send, done) {
      if (!started) {
        devScan(config, done, node, send);
        setInterval(() => {
          devScan(config, done, node, send);
        }, parseInt(config.scanInterval) * 1000);
        started = true;
      } else if (firstScanComplete) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "Already scanned, waiting for next scan",
        });
      } else {
        node.status({
          fill: "yellow",
          shape: "dot",
          text: "Running first scan",
        });
      }
    });
  }

  RED.nodes.registerType("network-aware", NetworkAware);
};
