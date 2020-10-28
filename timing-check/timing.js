// Instead of measuring flow every two consecutive messages, measure the average flow of X consecutive messages (moving average)
// Implement output for timeout

module.exports = function (RED) {
  function Timing(config) {
    RED.nodes.createNode(this, config);

    this.lastTimestamp = null;
    this.periodBetweenReadings = config.period * 1000; //seconds to milliseconds
    this.intervalMargin = config.margin;
    this.slidingWindow = [];
    this.slidingWindowLength = config.slidingWindow;
    this.timeout = config.timeout * 1000;

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

        node.send([msg, null, null, null]);
      } else {
        const intervalPeriod = currentTimestamp - this.lastTimestamp;

        if (intervalPeriod > this.maximumPeriod) {
          node.status({
            fill: "yellow",
            shape: "dot",
            text: "Too Slow",
          });

          node.send([null, null, msg, null]);
        } else if (intervalPeriod < this.minimumPeriod) {
          node.status({
            fill: "yellow",
            shape: "dot",
            text: "Too Fast",
          });

          node.send([null, msg, null, null]);
        } else {
          node.status({
            fill: "green",
            shape: "dot",
            text: "Normal",
          });

          node.send([msg, null, null, null]);
        }
      }
      this.lastTimestamp = currentTimestamp;
    });

    setTimeout(() => {
      const currentTimestamp = Date.now();

      if (currentTimestamp - this.lastTimestamp > this.timeout) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Timeout",
        });

        const msg = "Timeout reached. Stopped message flow";

        node.send([null, null, null, msg]);
      }
    }, this.timeout);
  }

  RED.nodes.registerType("timing", Timing);
};
