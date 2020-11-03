module.exports = function (RED) {
  function ResourceMonitorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.on("input", function (msg, send, done) {
      send(msg);
      done();
    });
  }
  RED.nodes.registerType("resource-monitor", ResourceMonitorNode);
};
