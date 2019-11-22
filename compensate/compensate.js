module.exports = function(RED) {
  const mode = myArray =>
    myArray.reduce(
      (a, b, i, arr) =>
        arr.filter(v => JSON.stringify(v) === JSON.stringify(a)).length >=
        arr.filter(v => JSON.stringify(v) === JSON.stringify(b)).length
          ? a
          : b,
      null
    );

  function sendMessage(node, send, done, strategy, histSize) {
    let history = node.context().get("history" + node.id);
    if (history.length > 0) {
      switch (strategy) {
        case "mean":
          let sum = history.reduce(function(a, b) {
            return a + b;
          });
          let avg = sum / history.length;
          node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Mean"
          });
          history.push(avg);
          if (history.length > histSize) {
            history.shift();
          }
          node.context().set("history" + node.id, history);
          send({ payload: avg });
          done();
          break;
        case "max":
          let max = history.reduce((prev, curr) => {
            return Math.max(prev, curr);
          });
          node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Max"
          });
          history.push(max);
          if (history.length > histSize) {
            history.shift();
          }
          node.context().set("history" + node.id, history);
          send({ payload: max });
          done();
          break;
        case "min":
          let min = history.reduce((prev, curr) => {
            return Math.min(prev, curr);
          });
          node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Min"
          });
          history.push(min);
          if (history.length > histSize) {
            history.shift();
          }
          node.context().set("history" + node.id, history);
          send({ payload: min });
          done();
          break;
        case "last":
          node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Last"
          });
          let last = history[history.length - 1];
          history.push(last);
          if (history.length > histSize) {
            history.shift();
          }
          node.context().set("history" + node.id, history);
          send({ payload: last });
          done();
          break;
        case "mode":
          node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Mode"
          });
          let modeval = mode(history);
          history.push(modeval);
          if (history.length > histSize) {
            history.shift();
          }
          node.context().set("history" + node.id, history);
          send({ payload: modeval });
          done();
          break;
        default:
          break;
      }
    }
  }

  function Compensate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var schedule = "undefined";
    node.context().set("history" + node.id, []);
    node.on("input", function(msg, send, done) {
      strategy = config.strategy;
      let history = node.context().get("history" + node.id);
      if (schedule == "undefined")
        schedule = setInterval(
          sendMessage,
          parseInt(config.timeout) * 1000,
          node,
          send,
          done,
          strategy,
          config.msghistory
        );
      if (typeof msg.payload === "number") {
        clearInterval(schedule);
        schedule = setInterval(
          sendMessage,
          parseInt(config.timeout) * 1000,
          node,
          send,
          done,
          strategy,
          config.msghistory
        );
        if (history.length > config.msghistory) {
          history.shift();
        }
        history.push(msg.payload);
        node.context().set("history" + node.id, history);
        node.status({ fill: "green", shape: "ring", text: "Ok" });
        send(msg);
        done();
      } else {
        node.status({
          fill: "red",
          shape: "ring",
          text: "Payload Not a Number"
        });
      }
    });
  }

  RED.nodes.registerType("sensor-compensate", Compensate);
};
