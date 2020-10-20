module.exports = function (RED) {
  function mode(myArray) {
    return myArray.reduce(
      (a, b, i, arr) =>
        arr.filter((v) => JSON.stringify(v) === JSON.stringify(a)).length >=
        arr.filter((v) => JSON.stringify(v) === JSON.stringify(b)).length
          ? a
          : b,
      null
    );
  }

  function setMajorityStatus(node, msg, done) {
    node.status({
      fill: "green",
      shape: "dot",
      text: "Majority",
    });

    node.send([msg, null]);

    done();
  }

  function setNoMajorityStatus(node, msg, done) {
    node.status({
      fill: "yellow",
      shape: "dot",
      text: "No Majority",
    });

    node.send([null, msg]);

    done();
  }

  function setErrorStatus(node, done) {
    node.status({
      fill: "red",
      shape: "dot",
      text: "Error: Unexpected Input",
    });

    done();
  }

  function sendOut(node, msg, done, majority) {
    if (majority) {
      setMajorityStatus(node, msg, done);
    } else {
      setNoMajorityStatus(node, msg, done);
    }
  }

  function ReplicationVoter(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let allValues = [];

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
        allValues = [];

        setErrorStatus(node, done);
      }
    });
  }

  RED.nodes.registerType("replication-voter", ReplicationVoter);
};
