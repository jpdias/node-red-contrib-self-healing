module.exports = function (RED) {
  const https = require("https");

  function failedTrigger(node) {
    node.send({
      payload: { status: 0, statusMessage: "Timeout" },
      timestamp: Date.now().toString(),
    });
  }

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
            if (done) {
              // Node-RED 1.0 compatible
              done(err);
            } else {
              // Node-RED 0.x compatible
              node.error(err, msg);
            }
          });
      }
      //MQTT protocol
      else if (this.protocol == "mqtt") {
        if (!this.interval_id) {
          this.interval_id = setInterval(
            failedTrigger,
            parseInt(this.repeat) * 1000,
            node
          );
        }
        clearInterval(this.interval_id);

        if (!this.onfail) {
          node.send({ payload: { status: 200, statusMessage: "Alive" } });
        }

        this.interval_id = setInterval(
          failedTrigger,
          parseInt(this.repeat) * 1000,
          node
        );
      }
    });
  }

  RED.nodes.registerType("heartbeat", Heartbeat);
};
