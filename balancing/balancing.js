module.exports = function(RED) {
    function Balancing(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            node.send([msg, msg]);
        });

    }

    RED.nodes.registerType("balancing", Balancing);
}