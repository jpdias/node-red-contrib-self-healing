let BoundedStack = require("../utils/bounded-stack.js");

module.exports = function (RED) {
  function readingsWatcher(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    /*
      Configure strategy variables according to bitmask
      Bit 1 --> minimum change
      Bit 2 --> maximum change
      Bit 3 --> stuck at same value
	  */
    this.minchange = (config.strategyMask & 1) == 1 ? config.minchange : null;
    this.maxchange = (config.strategyMask & 2) == 2 ? config.maxchange : null;

    if ((config.strategyMask & 4) == 4) {
      this.stucklimit = config.stucklimit;
      this.readings = new BoundedStack(config.stucklimit);
    } else {
      this.stucklimit = null;
      this.readings = new BoundedStack(10);
    }

    if ("percentile" === config.valueType) {
      this.changeCalc = function (prev, curr) {
        return Math.abs((curr - prev) / prev);
      };
    } else {
      this.changeCalc = function (prev, curr) {
        return Math.abs(curr - prev);
      };
    }

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
      if (this.readings.isEmpty()) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "first reading",
        });
        this.readings.push(msg.payload);
        send([msg, null]);
        done();
        return;
      }

      let lastvalue = this.readings.peek();
      this.readings.push(msg.payload);
      let result = [null, null];
      let error = null;

      let change = this.changeCalc(lastvalue, msg.payload);

      // Maximum change triggered
      if (this.maxchange && change >= this.maxchange) {
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
      else if (this.minchange && change <= this.minchange) {
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
        this.stucklimit &&
        this.readings.isFull() &&
        this.readings.areAllElementsEqual()
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
          this.stucklimit +
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
