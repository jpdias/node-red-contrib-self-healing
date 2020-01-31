var arpping = require('arpping')({
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

    function devScan(config, done, node, msg, send) {
        node.status({ fill: "blue", shape: "dot", text: "Scanning..." });
        arpping.discover(config.baseip, (err, hosts) => {
            let newDevList = [];
            if (err) {
                done();
                node.status({ fill: "red", shape: "dot", text: "Error" });
                return console.log(err);
            }
            for (const fdev of hosts) {
                let idsha = crypto.createHash('sha256').update(fdev.mac).digest('hex');
                let dev = {
                    id: idsha,
                    ip: fdev.ip,
                    type: fdev.type,
                    manufacturer: oui(fdev.mac.substring(0, 8)).split("\n")[0]
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


