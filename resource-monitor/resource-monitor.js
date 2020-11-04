module.exports = function (RED) {
  function checkMaxValue(receivedValue, maxValue, resource, errMsg) {
    if (receivedValue <= maxValue) {
      return true;
    } else {
      errMsg[resource] = "out of bounds";
      return false;
    }
  }

  function checkMinValue(receivedValue, minValue, resource, errMsg) {
    if (receivedValue >= minValue) {
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

      const resources = config.resourcesMask;

      if ((resources & 8) == 8) {
        returnValue &= checkMaxValue(
          msg.payload.CPU,
          config.maxCPU,
          "CPU",
          errMsg
        );
      }

      if ((resources & 4) == 4) {
        returnValue &= checkMaxValue(
          msg.payload.RAM,
          config.maxRAM,
          "RAM",
          errMsg
        );
      }

      if ((resources & 2) == 2) {
        returnValue &= checkMaxValue(
          msg.payload.storage,
          config.maxStorage,
          "storage",
          errMsg
        );
      }

      if ((resources & 1) == 1) {
        returnValue &= checkMinValue(
          msg.payload.battery,
          config.minBattery,
          "battery",
          errMsg
        );
      }

      if (returnValue) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "Within limits",
        });
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Out of bounds",
        });
        send([null, { payload: errMsg }]);
      }
      done();
    });
  }
  RED.nodes.registerType("resource-monitor", ResourceMonitorNode);
};
