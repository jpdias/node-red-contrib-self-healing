const SentryLog = require("../utils/sentry-log.js");
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

  // Find ip with highest last octect and return the octect
  function getMajor(res) {
    let resArray = Array.from(res);
    if (resArray.length == 0) return 0;
    return resArray.reduce(function (a, b) {
      return Math.max(parseInt(a.split(".")[3]), parseInt(b.split(".")[3]));
    });
  }

  //Bully Algorithm
  function voteMaster(node) {
    if (node.masterExists) return;

    if (node.ips.size == 0 && !node.masterIsMe) {
      node.masterIsMe = true;
      node.masterExists = true;
      node.status({ fill: "green", shape: "dot", text: "I'm Master" });
      node.send([
        { payload: { master: node.masterIsMe } },
        { payload: Array.from(node.ips) },
        { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
      ]);
      return;
    }

    let major = 0;
    if (node.ips.size > 0) {
      major = getMajor(node.ips);
    }

    if (major <= node.lastOctect) {
      node.masterIsMe = true;
      node.masterExists = true;
      node.status({ fill: "green", shape: "dot", text: "I'm Master" });
    } else {
      node.masterIsMe = false;
      node.status({ fill: "yellow", shape: "dot", text: "Master is" });
    }

    node.send([
      { payload: { master: node.masterIsMe } },
      { payload: Array.from(node.ips) },
      { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
    ]);
  }

  function aliveCheck(timeout, node) {
    for (let [key, value] of Object.entries(node.lastAlive)) {
      if (Date.now() - value.last >= timeout) {
        if (value.isMaster) {
          node.masterExists = false;
          voteMaster(node);
        }
        node.ips.delete(key.replace("-", "."));
        delete node.lastAlive[key];
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
    node.masterExists = false;
    node.ips = new Set();
    node.lastAlive = {};

    node.send([
      null,
      null,
      { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
    ]);

    node.voting = setInterval(
      voteMaster,
      parseInt(config.frequency) * 1000,
      node
    );

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
    SentryLog.sendMessage("redundancy was deployed");

    let node = this;
    init(node, config);

    node.on("input", function (msg, _send, _done) {
      console.log(node.lastAlive);

      // Update ip list
      if (typeof msg.payload != "undefined") {
        const payload = JSON.parse(msg.payload); //TODO: parse exception
        if (payload.sync != null && payload.sync == "ping") {
          node.lastAlive[payload.hostip.replace(".", "-")] = {
            last: Date.now(),
            isMaster: payload.master,
          };
          node.ips.add(payload.hostip);
        }
      }

      /*
      if (msg.payload.master && !master) {
        master = false;
        masterExists = true;
        node.status({
          fill: "yellow",
          shape: "dot",
          text: "Master is " + msg.hostip,
        });

      } else if (msg.payload.master && master && getMajor(ips) > thisip) {
        node.status({
          fill: "yellow",
          shape: "dot",
          text: "Master is " + msg.hostip,
        });
        master = false;
        masterExists = true;
      }

      */
    });
  }

  RED.nodes.registerType("redundancy-manager", RedundancyManager);
};

// lançar processos de node-red
