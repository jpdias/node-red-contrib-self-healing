const find = require("local-devices");
const crypto = require("crypto");
const oui = require("oui");
const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  let started = false;
  let firstScanComplete = false;

  function devScan(config, done, node, send) {
    node.status({ fill: "blue", shape: "dot", text: "Scanning..." });

    find(config.baseip)
      .then((devicesScan) => {
        let newDevList = new Array();

        devicesScan.forEach((obj) => {
          let idsha;
          let mnf = "unknown";
          let name = "unknown";
          let dev;

          if (typeof obj.name == "string") {
            name = obj.name;
          }

          if (typeof obj.mac == "string") {
            idsha = crypto
              .createHash("sha256")
              .update(obj.ip + obj.mac)
              .digest("hex");

            // Look up MAC addresses for their vendor in the IEEE OUI database
            mnf = oui(obj.mac.substring(0, 8));

            if (mnf != "unknown" && mnf != null) {
              mnf = oui(obj.mac.substring(0, 8)).split("\n")[0];
            }

            dev = {
              id: idsha,
              ip: obj.ip,
              name: name,
              manufacturer: mnf,
              timestamp: new Date().toISOString(),
            };
            send([{ payload: dev }, null]);
          } else {
            dev = {
              ip: obj.ip,
              name: name,
              manufacturer: mnf,
              timestamp: new Date().toISOString(),
            };

            send([null, { payload: dev }]);
          }
          newDevList.push(dev);
        });

        node.context().set("devices", newDevList);

        firstScanComplete = true;
        node.status({
          fill: "green",
          shape: "dot",
          text: "Scan Complete: " + new Date().toISOString(),
        });

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
        let scannedDevices = node.context().get("devices");
        scannedDevices.forEach((device) => {
          if (device.id) {
            send([{ payload: device }, null]);
          } else {
            send([null, { payload: device }]);
          }
        });
        done();
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
