module.exports = function (RED) {
  const mode = (myArray) =>
    myArray.reduce(
      (a, b, i, arr) =>
        arr.filter((v) => JSON.stringify(v) === JSON.stringify(a)).length >=
        arr.filter((v) => JSON.stringify(v) === JSON.stringify(b)).length
          ? a
          : b,
      null
    );

  function ReplicationVoter(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var allValues = [];

    const sendOut = (node, msg, done, majority) => {
      if (majority) {
        node.status({ fill: "green", shape: "dot", text: "Majority" });
        node.send([msg, null]);
        done();
      } else {
        node.status({ fill: "yellow", shape: "dot", text: "No majority" });
        node.send([null, msg]);
        done();
      }
    };

    node.on("input", function (msg, send, done) {
      if (msg.payload.constructor === Array) {
        let arrayMode = mode(msg.payload);
        let majorCount = msg.payload.filter(
          (x) => JSON.stringify(x) == JSON.stringify(arrayMode)
        ).length;
        msg.payload = arrayMode;
        sendOut(node, msg, done, majorCount >= parseInt(config.majority));
      } else if (
        msg.payload.constructor === Number &&
        typeof config.countInputs != "undefined"
      ) {
        allValues.push(msg.payload);
        if (allValues.length == config.countInputs) {
          let arrayMode = mode(allValues);
          let majorCount = allValues.filter(
            (x) => JSON.stringify(x) == JSON.stringify(arrayMode)
          ).length;
          msg.payload = arrayMode;
          allValues = [];
          sendOut(node, msg, done, majorCount >= parseInt(config.majority));
        }
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Error: Unexpected Input",
        });
        allValues = [];
        done();
      }
    });
  }

  RED.nodes.registerType("replication-voter", ReplicationVoter);
};
