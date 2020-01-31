module.exports = function (RED) {
    //TODO: add strategy (all distinct, size of array)
    function Distinct(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var lastMsg;
        node.on("input", function (msg, send, done) {
            if(typeof lastMsg == "undefined" || lastMsg != msg.payload){
                lastMsg = msg.payload;
                node.status({ fill: "green", shape: "dot", text: "Distinct" });
                send([msg, null]);
                done();
            } else {
                node.status({ fill: "red", shape: "dot", text: "Repeated" });
                send([null, msg]);
                done();
            }
        });
    }

    RED.nodes.registerType("distinct", Distinct);
};
