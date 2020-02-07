const find = require('local-devices');
const crypto = require('crypto');
const oui = require('oui');

module.exports = function (RED) {
    
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

        find(config.baseip).then(devicesScan => {
            let newDevList = new Array();
            devicesScan.forEach(obj => {
                let idsha = uuidv4();
                let mnf = "unknown"
                let name = "unknown"
                if(typeof obj.mac == "string"){ //if not mac, set uuid
                    idsha = crypto.createHash('sha256').update(obj.mac).digest('hex');
                    mnf = oui(obj.mac.substring(0, 8)) 
                }

                if(typeof obj.name == "string"){
                    name = obj.name
                }
                
                if(mnf != "unknown"){
                    mnf = oui(obj.mac.substring(0, 8)).split("\n")[0]
                }
                let dev = {
                    id: idsha,
                    ip: obj.ip,
                    name: name,
                    manufacturer: mnf,
                    timestamp: new Date().toISOString()
                };
                newDevList.push(dev);
                node.log("foreach"+JSON.stringify(node.context().get("devices")));
                if (!containsDevice(dev, node.context().get("devices"))) {
                    node.log("Device new: " + dev.ip);
                    node.status({ fill: "red", shape: "dot", text: "device up" });
                    send(null, {payload: dev}, null);
                }
            })
            node.log("return"+JSON.stringify(node.context().get("devices")));
            return newDevList
        }).then((newDevList) => {
            node.context().get("devices").forEach(oldDev => {
                node.log("Checking for old/removed devices");
                if (!containsDevice(oldDev, newDevList)) {
                    node.status({ fill: "red", shape: "dot", text: "device down" });
                    node.log("Device Removed: " + oldDev.ip);
                    send(null, null, {payload: oldDev});
                }
            })
            node.context().set("devices", newDevList);
            firstScanComplete = true;
            node.status({ fill: "green", shape: "dot", text: "Scan Complete: " +  new Date().toISOString()});
            node.log("complete"+JSON.stringify(node.context().get("devices")));
            if(config.emit){
                send({payload: newDevList}, null, null);
            }
            done();
        }).catch(err => { 
            node.status({ fill: "red", shape: "dot", text: JSON.stringify(err.message) });
            node.log('caught', err.message); 
        });
    }

    function NetworkAware(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.emit("input", {"payload": "internal-sync"});
        node.on("input", function (msg, send, done) {
            if(!started){
                node.context().set("devices", []);
                devScan(config, done, node, msg, send);
                setInterval(() => {
                    devScan(config, done, node, msg, send);
                }, parseInt(config.scanInterval)*1000);
                started = true;
            }else if (firstScanComplete){
                send({payload: node.context().get("devices")}, null, null);
            } else {
                node.status({ fill: "yellow", shape: "dot", text: "Running first scan" });
            }
        });
    }

    RED.nodes.registerType("network-aware", NetworkAware);
};


