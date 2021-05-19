const arpping = require("arpping");
const crypto = require("crypto");
const oui = require("oui");

module.exports = function (RED) {
  const mnfOctet = 8;
  let started = false;
  let firstScanComplete = false;

  function getDeviceInfo(obj) {
    let idsha;
    let mnf = "unknown";
    let type = "unknown";
    let dev;

    if (typeof obj.type == "string") {
      type = obj.type;
    }

    if (typeof obj.mac == "string") {
      idsha = crypto
        .createHash("sha256")
        .update(obj.ip + obj.mac)
        .digest("hex");

      mnf = oui(obj.mac.substring(0, mnfOctet));

      if (mnf != "unknown" && mnf != null) {
        mnf = oui(obj.mac.substring(0, mnfOctet)).split("\n")[0];
      }

      dev = {
        id: idsha,
        ip: obj.ip,
        name: type,
        manufacturer: mnf,
        timestamp: new Date().toISOString(),
      };
    } else {
      dev = {
        ip: obj.ip,
        name: type,
        manufacturer: mnf,
        timestamp: new Date().toISOString(),
      };
    }

    return dev;
  }

  function devScan(config, done, node, send) {
    node.status({ fill: "blue", shape: "dot", text: "Scanning..." });

    arpping
      .discover()
      .then((hosts) => {
        let newDevList = new Array();

        hosts.forEach((obj) => {
          const dev = getDeviceInfo(obj);
          newDevList.push(dev);
        });

        sendDevices(newDevList, send);
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

  function sendDevices(scannedDevices, send) {
    scannedDevices.forEach((device) => {
      if (device.id) {
        send([{ payload: device }, null]);
      } else {
        send([null, { payload: device }]);
      }
    });
  }

  function NetworkAware(config) {
    RED.nodes.createNode(this, config);
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
        sendDevices(scannedDevices, send);
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
