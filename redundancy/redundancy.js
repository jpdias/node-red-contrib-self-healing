module.exports = function(RED) {
    const os = require("os");

    var masterExists = false;
    function getIp() {
        let ips = [];

        var interfaces = os.networkInterfaces();

        for (var i in interfaces) {
            interfaces[i].forEach(function(details) {
                details.interface = i;
                if (!details.internal) {
                    delete details.netmask;
                    delete details.mac;
                    delete details.internal;

                    ips.push(details);
                }
            });
        }
        return ips[0].address;
    }

    function setMaster(node, send, done) {
        let isMaster = false;

        if(!node.context().get("ips")){
            let ips = new Set();
            console.log(JSON.stringify(ips));
            node.context().set("ips", ips);
        }
        let res = Array.from(node.context().get("ips"));
        let major = null;
        if(res.lenght >= 0){
            major = res.reduce(function(a, b) {
                return Math.max(parseInt(a.slice(-2)), parseInt(b.slice(-2)));
            });
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
            node.context().set("master", true);
            isMaster = true;
        }

        send([{ "payload": {"master": isMaster} }, { "payload": res }]);
        done();
    }

    function RedundancyManager(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on("input", function(msg, send, done) {
            setTimeout(
                setMaster,
                parseInt(config.timeout) * 1000,
                node,
                send,
                done
            );
            if(!msg.hostip){
                node.status({ fill: "red", shape: "ring", text: "Error in input" });
                return;
            }
            if (!node.context().get("ips")) {
                let ips = new Set([msg.hostip]);
                console.log(JSON.stringify(ips));
                node.context().set("ips", ips);
            } else {
                let nodes = node.context().get("ips");
                if (typeof msg.hostip != "undefined") {
                    nodes.add(msg.hostip);
                    node.context().set("ips", nodes);
                }
            }
            if (msg.payload.master == "true") {
                masterExists = true;
            }
            
        });
    }

    RED.nodes.registerType("redundancy-manager", RedundancyManager);
};
