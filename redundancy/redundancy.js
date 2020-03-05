module.exports = function(RED) {
    /*get my ip stuff*/
    const os = require("os");
    function getIp() {
        let ips = [];
        var interfaces = os.networkInterfaces();
        for (var i in interfaces) {
            interfaces[i].forEach(function(details) {
                details.interface = i;
                if (!details.internal) {
                    ips.push(details.address);
                }
            });
        }
        return ips[0];
    }

    var master = false;
    var masterExists = false;
    var lastAlive = {};
    var ips = new Set();
    var thisip = "";

    function getMajor(res){
        return res.reduce(function(a, b) {
            return Math.max(
                Array.from(a.split('.')).map(item => parseInt(item)).reduce((a, b) => a + b, 0),
                Array.from(b.split('.')).map(item => parseInt(item)).reduce((a, b) => a + b, 0),
            );
        });
    }

    //Bully Algorithm
    function setMaster(send) {
        if(masterExists){
            return
        }

        let major = 0;
        
        if(ips.size > 0){
            major = getMajor(ips)
        }
        console.log(ips.size)
        console.log(master)
        console.log(ips)
        if (ips.size == 0 && !master) {
            master = true;
            masterExists = true;
        } else if (major <= thisip && !master) {
            master = true;
            masterExists = true;
        } else {
            master = false;
        }

        send([
            { "payload": {"master": master} }, 
            { "payload": Array.from(ips) }, 
            { "payload": {"sync": "ping", "master": master}}
        ]);
    }

    var init = false;

    function aliveBeat(timeout, send) {

        let d = new Date();
        for (let [key, value] of Object.entries(lastAlive)) {
            //console.log(`${key}: ${value}`);
            if( d.getMilliseconds() - value.last >= timeout){
                if(value.isMaster){
                    masterExists = false;
                    setMaster(send);
                }
                ips.delete(key.replace("-","."));
                delete lastAlive[key];
            }
        }

        send([
            { "payload": {"master": master} }, 
            { "payload": Array.from(ips) }, 
            { "payload": {"sync": "ping", "master": master}}
        ])
    }

    function RedundancyManager(config) {
        RED.nodes.createNode(this, config);
        let node = this;
        let voting = "undefined";
        let alive = "undefined";
        thisip = parseInt(getIp().slice(-2))

        node.emit("input", {"payload": "internal-sync"});

        node.on("input", function(msg, send, done) {

            if (voting == "undefined" && alive == "undefined" && !init){
                voting = setInterval(
                    setMaster,
                    parseInt(config.frequency) * 1000,
                    send
                );
                alive = setInterval( 
                    aliveBeat,
                    parseInt(config.pingInterval) * 1000,
                    parseInt(config.timeout) * 1000,
                    send
                );
                init = true;
            }

            if(master){
                node.status({ fill: "green", shape: "dot", text: "I'm Master"}); 
            }
            else if (msg.payload.master && !master) {
                console.log(ips.size)
                console.log(master)
                console.log(ips)
                master = false;
                masterExists = true;
                node.status({ fill: "yellow", shape: "dot", text: "Master is "+ msg.hostip});
            } else if (msg.payload.master && master && getMajor(ips) > thisip){
                master = false;
                masterExists = true;
            }

            //update ip list
            if (typeof msg.hostip != "undefined") {
                console.log(">>"+JSON.stringify(ips))
                var d = new Date();
                lastAlive[msg.hostip.replace(".","-")] = { 
                        last: d.getMilliseconds(),
                        isMaster: msg.payload.master
                    };
                ips.add(msg.hostip);
            }

        });
    }

    RED.nodes.registerType("redundancy-manager", RedundancyManager);
};
