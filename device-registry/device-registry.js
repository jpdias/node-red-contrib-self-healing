const SentryLog = require("../utils/sentry-log.js");

let internalDeviceList = new Map();
let receivedDevice;

module.exports = function (RED) {
  function registerDevice(device) {
    let lastSeen = Date.now().toString();

    if (device.Id == null || device.Name == null || device.Ip == null)
      return false;

    if (device.Status == null) device.Status = "on";
    internalDeviceList.set(device.Id, {
      Id: device.Id,
      Name: device.Name,
      Ip: device.Ip,
      Status: device.Status,
      LastSeen: lastSeen,
    });

    return true;
  }

  function mapToJSON() {
    let output = [];
    internalDeviceList.forEach((element) => {
      output.push(element);
    });

    return output;
  }

  function DeviceRegistry(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("device registry was deployed");

    var node = this;

    internalDeviceList.clear();

    node.on("input", function (msg, send, _done) {
      receivedDevice = msg.payload;

      if (Array.isArray(receivedDevice)) {
        receivedDevice.forEach((device) => {
          if (!internalDeviceList.has(device.Id)) {
            if (registerDevice(device)) {
              node.status({
                fill: "blue",
                shape: "dot",
                text: "Registered new device",
              });
              send([null, { payload: device }, null]);
            } else {
              node.status({
                fill: "red",
                shape: "dot",
                text: "Failed to register device",
              });
            }
          } else {
            if (registerDevice(device)) {
              node.status({
                fill: "green",
                shape: "dot",
                text: "Updated device",
              });
            } else {
              node.status({
                fill: "red",
                shape: "dot",
                text: "Failed to update device",
              });
            }
          }
        });

        let output = mapToJSON();

        send({ payload: output }, null, null);
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Incorrect Input",
        });
      }
    });
  }

  RED.nodes.registerType("device-registry", DeviceRegistry);
};
