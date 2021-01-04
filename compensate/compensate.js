module.exports = function (RED) {
  let history = [];
  let compensatedCounter = 0;
  let scheduler;
  let confidenceFormula;

  function confidenceLevel(_compensatedCounter, _history) {
    if (confidenceFormula == "") {
      return NaN;
    }
    try {
      return eval(confidenceFormula);
    } catch (e) {
      return NaN;
    }
    //(1 / compensatedCounter) >= 1 ? 1 : (1 / compensatedCounter);
  }

  const mode = (myArray) =>
    myArray.reduce(
      (a, b, i, arr) =>
        arr.filter((v) => JSON.stringify(v) === JSON.stringify(a)).length >=
        arr.filter((v) => JSON.stringify(v) === JSON.stringify(b)).length
          ? a
          : b,
      null
    );

  function modeCompensate(node, mode, history, send, done) {
    node.status({
      fill: "yellow",
      shape: "dot",
      text: "Timeout. Sending Mode",
    });
    const modeval = mode(history);

    send([
      {
        payload: modeval,
        confidenceValue: confidenceLevel(compensatedCounter, history),
        timestamp: Date.now().toString(),
      },
    ]);
    done();
  }

  function lastCompensate(node, history, send, done) {
    node.status({
      fill: "yellow",
      shape: "dot",
      text: "Timeout. Sending Last",
    });
    let last = history[history.length - 1];
    send([
      {
        payload: last,
        confidenceValue: confidenceLevel(compensatedCounter, history),
        timestamp: Date.now().toString(),
      },
    ]);
    done();
  }

  function minCompensate(history, node, send, done) {
    let min = history.reduce((prev, curr) => {
      return Math.min(prev, curr);
    });
    node.status({
      fill: "yellow",
      shape: "dot",
      text: "Timeout. Sending Min",
    });
    send([
      {
        payload: min,
        confidenceValue: confidenceLevel(compensatedCounter, history),
        timestamp: Date.now().toString(),
      },
    ]);
    done();
  }

  function maxCompensate(history, node, send, done) {
    let max = history.reduce((prev, curr) => {
      return Math.max(prev, curr);
    });
    node.status({
      fill: "yellow",
      shape: "dot",
      text: "Timeout. Sending Max",
    });
    send([
      {
        payload: max,
        confidenceValue: confidenceLevel(compensatedCounter, history),
        timestamp: Date.now().toString(),
      },
    ]);
    done();
  }

  function meanCompensate(history, node, send, done) {
    /*
        Moving Average (MA) Model (since hist only contains the "histSize" values)
        */
    let sum = history.reduce(function (a, b) {
      return a + b;
    });
    let avg = sum / history.length;

    node.status({
      fill: "yellow",
      shape: "dot",
      text: "Timeout. Sending Mean",
    });
    send([
      {
        payload: avg,
        confidenceValue: confidenceLevel(compensatedCounter, history),
        timestamp: Date.now().toString(),
      },
    ]);
    done();
  }

  function sendMessage(node, send, done, strategy) {
    if (history.length > 0) {
      compensatedCounter++;
      switch (strategy) {
        case "mean":
          meanCompensate(history, node, send, done);
          break;
        case "max":
          maxCompensate(history, node, send, done);
          break;
        case "min":
          minCompensate(history, node, send, done);
          break;
        case "last":
          lastCompensate(node, history, send, done);
          break;
        case "mode":
          modeCompensate(node, mode, history, send, done);
          break;
        default:
          break;
      }
    } else {
      node.status({
        fill: "red",
        shape: "dot",
        text: "There is no historical data",
      });
    }
  }

  function Compensate(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const strategy = config.strategy;
    const messageTimeout = config.timeout;
    const msghistory = config.msghistory;
    confidenceFormula = config.confidenceFormula;
    compensatedCounter = 0;
    history = [];

    clearInterval(scheduler);

    node.on("input", function (msg, send, done) {
      if (!scheduler && typeof msg.payload === "number") {
        scheduler = setInterval(
          sendMessage,
          parseFloat(messageTimeout) * 1000,
          node,
          send,
          done,
          strategy
        );
      }

      clearInterval(scheduler);

      if (typeof msg.payload === "number") {
        if (history.length >= msghistory) {
          history.shift();
        }
        history.push(msg.payload);

        node.status({ fill: "green", shape: "dot", text: "Ok" });
        compensatedCounter == 0
          ? (compensatedCounter = 0)
          : compensatedCounter--;

        send([
          {
            payload: msg.payload,
            confidenceValue: confidenceLevel(compensatedCounter, history),
            timestamp: Date.now().toString(),
          },
        ]);
        scheduler = setInterval(
          sendMessage,
          parseFloat(messageTimeout) * 1000,
          node,
          send,
          done,
          strategy
        );
        done();
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Payload Not a Number",
        });
      }
    });

    this.on("close", function () {
      clearInterval(scheduler);
    });
  }

  RED.nodes.registerType("sensor-compensate", Compensate);
};
