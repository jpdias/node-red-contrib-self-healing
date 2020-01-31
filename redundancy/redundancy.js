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

    /*setMaster if none exists*/
    var masterExists = false;
    var syncPayload = {"payload": {"sync": "ping", "master": false}};

    function getMajor(res){
        return res.reduce(function(a, b) {
            return Math.max(
                Array.from(a.split('.')).map(item => parseInt(item)).reduce((a, b) => a + b, 0),
                Array.from(b.split('.')).map(item => parseInt(item)).reduce((a, b) => a + b, 0),
            );
        });
    }

    //Bully Algorithm
    function setMaster(node, send, done) {
        let isMaster = false;
        let res = Array.from(node.context().get("ips"));
        let major = null;
        if(res.lenght >= 0){
            major = getMajor(res)
        }
        
        if (res.lenght == 0 &&
            !node.context().global.get("master") &&
            !masterExists) {
            node.context().global.set("master", true);
            isMaster = true;
        } else if (
            major <= parseInt(getIp().slice(-2)) &&
            !node.context().global.get("master") &&
            !masterExists
        ) {
            node.context().global.set("master", true);
            isMaster = true;
        }
        syncPayload.payload.master = node.context().global.get("master");
        send([{ "payload": {"master": isMaster} }, { "payload": node.context().get("ips") }, syncPayload]);
        done();
    }

    function RedundancyManager(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var timeout = "undefined";
        node.context().global.set("master", false);
        node.context().set("ips", new Set());
        let interval = parseInt(config.pingInterval) < 15 ? 15 : 30;

        node.emit("input", {"payload": "internal-sync"});

        setInterval(() => {
            node.emit("input", {"payload": "internal-sync"});
        }, interval*1000);

        node.on("input", function(msg, send, done) {

            if (timeout == "undefined"){
                timeout = setTimeout(
                setMaster,
                parseInt(config.timeout) * 1000,
                node,
                send,
                done
                );
            }
            if(node.context().global.get("master")){
                node.status({ fill: "green", shape: "dot", text: "I'm Master"}); 
            }
            else if (msg.payload.master == "true") {
                masterExists = true;
                node.context().global.set("master", false);
                clearTimeout(timeout);
                node.status({ fill: "yellow", shape: "dot", text: "I'm Slave. Master is "+ msg.hostip});
            }

            //update ip list
            let allips = node.context().get("ips");
            if (typeof msg.hostip != "undefined") {
                console.log(">>"+JSON.stringify(node.context().get("ips")))
                allips.add(msg.hostip);
                node.context().set("ips", allips);
            }

            //
            if(msg.payload == "internal-sync"){
                syncPayload.payload.master = node.context().global.get("master");
                send([null, null, syncPayload]);
                node.status({ fill: "green", shape: "dot", text: "Sync Ping"});
                done();
            }
        });
    }

    RED.nodes.registerType("redundancy-manager", RedundancyManager);
};
