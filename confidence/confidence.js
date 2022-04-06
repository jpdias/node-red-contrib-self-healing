module.exports = function (RED) {
  function confidence(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    config.uncertainty = parseFloat(config.measurementUncertainty) || 0;

    function isNumber(value) {
      return typeof value === "number" && isFinite(value);
    }

    function calculateConfidence(value) {
      let relativeUncertainty = 1;

      if (value > 0 && value > config.uncertainty)
        relativeUncertainty = config.uncertainty / Math.abs(value);

      return 1 - relativeUncertainty;
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
            confidence: calculateConfidence(parseFloat(msg.payload)),
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
