module.exports = function (RED) {
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
    //(1 / _compensatedCounter) >= 1 ? 1 : (1 / _compensatedCounter);
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

  function modeCompensate(node, mode, history, compensatedCounter, send, done) {
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

  function lastCompensate(node, history, compensatedCounter, send, done) {
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

  function minCompensate(node, history, compensatedCounter, send, done) {
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

  function maxCompensate(node, history, compensatedCounter, send, done) {
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

  function meanCompensate(node, history, compensatedCounter, send, done) {
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

  function sendMessage(
    node,
    history,
    compensatedCounter,
    send,
    done,
    strategy
  ) {
    if (history.length > 0) {
      compensatedCounter.count += 1;
      switch (strategy) {
        case "mean":
          meanCompensate(node, history, compensatedCounter.count, send, done);
          break;
        case "max":
          maxCompensate(node, history, compensatedCounter.count, send, done);
          break;
        case "min":
          minCompensate(node, history, compensatedCounter.count, send, done);
          break;
        case "last":
          lastCompensate(node, history, compensatedCounter.count, send, done);
          break;
        case "mode":
          modeCompensate(
            node,
            mode,
            history,
            compensatedCounter.count,
            send,
            done
          );
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

  function activeBehaviour(
    scheduler,
    msg,
    sendMessage,
    messageTimeout,
    node,
    history,
    compensatedCounter,
    send,
    done,
    strategy,
    msghistory,
    confidenceLevel
  ) {
    if (!scheduler && typeof msg.payload === "number") {
      scheduler = setInterval(
        sendMessage,
        parseFloat(messageTimeout) * 1000,
        node,
        history,
        compensatedCounter,
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
      compensatedCounter.count == 0
        ? (compensatedCounter.count = 0)
        : (compensatedCounter.count -= 1);

      send([
        {
          payload: msg.payload,
          confidenceValue: confidenceLevel(compensatedCounter.count, history),
          timestamp: Date.now().toString(),
        },
      ]);
      scheduler = setInterval(
        sendMessage,
        parseFloat(messageTimeout) * 1000,
        node,
        history,
        compensatedCounter,
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
    return scheduler;
  }

  function passiveBehaviour(
    msg,
    sendMessage,
    messageTimeout,
    node,
    history,
    compensatedCounter,
    send,
    done,
    strategy,
    msghistory,
    confidenceLevel
  ) {
    if (
      Object.prototype.hasOwnProperty.call(msg, "payload") &&
      typeof msg.payload === "number"
    ) {
      if (history.length >= msghistory) {
        history.shift();
      }
      history.push(msg.payload);

      node.status({ fill: "green", shape: "dot", text: "Ok" });
      compensatedCounter.count == 0
        ? (compensatedCounter.count = 0)
        : (compensatedCounter.count -= 1);

      send([
        {
          payload: msg.payload,
          confidenceValue: confidenceLevel(compensatedCounter.count, history),
          timestamp: Date.now().toString(),
        },
      ]);
      done();
    } else if (Object.prototype.hasOwnProperty.call(msg, "trigger")) {
      sendMessage(node, history, compensatedCounter, send, done, strategy);
    } else {
      node.status({
        fill: "red",
        shape: "dot",
        text: "Error on input (passive)",
      });
    }
  }

  function Compensate(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const strategy = config.strategy;
    const messageTimeout = config.timeout;
    const msghistory = config.msghistory;
    const isActive = config.isActive;
    confidenceFormula = config.confidenceFormula;
    let compensatedCounter = { count: 0 };
    let history = [];
    let scheduler;

    if (scheduler) {
      clearInterval(scheduler);
    }

    node.on("input", function (msg, send, done) {
      if (isActive) {
        scheduler = activeBehaviour(
          scheduler,
          msg,
          sendMessage,
          messageTimeout,
          node,
          history,
          compensatedCounter,
          send,
          done,
          strategy,
          msghistory,
          confidenceLevel
        );
        return;
      } else {
        if (scheduler) {
          clearInterval(scheduler);
        }
        passiveBehaviour(
          msg,
          sendMessage,
          messageTimeout,
          node,
          history,
          compensatedCounter,
          send,
          done,
          strategy,
          msghistory,
          confidenceLevel
        );
      }
    });

    this.on("close", function () {
      clearInterval(scheduler);
    });
  }

  RED.nodes.registerType("sensor-compensate", Compensate);
};
