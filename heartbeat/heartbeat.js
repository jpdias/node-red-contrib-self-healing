module.exports = function (RED) {

    const https = require('https');

    function failedTrigger(node) {
        node.send({ payload: { status: 0, statusMessage: "Timeout" } , timestamp: Date.now().toString() })
    }

    function Heartbeat(config) {
        RED.nodes.createNode(this, config);

        this.interval_id = null;
        this.repeat = config.frequency;
        this.httpendpoint = config.httpendpoint;
        this.protocol = config.protocol;
        var node = this;

        node.repeaterSetup = function () {
            this.interval_id = setInterval(function () {
                node.emit("input", {});
            }, this.repeat * 1000); //from milis to seconds
        };

        if (this.protocol == "http") {
            node.repeaterSetup();
        }

        this.on("input", function () {
            if (this.protocol == "http") {
            
                https.get(this.httpendpoint, (resp) => {
                    const { statusCode, statusMessage } = resp;
                    if (statusCode == 200) {
                        node.status({
                            fill: "green",
                            shape: "dot",
                            text: "Ok"
                        });
                        node.send({ payload: { status: statusCode, statusMessage: statusMessage }, timestamp: Date.now().toString()  })
                    }
                    else {
                        node.status({
                            fill: "red",
                            shape: "circle",
                            text: "Failed"
                        });
                        node.send({ payload: { status: statusCode, statusMessage: statusMessage }, timestamp: Date.now().toString()  })
                    }

                }).on("error", (err) => {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Error"
                    });
                    node.send({ payload: { status: 0, statusMessage: err.message }, timestamp: Date.now().toString() })
                });
            
            } else if (this.protocol == "mqtt") {
                if (!this.interval_id) {
                    this.interval_id = setInterval(
                        failedTrigger,
                        parseInt(this.repeat) * 1000,
                        node,
                    );
                }
                clearInterval(this.interval_id);
                node.send({ payload: { status: 200, statusMessage: "Alive" } })
                this.interval_id = setInterval(
                    failedTrigger,
                    parseInt(this.repeat) * 1000,
                    node,
                );
                
            }

        });
    }

    RED.nodes.registerType("heartbeat", Heartbeat);
}