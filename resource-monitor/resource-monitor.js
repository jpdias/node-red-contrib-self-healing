module.exports = function (RED) {
  function checkInputValidity(value, resource, node, done) {
    if (typeof value != "number" || isNaN(value) || value < 0 || value > 100) {
      node.status({
        fill: "red",
        shape: "dot",
        text: "Unexpected Input",
      });

      done(
        "Error: Value received for " +
          resource +
          " must be a number between 0 and 100! If this value isn't supposed to be monitored uncheck it in node's properties."
      );
      return false;
    }
    return true;
  }

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

      if (resources == 0) {
        node.status({
          fill: "yellow",
          shape: "dot",
          text: "Nothing to monitor",
        });

        done();
        return;
      }

      if ((resources & 8) == 8) {
        const CPUreceived = msg.payload.CPU;
        if (!checkInputValidity(CPUreceived, "CPU", node, done)) return;
        returnValue &= checkMaxValue(CPUreceived, config.maxCPU, "CPU", errMsg);
      }

      if ((resources & 4) == 4) {
        const RAMreceived = msg.payload.RAM;
        if (!checkInputValidity(RAMreceived, "RAM", node, done)) return;
        returnValue &= checkMaxValue(RAMreceived, config.maxRAM, "RAM", errMsg);
      }

      if ((resources & 2) == 2) {
        const storageReceived = msg.payload.storage;
        if (!checkInputValidity(storageReceived, "storage", node, done)) return;

        returnValue &= checkMaxValue(
          storageReceived,
          config.maxStorage,
          "storage",
          errMsg
        );
      }

      if ((resources & 1) == 1) {
        const memoryReceived = msg.payload.battery;
        if (!checkInputValidity(memoryReceived, "battery", node, done)) return;

        returnValue &= checkMinValue(
          memoryReceived,
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
