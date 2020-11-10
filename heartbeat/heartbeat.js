module.exports = function (RED) {
  const https = require("https");

  function failedTrigger(msg, send) {
    msg.payload = { status: 0, statusMessage: "Timeout" };
    msg.timestamp = Date.now().toString();
    send(msg);
  }

  function Heartbeat(config) {
    RED.nodes.createNode(this, config);

    this.interval = null;
    this.brokerInterval = null;
    this.frequency = config.frequency;
    this.protocol = config.protocol;
    this.onfail = config.onfail;
    this.httpendpoint = config.httpendpoint;
    this.delay = config.mqttdelay;
    let node = this;

    this.interval = setInterval(function () {
      node.emit("input", {});
    }, this.frequency * 1000); //from seconds to milliseconds

    this.brokerInterval = setInterval(function () {
      node.emit("verify", {});
    }, this.delay * 1000); //from seconds to milliseconds

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
            if (done) {
              // Node-RED 1.0 compatible
              done(err);
            } else {
              // Node-RED 0.x compatible
              node.error(err, msg);
            }
          });
      }
      //MQTT protocol - MQTT Passive
      else if (this.protocol == "mqtt passive") {
        if (!this.interval) {
          this.interval = setInterval(
            failedTrigger,
            parseInt(this.frequency) * 1000,
            msg,
            send
          );
        }
        clearInterval(this.interval);

        this.on("verify", function () {
          if (msg.topic == "$SYS/broker/uptime") {
            this.status({ fill: "green", shape: "dot", text: "OK" });
            msg.payload = "Connection to the MQTT broker is alive.";
            send(msg);
          } else {
            this.status({ fill: "red", shape: "dot", text: "ERROR" });
            msg.payload = "Could not connect to the MQTT broker.";
            send(msg);
          }
        });

        this.interval = setInterval(
          failedTrigger,
          parseInt(this.frequency) * 1000,
          msg,
          send
        );
      }
      //MQTT protocol - MQTT Active
      else if (this.protocol == "mqtt active") {
        if (!this.interval) {
          this.interval = setInterval(
            failedTrigger,
            parseInt(this.frequency) * 1000,
            msg,
            send
          );
        }
        clearInterval(this.interval);
        this.on("verify", function (newMsg) {
          newMsg.payload = "Connection to the MQTT broker is alive.";
          send(newMsg);
          if (msg.payload == newMsg.payload) {
            this.status({ fill: "green", shape: "dot", text: "OK" });
            //"Connection to the MQTT broker is alive."
            send(msg);
            done();
            clearInterval(this.brokerInterval);
          }
        });

        this.interval = setInterval(
          failedTrigger,
          parseInt(this.frequency) * 1000,
          msg,
          send
        );
      }
    });

    this.on("close", function () {
      clearInterval(this.interval);
      clearInterval(this.brokerInterval);
    });
  }

  RED.nodes.registerType("heartbeat", Heartbeat);
};
