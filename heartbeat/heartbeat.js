const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  function Heartbeat(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("heartbeat was deployed");
    let node = this;

    this.interval = null;
    this.timeout = null;
    this.frequency = config.frequency;
    this.protocol = config.protocol;
    this.onfail = config.onfail;
    this.httpendpoint = config.httpendpoint;
    this.delay = config.delay;

    this.late = false;
    let result = [null, null, null];

    this.interval = setInterval(function () {
      node.emit("checkAlive", {});
    }, this.frequency * 1000); //from seconds to milliseconds

    this.on("input", function (msg, send, done) {
      if (this.late) {
        return;
      }

      if (this.timeout != null) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }

      //Passive protocol
      if (this.protocol == "passive") {
        node.status({ fill: "green", shape: "dot", text: "OK" });
        msg.payload = "Connection successful";
        result[1] = msg;
        send(result);
        done();
      }

      //Active protocol
      else if (this.protocol == "active") {
        node.status({ fill: "green", shape: "dot", text: "OK" });
        result[1] = msg;
        done();
      }
    });

    this.on("checkAlive", function () {
      //Passive protocol
      if (this.protocol == "passive") {
        this.timeout = setTimeout(function () {
          this.late = true;

          node.status({ fill: "red", shape: "dot", text: "ERROR" });
          result[2] = { payload: "Could not connect" };
          node.send(result);
        }, this.frequency * 1000);
      }

      //Active protocol
      else if (this.protocol == "active") {
        this.checkMsg = { payload: "Connection successful" };
        result[0] = this.checkMsg;
        result[1] = this.checkMsg;
        node.send(result);

        this.timeout = setTimeout(function () {
          this.late = true;

          node.status({ fill: "red", shape: "dot", text: "ERROR" });
          result[2] = { payload: "Could not connect" };
          node.send(result);
        }, this.delay * 1000);
      }
    });

    this.on("close", function () {
      clearInterval(this.interval);
    });
  }

  RED.nodes.registerType("heartbeat", Heartbeat);
};
