const os = require("os");

module.exports = function (RED) {
  function getIp() {
    let ips = [];
    const interfaces = os.networkInterfaces();
    for (const key in interfaces) {
      interfaces[key].forEach(function (details) {
        if (!details.internal) {
          ips.push(details.address);
        }
      });
    }
    return ips[0];
  }

  // Find ip with highest last octect and return it
  function getMajor(ips) {
    if (ips.size == 0) return { ip: "", major: 0 };

    let highestIP = "";
    let major = 0;

    for (let ip of ips) {
      const newMajor = parseInt(ip.split(".")[3]);
      if (major < newMajor) {
        major = newMajor;
        highestIP = ip;
      }
    }

    return { ip: highestIP, major: major };
  }

  //Bully Algorithm
  function voteMaster(node) {
    if (node.ips.size == 0 && !node.masterIsMe) {
      node.masterIsMe = true;
      node.status({ fill: "green", shape: "dot", text: "I'm Master" });
      node.send([
        { payload: { master: node.masterIsMe } },
        { payload: Array.from(node.ips) },
        { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
      ]);
      return;
    }

    const highest = getMajor(node.ips);

    if (highest.major <= node.lastOctect) {
      node.masterIsMe = true;
      node.status({ fill: "green", shape: "dot", text: "I'm Master" });
    } else {
      node.masterIsMe = false;
      node.status({
        fill: "yellow",
        shape: "dot",
        text: "Master is " + highest.ip,
      });
    }

    node.send([
      { payload: { master: node.masterIsMe } },
      { payload: Array.from(node.ips) },
      { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
    ]);
  }

  function aliveCheck(timeout, node) {
    if (node.ips.size == 0 && !node.masterIsMe) {
      voteMaster(node);
      return;
    }

    for (let [key, value] of Object.entries(node.lastAlive)) {
      if (Date.now() - value.last >= timeout) {
        const lostMaster = value.isMaster;

        node.ips.delete(key);
        delete node.lastAlive[key];

        if (lostMaster) {
          voteMaster(node);
        }
      }
    }

    node.send([
      { payload: { master: node.masterIsMe } },
      { payload: Array.from(node.ips) },
      { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
    ]);
  }

  function init(node, config) {
    node.ip = getIp();
    node.lastOctect = parseInt(node.ip.split(".")[3]);
    node.masterIsMe = false;
    node.ips = new Set();
    node.lastAlive = {};

    node.send([
      null,
      null,
      { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
    ]);

    node.alive = setInterval(
      aliveCheck,
      parseInt(config.pingInterval) * 1000,
      parseInt(config.timeout) * 1000,
      node
    );

    node.status({ fill: "yellow", shape: "dot", text: "Sync in Progress" });
  }

  function RedundancyManager(config) {
    RED.nodes.createNode(this, config);

    let node = this;
    init(node, config);

    function updateIP(ip, isMaster) {
      if (node.ip === ip) return;

      node.lastAlive[ip] = {
        last: Date.now(),
        isMaster: isMaster,
      };

      if (!node.ips.has(ip)) {
        node.ips.add(ip);
        voteMaster(node);
      }
    }

    node.on("input", function (msg, _send, done) {
      if (typeof msg.payload == "undefined") return;

      try {
        const payload = JSON.parse(msg.payload);
        if (payload.sync != null && payload.sync == "ping")
          updateIP(payload.hostip, payload.master);
      } catch (_err) {
        node.status({ fill: "red", shape: "dot", text: "Error on input" });
        done(new Error("Received message with invalid payload"));
        return;
      }
    });

    node.on("close", function () {
      clearInterval(node.alive);
    });

    node.on("close", function (done) {
      node.ip = getIp();
      node.lastOctect = parseInt(node.ip.split(".")[3]);
      node.masterIsMe = false;
      node.ips = new Set();
      node.lastAlive = {};
      done();
    });
  }

  RED.nodes.registerType("redundancy-manager", RedundancyManager);
};
