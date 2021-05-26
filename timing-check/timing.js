module.exports = function (RED) {
  function addToWindow(msg, slidingWindow, slidingWindowLength) {
    if (slidingWindow.length == slidingWindowLength) {
      slidingWindow.shift();
    }

    slidingWindow.push(msg);
  }

  function determineWindowAverage(slidingWindow) {
    let sum = 0;

    for (let i = 1; i < slidingWindow.length; i++) {
      const intervalPeriod =
        slidingWindow[i].timestamp - slidingWindow[i - 1].timestamp;

      sum += intervalPeriod;
    }

    return sum / (slidingWindow.length - 1);
  }

  function Timing(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const periodBetweenReadings = config.period * 1000; //seconds to milliseconds
    let intervalMargin = config.margin;

    let lastTimestamp = null;
    let slidingWindow = [];
    let currentState = null;

    const slidingWindowLength = config.slidingWindowLength;

    const maximumPeriod =
      periodBetweenReadings + intervalMargin * periodBetweenReadings;
    const minimumPeriod =
      periodBetweenReadings - intervalMargin * periodBetweenReadings;

    node.on("input", (msg) => {
      const currentTimestamp = Date.now();
      msg.timestamp = currentTimestamp;

      addToWindow(msg, slidingWindow, slidingWindowLength);

      let resultState = null;

      if (lastTimestamp == null) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "First message",
        });

        node.send([msg, null, null]);

        resultState = "Normal";
      } else {
        const intervalPeriod = determineWindowAverage(slidingWindow);

        if (intervalPeriod > maximumPeriod) {
          node.status({
            fill: "yellow",
            shape: "dot",
            text: "Too Slow",
          });

          node.send([null, null, msg]);

          resultState = "Too Slow";
        } else if (intervalPeriod < minimumPeriod) {
          node.status({
            fill: "yellow",
            shape: "dot",
            text: "Too Fast",
          });

          node.send([null, msg, null]);

          resultState = "Too Fast";
        } else {
          node.status({
            fill: "green",
            shape: "dot",
            text: "Normal",
          });

          node.send([msg, null, null]);

          resultState = "Normal";
        }
      }

      if (resultState != currentState) {
        currentState = resultState;
      }

      lastTimestamp = currentTimestamp;
    });
    node.on("close", function (done) {
      lastTimestamp = null;
      slidingWindow = [];
      currentState = null;
      node.status({});
      done();
    });
  }

  RED.nodes.registerType("timing", Timing);
};
