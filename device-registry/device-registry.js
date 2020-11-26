/*
    Valores a guardar por device:
    nome - from node-red-node-discovery
    ip - from node-red-node-discovery
    manufacturer
    last seen - timestamp
    Features/Endpoints (?)
    
    Inputs:

    Outputs:
        Lista de devices
        New device
        Device gone
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

  function DeviceRegistry(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("device registry was deployed");

    var node = this;

    node.on("input", function (msg, send, _done) {
      let receivedDeviceList = msg.payload;

      if (Array.isArray(receivedDeviceList)) {
        //ver se tem novo elemento
        receivedDeviceList.forEach((device) => {
          if (deviceList.indexOf(device) == -1) {
            node.status({
              fill: "blue",
              shape: "dot",
              text: "Received new device",
            });

            send([null, { payload: device }, null]);
          }
        });

        //ver se elemento foi removido
        deviceList.forEach((device) => {
          if (receivedDeviceList.indexOf(device) == -1) {
            node.status({
              fill: "yellow",
              shape: "dot",
              text: "Removed device",
            });

            send([null, null, { payload: device }]);
          }
        });

        deviceList = receivedDeviceList;
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
