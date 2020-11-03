module.exports = function (RED) {
  function checkResource(receivedValue, maxValue, resource, errMsg) {
    if (receivedValue <= maxValue) {
      return true;
    } else {
      errMsg[resource] = "out of bounds";
      return false;
    }
  }

  function ResourceMonitorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.on("input", function (msg, send, done) {
      let returnValue = true;
      let errMsg = {};

      //if CPU checked confirm if there is a valid value
      returnValue &= checkResource(
        msg.payload.CPU,
        config.maxCPU,
        "CPU",
        errMsg
      );

      //if RAM checked confirm if there is a valid value
      returnValue &= checkResource(
        msg.payload.RAM,
        config.maxRAM,
        "RAM",
        errMsg
      );

      //if Storage checked
      returnValue &= checkResource(
        msg.payload.Storage,
        config.maxStorage,
        "Storage",
        errMsg
      );

      if (returnValue) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "Within limits",
        });
        send([{ payload: "Every resource is within limits." }, null]);
        done();
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Out of bounds",
        });
        send([null, { payload: errMsg }]);
        done(errMsg);
      }
    });
  }
  RED.nodes.registerType("resource-monitor", ResourceMonitorNode);
};
