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
          - ip
          - manufacturer
          - state (on/off/unknown)
          - lastSeen
        New device
        Device gone

    Adicionar lógica de mensagem mqtt


    [ {"deviceId":"1", "deviceName":"FireSensor", "deviceIp":"192.160.111"},
      {"deviceId":"2", "deviceName":"FireSensor", "deviceIp":"192.160.112"} ]
*/

const SentryLog = require("../utils/sentry-log.js");

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

    // check if deviceId and deviceIP(?) is on deviceList
    deviceList.forEach((deviceInList) => {
      if (
        deviceInList.deviceId == device.deviceId ||
        deviceInList.deviceIp == device.deviceIp
      )
        return false;
    });

    deviceList.push({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceIp: device.deviceIp,
      deviceStatus: "on",
      deviceLastSeen: lastSeen,
    });
  }

  function RemoveDevice(deviceId) {
    for (let i = 0; i < deviceList.length; i++) {
      if (deviceList[i].deviceId == deviceId) {
        deviceList.splice(i, 1);
        i--;
      }
    }
  }

  function CheckIdInList(deviceId) {
    // check if deviceId is on deviceList
    deviceList.forEach((deviceInList) => {
      if (deviceInList.deviceId == deviceId) return true;
    });
    return false;
  }

  function DeviceRegistry(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("device registry was deployed");

    var node = this;

    node.on("input", function (msg, send, _done) {
      let receivedDevice = msg.payload;

      if (Array.isArray(receivedDevice)) {
        receivedDevice.forEach((device) => {
          if (!CheckIdInList(device.deviceId)) {
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
          if (CheckIdInList(device.deviceId)) {
            node.status({
              fill: "yellow",
              shape: "dot",
              text: "Removed device",
            });
            RemoveDevice(device.deviceId);
            send([null, null, { payload: device }]);
          }
        });

        deviceList = receivedDevice;
        send({ payload: deviceList }, null, null);
      } else if (Number.isInteger(receivedDevice)) {
        if (deviceList.indexOf(receivedDevice) >= 0) {
          node.status({
            fill: "green",
            shape: "dot",
            text: "Device already connected",
          });
        } else {
          node.status({
            fill: "blue",
            shape: "dot",
            text: "Received new device",
          });
          deviceList.push(receivedDevice);
          send([null, { payload: receivedDevice }, null]);
        }

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
