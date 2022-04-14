module.exports = function (RED) {
  function confidence(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    config.uncertainty = parseFloat(config.measurementUncertainty) || 0;
    config.confidence = parseFloat(config.confidenceDegree) || 100;

    function isNumber(value) {
      return typeof value === "number" && isFinite(value);
    }

    node.on("input", function (msg, send, done) {
      if (isNumber(msg.payload)) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "ok",
        });

        send([
          {
            ...msg,
            uncertainty: config.uncertainty,
            confidence: config.confidence,
          },
          null,
        ]);

        done();
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "msg.payload is not a valid number",
        });

        send([
          null,
          {
            payload: msg.payload,
            fault: "msg.payload must be a number",
          },
        ]);

        done();
      }
    });
  }

  RED.nodes.registerType("confidence", confidence);
};
