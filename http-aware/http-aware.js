const net = require("net");

module.exports = function (RED) {
  const ipNumBits = 32;
  const netmask32 = Math.pow(2, ipNumBits) - 1;
  const port8080 = "8080";
  const port443 = "443";
  const port80 = "80";

  let started = false;
  let firstScanComplete = false;

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

    const netmask = netmask32 - (Math.pow(2, ipNumBits - mask) - 1);
    const min_ip = (ip & netmask) >>> 0;
    const max_ip = min_ip + Math.pow(2, ipNumBits - mask) - 1;

    for (let i = min_ip; i <= max_ip; i++) {
      let ip_string = num2dot(i);

      await ping(ip_string, port8080, newDevList);
      await ping(ip_string, port443, newDevList);
      await ping(ip_string, port80, newDevList);
    }

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
      send([{ payload: device }]);
    });
  }

  function HttpAware(config) {
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

  RED.nodes.registerType("http-aware", HttpAware);
};
