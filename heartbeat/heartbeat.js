const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  const https = require("https");

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
    this.delay = config.mqttdelay;

    this.late = false;

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
        if (msg.topic == "$SYS/broker/uptime") {
          node.status({ fill: "green", shape: "dot", text: "OK" });
          msg.payload = "Connection to the MQTT broker is alive.";
          send(msg);
          done();
        }
      }

      //MQTT protocol - MQTT Active
      else if (this.protocol == "mqtt active") {
        if (msg.payload == this.checkMsg.payload) {
          node.status({ fill: "green", shape: "dot", text: "OK" });
          done();
        }
      }
    });

    this.on("checkAlive", function () {
      //MQTT protocol - MQTT Passive
      if (this.protocol == "mqtt passive") {
        this.timeout = setTimeout(function () {
          this.late = true;

          node.status({ fill: "red", shape: "dot", text: "ERROR" });
          node.send({ payload: "Could not connect to the MQTT broker." });
        }, this.delay * 1000);
      }

      //MQTT protocol - MQTT Active
      else if (this.protocol == "mqtt active") {
        this.checkMsg = { payload: "Connection to the MQTT broker is alive." };
        node.send(this.checkMsg);

        this.timeout = setTimeout(function () {
          this.late = true;

          node.status({ fill: "red", shape: "dot", text: "ERROR" });
          node.send({ payload: "Could not connect to the MQTT broker." });
        }, this.delay * 1000);
      }
    });

    this.on("close", function () {
      clearInterval(this.interval);
    });
  }

  RED.nodes.registerType("heartbeat", Heartbeat);
};
