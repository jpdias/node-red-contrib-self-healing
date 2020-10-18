module.exports = function (RED) {
  function readingsWatcher(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    this.checkmin = ( (config.strategyMask & 1) == 1);
    this.checkmax = ( (config.strategyMask & 2) == 2);

    this.minchange = config.minchange;
    this.maxchange = config.maxchange;
    this.lastvalue = null;

    this.on("input", function (msg, send, done) {

      msg.timestamp = Date.now().toString();

      // Validate message payload
      if (isNaN(msg.payload)) {
        node.status({
          fill: "red",
          shape: "circle",
          text: "NaN"
        });
        done("Expected a number as payload. Got: " + msg.payload);
        return;
      }

      // First registered reading
      if (!this.lastvalue) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "first reading",
        });
        this.lastvalue = msg.payload;
        send([msg, null]);
        done();
        return;
      }

      let diff = Math.abs((this.lastvalue - msg.payload) / this.lastvalue);
      let result = [null, null];
      let error = null;

      // Maximum change triggered
      if (this.checkmax && this.maxchange && diff >= this.maxchange) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "max change",
        });
        msg.type = "maxchange";
        result[1] = msg;
        error = "Consecutive readings differ more than expected (Difference: " + diff + ")";
      }

      // Minimum change triggered
      else if (this.checkmin && this.minchange && diff <= this.minchange) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "min change",
        });
        msg.type = "minchange";
        result[1] = msg;
        error = "Consecutive readings more similar than expected (Difference: " + diff + ")";

      // All good
      } else {
        node.status({
          fill: "green",
          shape: "dot",
          text: "ok",
        });
        result[0] = msg;
        this.lastvalue = msg.payload;
      }

      // Send result message
      send(result);

      // Finish message handling and trigger errors if they happened
      if(error)
        done(error);
      else
        done();
    });
  }
  RED.nodes.registerType("readings-watcher", readingsWatcher);
};
