module.exports = function(RED) {

    function ThresholdWatcher(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg, send, done) {
            
        });
    }

    RED.nodes.registerType("flow-control",FlowControl);
}
