const kalmanjs = require("kalmanjs");

module.exports = function (RED) {
  function KalmanNoiseFilter(config) {
    RED.nodes.createNode(this, config);
    const filter = new kalmanjs({
      R: config.r || 0.01,
      Q: config.q || 3,
    });
    this.on("input", function (msg) {
      if (Array.isArray(msg.payload)) {
        msg.payload = msg.payload.map((val) => filter.filter(val));
      } else {
        msg.payload = filter.filter(msg.payload);
      }
      this.send(msg);
    });
  }
  RED.nodes.registerType("kalman-noise-filter", KalmanNoiseFilter);
};
