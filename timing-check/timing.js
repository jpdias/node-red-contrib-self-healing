const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  function Timing(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("timing was deployed");

    this.lastTimestamp = null;
    this.periodBetweenReadings = config.period * 1000; //seconds to milliseconds
    this.intervalMargin = config.margin;

    this.maximumPeriod =
      this.periodBetweenReadings +
      this.intervalMargin * this.periodBetweenReadings;
    this.minimumPeriod =
      this.periodBetweenReadings -
      this.intervalMargin * this.periodBetweenReadings;

    let node = this;

    this.on("input", (msg) => {
      const currentTimestamp = Date.now();
      msg.timestamp = currentTimestamp;

      if (this.lastTimestamp == null) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "First message",
        });

        node.send([msg, null, null]);
      } else {
        const intervalPeriod = currentTimestamp - this.lastTimestamp;

        if (intervalPeriod > this.maximumPeriod) {
          node.status({
            fill: "yellow",
            shape: "dot",
            text: "Too Slow",
          });

          node.send([null, null, msg]);
        } else if (intervalPeriod < this.minimumPeriod) {
          node.status({
            fill: "yellow",
            shape: "dot",
            text: "Too Fast",
          });

          node.send([null, msg, null]);
        } else {
          node.status({
            fill: "green",
            shape: "dot",
            text: "Normal",
          });

          node.send([msg, null, null]);
        }
      }
      this.lastTimestamp = currentTimestamp;
    });
  }

  RED.nodes.registerType("timing", Timing);
};
