module.exports = function (RED) {

    const https = require('https');

    function failedTrigger(node) {
        node.send({ payload: { status: 0, statusMessage: "Dead" } })
    }

    function Heartbeat(config) {
        RED.nodes.createNode(this, config);

        this.interval_id = null;
        this.repeat = config.frequency;
        this.httpendpoint = config.httpendpoint;
        this.httpprobe = config.httpprobe;
        var node = this;

        node.repeaterSetup = function () {
            this.interval_id = setInterval(function () {
                node.emit("input", {});
            }, this.repeat);
        };

        if (config.protocol == "http") {
            node.repeaterSetup();
        }

        this.on("input", function (msg) {
            if (config.protocol == "http") {
                if (this.httpprobe) {
                    https.get(this.httpendpoint, (resp) => {
                        const { statusCode, statusMessage } = resp;
                        if (statusCode !== 200) {
                            node.status({
                                fill: "green",
                                shape: "dot",
                                text: "Ok"
                            });
                            node.send({ payload: { status: statusCode, statusMessage: statusMessage } })
                        }
                        else {
                            node.status({
                                fill: "red",
                                shape: "circle",
                                text: "Failed"
                            });
                            node.send({ payload: { status: statusCode, statusMessage: statusMessage } })
                        }

                    }).on("error", (err) => {
                        node.status({
                            fill: "red",
                            shape: "dot",
                            text: "Error"
                        });
                        node.send({ payload: { status: 0, statusMessage: err.message } })
                    });
                }
            } else if (config.protocol == "mqtt") {
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