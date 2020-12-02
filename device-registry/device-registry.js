const SentryLog = require("../utils/sentry-log.js");

let internalDeviceList = new Map();
let receivedDevice;

module.exports = function (RED) {
  function registerDevice(device) {
    //let lastSeen = Date.now();

    if (device.Id == null || device.Name == null || device.Ip == null)
      return false;

    if (device.Status == null) device.Status = "on";
    internalDeviceList.set(device.Id, {
      Id: device.Id,
      Ip: device.Ip,
      //LastSeen: lastSeen,
      Name: device.Name,
      Status: device.Status,
    });

    return true;
  }

  function unregisterDevice(id) {
    let device = internalDeviceList.get(id);

    internalDeviceList.set(device.Id, {
      Id: device.Id,
      Ip: device.Ip,
      //LastSeen: lastSeen,
      Name: device.Name,
      Status: device.Status,
    });
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
          //3 casos: não estar no registo, estar no registo e Status=on/null, estar no registo e Status=off

          if (!internalDeviceList.has(device.Id)) {
            if (registerDevice(device)) {
              node.status({
                fill: "blue",
                shape: "dot",
                text: "Registered new device",
              });
              console.log(device);
              send([null, { payload: device }, null]);
            } else {
              node.status({
                fill: "red",
                shape: "dot",
                text: "Failed to register device",
              });
            }
          } else if (device.Status != "off") {
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
          } else {
            unregisterDevice(device.Id);
            node.status({
              fill: "yellow",
              shape: "dot",
              text: "Removed device",
            });
            send([null, null, { payload: device }]);
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
