var request = require("request");

module.exports = function(RED) {
    function setFlowStatus(targetUrl, editedFlow, node, done, config) {
        request
            .put(
                {
                    method: "PUT",
                    uri: targetUrl,
                    json: editedFlow
                },
                function(error, response, body) {
                    if (error) {
                        node.status({
                            fill: "red",
                            shape: "ring",
                            text: "Error"
                        });
                        node.send([null, { payload: "error" }]);
                        done(error);
                    } else {
                        node.status({
                            fill: "green",
                            shape: "ring",
                            text: "Ok"
                        });
                        node.send([
                            {
                                payload: {
                                    id: config.targetFlow,
                                    disabled: editedFlow["disabled"]
                                }
                            },
                            null
                        ]);
                        done();
                    }
                    console.log(
                        "Upload successful!  Server responded with:",
                        body
                    );
                }
            )
            .on("error", function(err) {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "Node Missconfig"
                });
                done(err);
            });
    }

    function getSetFlowStatus(
        targetUrl,
        node,
        done,
        msg,
        setFlowStatus,
        config
    ) {
        request
            .get(targetUrl, function(error, response, body) {
                if (error) {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "Error"
                    });
                    done(error);
                }
                let editedFlow = JSON.parse(body);
                editedFlow["disabled"] = !msg.payload ? true : false;
                setFlowStatus(targetUrl, editedFlow, node, done, config);
            })
            .on("error", function(err) {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "Node Missconfig"
                });
                done(err);
            });
    }
    function FlowControl(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on("input", function(msg, send, done) {
            let targetUrl = `http://${config.targetHost}:${config.targetPort}/flow/${config.targetFlow}`;

            if (typeof msg.payload === "boolean") {
                try {
                    getSetFlowStatus(
                        targetUrl,
                        node,
                        done,
                        msg,
                        setFlowStatus,
                        config
                    );
                } catch (error) {
                    if (error) {
                        node.status({
                            fill: "red",
                            shape: "ring",
                            text: "Node Missconfig"
                        });
                        done(error);
                    }
                }
            }
        });
    }

    RED.nodes.registerType("flow-control", FlowControl);
};
