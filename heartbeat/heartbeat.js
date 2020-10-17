module.exports = function (RED) {
  const https = require("https");

  function Heartbeat(config) {
    RED.nodes.createNode(this, config);

    this.interval = null;
    this.frequency = config.frequency;
    this.protocol = config.protocol;
    this.onfail = config.onfail;
    this.httpendpoint = config.httpendpoint;
    let node = this;

    if (this.protocol == "http") {
      this.interval = setInterval(function () {
        node.emit("input", {});
      }, this.frequency * 1000); //from seconds to milliseconds
    }

    this.on("input", function (msg, send, done) {
      //HTTP protocol
      if (this.protocol == "http") {
        https
          .get(this.httpendpoint, (res) => {
            const { statusCode, statusMessage } = res;
            //everything OK
            if (statusCode == 200) {
              this.status({ fill: "green", shape: "dot", text: "OK" });
              if (!this.onfail) {
                msg.payload = {
                  status: statusCode,
                  statusMessage: statusMessage,
                };
                msg.timestamp = Date.now().toString();
                send(msg);
              }
            } else {
              this.status({ fill: "red", shape: "ring", text: "FAIL" });
              msg.payload = {
                status: statusCode,
                statusMessage: statusMessage,
              };
              msg.timestamp = Date.now().toString();
              send(msg);
            }
          })
          .on("error", (err) => {
            this.status({ fill: "red", shape: "dot", text: "ERROR" });
            msg.payload = { status: 0, statusMessage: err.message };
            msg.timestamp = Date.now().toString();
            send(msg);
          });
      }
      //MQTT protocol
      else if (this.protocol == "mqtt") {
        //do something
      }
    });
  }

  RED.nodes.registerType("heartbeat", Heartbeat);
};
