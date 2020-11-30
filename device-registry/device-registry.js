/*
    Valores a guardar por device:
    nome - from node-red-node-discovery
    ip - from node-red-node-discovery
    manufacturer
    last seen - timestamp
    Features/Endpoints (?)
    
    Inputs:

    Outputs:
        Lista de obejtos devices
          - name
          - ip (mandatory and unique)
          - connection (mqtt/http/unknown)
          - manufacturer (not mandatory)
          - state (on/off/unknown)
          - lastSeen
        New device
        Device gone

    ListOfDevies to be kept in a HashTable

    [ {"deviceId":"1", "deviceName":"FireSensor", "deviceIp":"192.160.111"},
      {"deviceId":"2", "deviceName":"FireSensor", "deviceIp":"192.160.112"} ]
*/

const SentryLog = require("../utils/sentry-log.js");

let internalDeviceList = new Map();
let deviceList = [];
//let deviceListStruct = [];

module.exports = function (RED) {
  /*function updateDeviceListStruct(index, isActive) {
    let timestamp = new Date().getTime();

    if (condition) { // elemento está dentro do array
            
    } else { // elemento não está dentro do array
      deviceListStruct.push({ index: index, lastSeen:  timestamp, active: isActive});
    }

  }*/

  function RegisterDevice(device) {
    let lastSeen = Date.now().toString();

    if (
      device.deviceId == null ||
      device.deviceName == null ||
      device.deviceIp == null
    )
      return false;

    if (internalDeviceList.has(device.deviceId)) return false;

    if (device.deviceStatus == null) device.deviceStatus = "on";
    internalDeviceList.set(device.deviceId, {
      Name: device.deviceName,
      Ip: device.deviceIp,
      Status: device.deviceStatus,
      LastSeen: lastSeen,
    });
  }

  // function isClicked() {
  //   send([{ payload: internalDeviceList }, null, null]);
  // }

  function DeviceRegistry(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("device registry was deployed");

    var node = this;

    node.on("input", function (msg, send, _done) {
      let receivedDevice = msg.payload;

      if (Array.isArray(receivedDevice)) {
        receivedDevice.forEach((device) => {
          if (!internalDeviceList.has(device.deviceId)) {
            node.status({
              fill: "blue",
              shape: "dot",
              text: "Received new device",
            });
            RegisterDevice(device);
            send([null, { payload: device }, null]);
          }
        });

        // TODO: check if new device list has a missing device from deviceList
        receivedDevice.forEach((device) => {
          if (internalDeviceList.has(device.deviceId)) {
            node.status({
              fill: "yellow",
              shape: "dot",
              text: "Removed device",
            });

            send([null, null, { payload: device }]);
          }
        });

        deviceList = receivedDevice;
        send({ payload: deviceList }, null, null);
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
