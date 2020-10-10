module.exports = function (RED) {
  function testNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    // When this node receives a message
    this.on("input", function (msg) {
      // Set payload property of message to node's "integerValue" property
      msg.payload = config.integerValue;
      // Send output message
      node.send(msg);
    });
  }
  RED.nodes.registerType("test-node", testNode);
};
