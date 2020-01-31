const find = require('local-devices');
const request = require('request');
const crypto = require('crypto');

module.exports = function (RED) {

    function containsDevice(obj, list) {
        for (let x in list) {
            if (x.id === obj.id) {
                return true;
            }
        }
        return false;
    }

    //TODO: add strategy (all distinct, size of array)
    var devices = new Array();
    function NetworkAware(config) {
        RED.nodes.createNode(this, config);
        let node = this;
        node.on("input", function (msg, send, done) {
            let newDevList = [];
            node.status({ fill: "blue", shape: "ring", text: "scanning" });
            /*
            find('192.168.0.140').then(scan => {
                if(scan===[]){
                    node.status({ fill: "yellow", shape: "ring", text: "No devices found" });
                }
                console.log(scan);
                /*for(const fdev of scan){
                    console.log(fdev)
                    let idsha = crypto.createHash('sha256').update(fdev.mac).digest('hex');
                    let dev = {
                        id: idsha,
                        ip: fdev.ip,
                        name: fdev.name,
                        manufacturer: fdev.mac.substring(0,8)
                    }
                    newDevList.push(dev);
                    if(!containsDevice(fdev, devices)){        
                        node.status({ fill: "red", shape: "ring", text: "new device" });
                        send([null, dev, null]);
                    }
                    console.log(newDevList)
                }
            }).then(() => {
                for(const oldDev of devices) {
                    if(!containsDevice(oldDev,newDevList)){
                        node.status({ fill: "red", shape: "ring", text: "device gone" });
                        send([null, null, oldDev]);
                    }
                }
            }).then(()=>{
                devices = newDevList;
                send([newDevList, null, null]);
                done();
            })*/
            const nmap = require('libnmap');
            nmap.discover({verbose: true}, function(err, report) {
                if (err) throw new Error(err);
              
                for (let item in report) {
                  console.log(JSON.stringify(report[item], null, 2));
                }
            });
        });
    }

    RED.nodes.registerType("network-aware", NetworkAware);
};
