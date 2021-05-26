module.exports = function (RED) {
  function Heartbeat(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    node.interval = null;
    node.timeout = null;
    node.frequency = config.frequency;
    node.protocol = config.protocol;
    node.onfail = config.onfail;
    node.httpendpoint = config.httpendpoint;
    node.delay = config.delay;

    node.late = false;
    let result = [null, null, null];

    node.interval = setInterval(function () {
      node.emit("checkAlive", {});
    }, node.frequency * 1000); //from seconds to milliseconds

    node.on("input", function (msg, send, done) {
      if (node.late) {
        return;
      }

      if (node.timeout != null) {
        clearTimeout(node.timeout);
        node.timeout = null;
      }

      //Passive protocol
      if (node.protocol == "passive") {
        node.status({ fill: "green", shape: "dot", text: "OK" });
        msg.payload = "Connection successful";
        result[1] = msg;
        if (!node.onfail) send(result);
        done();
      }

      //Active protocol
      else if (node.protocol == "active") {
        node.status({ fill: "green", shape: "dot", text: "OK" });
        done();
      }
    });

    node.on("checkAlive", function () {
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
        if (this.onfail) {
          result[1] = null;
        } else {
          result[1] = this.checkMsg;
        }
        node.send(result);

        this.timeout = setTimeout(function () {
          this.late = true;

          node.status({ fill: "red", shape: "dot", text: "ERROR" });
          result[2] = { payload: "Could not connect" };
          node.send(result);
        }, this.delay * 1000);
      }
    });

    node.on("close", function () {
      clearInterval(this.interval);
      node.interval = null;
      node.timeout = null;
    });
  }

  RED.nodes.registerType("heartbeat", Heartbeat);
};
