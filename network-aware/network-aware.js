var arpping = require('./arpping.js')({
    timeout: 10,
    includeEndpoints: true
});
const crypto = require('crypto');
const oui = require('oui');

module.exports = function (RED) {

    var devices = new Array();
    var started = false;
    var firstScanComplete = false;

    function containsDevice(obj, list) {
        for (let x in list) {
            if (x.id === obj.id) {
                return true;
            }
        }
        return false;
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      

    function devScan(config, done, node, msg, send) {
        node.status({ fill: "blue", shape: "dot", text: "Scanning..." });
        arpping.discover(config.baseip, (err, hosts) => {
            let newDevList = [];
            if (err) {
                node.status({ fill: "red", shape: "dot", text: JSON.stringify(err) });
                console.log(err);
                done();
            }
            for (const fdev of hosts) {
                let idsha = uuidv4();
                let mnf = "unknown"
                if(typeof fdev.mac == "string"){
                    idsha = crypto.createHash('sha256').update(fdev.mac).digest('hex');
                    mnf = oui(fdev.mac.substring(0, 8)) 
                }
                
                if(mnf != "unknown"){
                    mnf = oui(fdev.mac.substring(0, 8)).split("\n")[0]
                }
                let dev = {
                    id: idsha,
                    ip: fdev.ip,
                    manufacturer: mnf
                };
                newDevList.push(dev);
                if (!containsDevice(dev, devices)) {
                    node.status({ fill: "red", shape: "dot", text: "new device" });
                    send([null, {payload: dev}, null]);
                }
            }
            for (const oldDev of devices) {
                if (!containsDevice(oldDev, newDevList)) {
                    node.status({ fill: "red", shape: "dot", text: "device gone" });
                    send([null, null, {payload: oldDev}]);
                }
            }
            devices = newDevList;
            firstScanComplete = true;
            node.status({ fill: "green", shape: "dot", text: "Scan Complete" });
            if(config.emit){
                send([{payload: devices}, null, null]);
                done();
            }
        });
    }

    function NetworkAware(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.emit("input", {"payload": "internal-sync"});

        node.on("input", function (msg, send, done) {
            if(!started){
                devScan(config, done, node, msg, send);
                setInterval(() => {
                    devScan(config, done, node, msg, send);
                }, parseInt(config.scanInterval)*1000);
                started = true;
            }else if (firstScanComplete){
                send([{payload: devices}, null, null]);
                done();
            }
        });
    }

    RED.nodes.registerType("network-aware", NetworkAware);
};


