const find = require("local-devices");
const crypto = require("crypto");
const oui = require("oui");
const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  let started = false;
  let firstScanComplete = false;

  function containsDevice(obj, list) {
    return list.some((element) => element.id == obj.id);
  }

  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
      c
    ) {
      const r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function devScan(config, done, node, msg, send) {
    node.status({ fill: "blue", shape: "dot", text: "Scanning..." });
    if (!Array.isArray(node.context().get("devices"))) {
      node.context().set("devices", new Array());
    }
    find(config.baseip)
      .then((devicesScan) => {
        let newDevList = new Array();
        devicesScan.forEach((obj) => {
          let idsha = uuidv4();
          let mnf = "unknown";
          let name = "unknown";
          if (typeof obj.mac == "string") {
            //if not mac, set uuid
            idsha = crypto.createHash("sha256").update(obj.mac).digest("hex");
            mnf = oui(obj.mac.substring(0, 8));
          }

          if (typeof obj.name == "string") {
            name = obj.name;
          }

          if (mnf != "unknown") {
            mnf = oui(obj.mac.substring(0, 8)).split("\n")[0];
          }
          let dev = {
            id: idsha,
            ip: obj.ip,
            name: name,
            manufacturer: mnf,
            timestamp: new Date().toISOString(),
          };
          newDevList.push(dev);
          if (!containsDevice(dev, node.context().get("devices"))) {
            node.log("Device new: " + dev.ip);
            node.status({ fill: "red", shape: "dot", text: "device up" });
            send([null, { payload: dev }, null]);
          }
        });
        return newDevList;
      })
      .then((newDevList) => {
        node
          .context()
          .get("devices")
          .forEach((oldDev) => {
            node.log("Checking for old/removed devices");
            if (!containsDevice(oldDev, newDevList)) {
              node.status({ fill: "red", shape: "dot", text: "device down" });
              node.log("Device Removed: " + oldDev.ip);
              send([null, null, { payload: oldDev }]);
            }
          });
        node.context().set("devices", newDevList);
        firstScanComplete = true;
        node.status({
          fill: "green",
          shape: "dot",
          text: "Scan Complete: " + new Date().toISOString(),
        });
        if (config.emit) {
          send([{ payload: newDevList }, null, null]);
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
    node.emit("input", { payload: "internal-sync" });
    node.on("input", function (msg, send, done) {
      if (!started) {
        node.context().set("devices", new Array());
        devScan(config, done, node, msg, send);
        setInterval(() => {
          devScan(config, done, node, msg, send);
        }, parseInt(config.scanInterval) * 1000);
        started = true;
      } else if (firstScanComplete) {
        if (Array.isArray(node.context().get("devices"))) {
          send([{ payload: node.context().get("devices") }, null, null]);
        }
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
