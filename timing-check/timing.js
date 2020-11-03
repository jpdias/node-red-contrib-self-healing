module.exports = function (RED) {
  function Timing(config) {
    RED.nodes.createNode(this, config);

    this.lastTimestamp = null;
    this.periodBetweenReadings = config.period * 1000; //seconds to milliseconds
    this.intervalMargin = config.margin;
    this.slidingWindow = [];
    this.slidingWindowLength = config.slidingWindow;

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

      addToWindow(msg);

      if (this.lastTimestamp == null) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "First message",
        });

        node.send([msg, null, null]);
      } else {
        const intervalPeriod = determineWindowAverage();

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

  function addToWindow(msg) {
    if (this.slidingWindow.length == this.slidingWindowLength) {
      this.slidingWindow.shift();
    }

    this.slidingWindow.push(msg);
  }

  function determineWindowAverage() {
    let sum = 0;

    for (let i = 1; i < this.slidingWindow.length; i++) {
      const intervalPeriod =
        this.slidingWindow[i].timestamp - this.slidingWindow[i - 1].timestamp;

      sum += intervalPeriod;
    }

    return sum / this.slidingWindow.length;
  }

  RED.nodes.registerType("timing", Timing);
};
