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
      errMsg[resource] = "too high";
      return false;
    }
  }

  function checkMinValue(receivedValue, minValue, resource, errMsg) {
    if (receivedValue >= minValue) {
      return true;
    } else {
      errMsg[resource] = "too low";
      return false;
    }
  }

  function checkResources(config, msg, errMsg, node, send, done) {
    const resources = config.resourcesMask;
    let returnValue = true;

    if ((resources & 8) == 8) {
      const CPUreceived = msg.payload.CPU;
      if (!checkInputValidity(CPUreceived, "CPU", node, done)) return;
      if (!checkMaxValue(CPUreceived, config.maxCPU, "CPU", errMsg)) {
        send([null, { payload: "CPU usage too high" }, null, null, null]);
        returnValue = false;
      }
    }

    if ((resources & 4) == 4) {
      const RAMreceived = msg.payload.RAM;
      if (!checkInputValidity(RAMreceived, "RAM", node, done)) return;
      if (!checkMaxValue(RAMreceived, config.maxRAM, "RAM", errMsg)) {
        send([null, null, { payload: "RAM usage too high" }, null, null]);
        returnValue = false;
      }
    }

    if ((resources & 2) == 2) {
      const storageReceived = msg.payload.storage;
      if (!checkInputValidity(storageReceived, "storage", node, done)) return;

      if (
        !checkMaxValue(storageReceived, config.maxStorage, "storage", errMsg)
      ) {
        send([null, null, null, { payload: "Storage usage too high" }, null]);
        returnValue = false;
      }
    }

    if ((resources & 1) == 1) {
      const batteryReceived = msg.payload.battery;
      if (!checkInputValidity(batteryReceived, "battery", node, done)) return;

      if (
        !checkMinValue(batteryReceived, config.minBattery, "battery", errMsg)
      ) {
        send([null, null, null, null, { payload: "Battery level too low" }]);
        returnValue = false;
      }
    }

    return returnValue;
  }

  function ResourceMonitorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.on("input", function (msg, send, done) {
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

      if (msg.payload.constructor !== {}.constructor) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Unexpected Input",
        });

        done("Error: Input must be a JSON object with resources usage.");
        return;
      }

      const returnValue = checkResources(config, msg, errMsg, node, send, done);

      if (returnValue) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "Within limits",
        });
      } else {
        node.status({});
        send(
          [
            {
              payload:
                "At least one of the resources monitored is out of bounds!",
              type: errMsg,
            },
          ],
          null,
          null,
          null,
          null
        );
      }
      done();
    });
  }
  RED.nodes.registerType("resource-monitor", ResourceMonitorNode);
};
