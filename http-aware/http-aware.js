const net = require("net");
const crypto = require("crypto");
const oui = require("oui");
const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  const mnfOctet = 8;
  let started = false;
  let firstScanComplete = false;

  function getDeviceInfo(obj) {
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

      mnf = oui(obj.mac.substring(0, mnfOctet));

      if (mnf != "unknown" && mnf != null) {
        mnf = oui(obj.mac.substring(0, mnfOctet)).split("\n")[0];
      }

      dev = {
        id: idsha,
        ip: obj.ip,
        name: name,
        manufacturer: mnf,
        timestamp: new Date().toISOString(),
      };
    } else {
      dev = {
        ip: obj.ip,
        name: name,
        manufacturer: mnf,
        timestamp: new Date().toISOString(),
      };
    }

    return dev;
  }

  function dot2num(dot) {
    const d = dot.split(".");
    return ((+d[0] * 256 + +d[1]) * 256 + +d[2]) * 256 + +d[3];
  }

  function num2dot(num) {
    let d = num % 256;
    for (let i = 3; i > 0; i--) {
      num = Math.floor(num / 256);
      d = (num % 256) + "." + d;
    }
    return d;
  }

  async function ping(host, port, newDevList, timeout = 100) {
    const promise = new Promise((resolve, reject) => {
      const socket = new net.Socket();

      const onError = () => {
        socket.destroy();
        reject();
      };

      socket.setTimeout(timeout);
      socket.once("error", onError);
      socket.once("timeout", onError);

      socket.connect(port, host, () => {
        socket.end();
        newDevList.push(host + ":" + port);
        resolve();
      });
    });

    try {
      await promise;
      return true;
    } catch (_) {
      return false;
    }
  }

  async function find(config) {
    let newDevList = new Array();

    const baseip = config.baseip.split("/");
    const ip = dot2num(baseip[0]);
    const mask = parseInt(baseip[1]);

    const netmask = Math.pow(2, 32) - 1 - (Math.pow(2, 32 - mask) - 1);
    const min_ip = (ip & netmask) >>> 0;
    const max_ip = min_ip + Math.pow(2, 32 - mask) - 2; // Excluding broadcast ip address
    console.log(min_ip);
    console.log(max_ip);

    for (let i = min_ip; i <= max_ip; i++) {
      let ip_string = num2dot(i);

      console.log(ip_string);

      await ping(ip_string, "8080", newDevList);
      await ping(ip_string, "443", newDevList);
      await ping(ip_string, "80", newDevList);
    }

    console.log(newDevList);

    return newDevList;
  }

  function devScan(config, done, node, send) {
    node.status({ fill: "blue", shape: "dot", text: "Scanning..." });

    find(config)
      .then((newDevList) => {
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

  function HttpAware(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("http-aware was deployed");
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

  RED.nodes.registerType("http-aware", HttpAware);
};
