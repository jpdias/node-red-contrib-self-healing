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
    // if (node.masterExists) return;

    console.log("##########");
    console.log(node.ips);
    console.log(node.ips.size);
    console.log(node.masterIsMe);
    console.log("##########");

    if (node.ips.size == 0 && !node.masterIsMe) {
      node.masterIsMe = true;
      // node.masterExists = true;
      node.status({ fill: "green", shape: "dot", text: "I'm Master" });
      node.send([
        { payload: { master: node.masterIsMe } },
        { payload: Array.from(node.ips) },
        { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
      ]);
      return;
    }

    const highest = getMajor(node.ips);

    console.log(highest.major);
    console.log(node.lastOctect);

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

    // node.masterExists = true;

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
          // node.masterExists = false;
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
    // node.masterExists = false;
    node.ips = new Set();
    node.lastAlive = {};

    node.send([
      null,
      null,
      { payload: { sync: "ping", master: node.masterIsMe, hostip: node.ip } },
    ]);

    // node.voting = setInterval(
    //   voteMaster,
    //   parseInt(config.frequency) * 1000,
    //   node
    // );

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

      // if (isMaster) {

      //   if(!node.masterIsMe) {
      //     node.status({
      //       fill: "yellow",
      //       shape: "dot",
      //       text: "Master is " + ip,
      //     });
      //   }

      //   else if(getMajor(node.ips) > node.lastOctect) {
      //     node.masterIsMe = false;
      //     node.status({
      //       fill: "yellow",
      //       shape: "dot",
      //       text: "Master is " + ip,
      //     });
      //   }

      //   node.masterExists = true;
      // }
    }

    node.on("input", function (msg, _send, _done) {
      console.log("Master: ", node.masterIsMe);
      console.log(node.ip);
      console.log(node.lastAlive);

      // Update ip list
      if (typeof msg.payload != "undefined") {
        const payload = JSON.parse(msg.payload); //TODO: parse exception
        if (payload.sync != null && payload.sync == "ping") {
          updateIP(payload.hostip, payload.master);
        }
      }
    });

    node.on("close", function () {
      clearInterval(node.alive);
    });
  }

  RED.nodes.registerType("redundancy-manager", RedundancyManager);
};

// lançar processos de node-red
