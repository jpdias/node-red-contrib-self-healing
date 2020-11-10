let BoundedStack = require("../utils/bounded-stack.js");
const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  function readingsWatcher(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("readings-watcher was deployed");
    let node = this;

    /*
      Configure strategy variables according to bitmask
      Bit 1 --> minimum change
      Bit 2 --> maximum change
      Bit 3 --> stuck at same value
	  */

    const minchange = (config.strategyMask & 1) == 1 ? config.minchange : null;
    const maxchange = (config.strategyMask & 2) == 2 ? config.maxchange : null;
    const stucklimit =
      (config.strategyMask & 4) == 4 ? config.stucklimit : null;
    const readings =
      (config.strategyMask & 4) == 4
        ? new BoundedStack(config.stucklimit)
        : new BoundedStack(10);

    const changeCalc =
      "percentile" === config.valueType
        ? (prev, curr) => Math.abs((curr - prev) / prev)
        : (prev, curr) => Math.abs(curr - prev);

    this.on("input", function (msg, send, done) {
      // Add/Update timestamp in message
      msg.timestamp = Date.now().toString();

      // Validate message payload
      if (isNaN(msg.payload)) {
        node.status({
          fill: "red",
          shape: "circle",
          text: "NaN",
        });
        node.warn("Expected a number as payload. Got: " + msg.payload);
        done(new Error("Expected a number as payload. Got: " + msg.payload));
        return;
      }

      // First registered reading
      if (readings.isEmpty()) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "first reading",
        });
        readings.push(msg.payload);
        send([msg, null]);
        done();
        return;
      }

      const lastvalue = readings.peek();
      const change = changeCalc(lastvalue, msg.payload);
      readings.push(msg.payload);
      let result = [null, null];
      let error = null;

      // Maximum change triggered
      if (maxchange && change >= maxchange) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "max change",
        });
        msg.type = "maxchange";
        result[1] = msg;
        error =
          "Consecutive readings differ more than expected (Difference: " +
          change +
          ")";
      }

      // Minimum change triggered
      else if (minchange && change <= minchange) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "min change",
        });
        msg.type = "minchange";
        result[1] = msg;
        error =
          "Consecutive readings more similar than expected (Difference: " +
          change +
          ")";
      }

      // Stuck at same reading triggered
      else if (
        stucklimit &&
        readings.isFull() &&
        readings.areAllElementsEqual()
      ) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "stuck limit",
        });
        msg.type = "stucklimit";
        result[1] = msg;
        error =
          "Last " +
          stucklimit +
          " consecutive readings were the same (Value: " +
          msg.payload +
          ")";
      } else {
        node.status({
          fill: "green",
          shape: "dot",
          text: "ok",
        });
        result[0] = msg;
      }

      send(result);
      if (error) done(error);
      else done();
    });
  }
  RED.nodes.registerType("readings-watcher", readingsWatcher);
};
