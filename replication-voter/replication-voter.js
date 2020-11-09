module.exports = function (RED) {
  function mode(values, margin) {
    let checked = [];
    let modeValues = [];

    let i;

    for (i = 0; i < values.length; i++) {
      if (checked.includes(values[i])) continue;

      checked[checked.length] = values[i];

      let currentValues = [];
      let j;

      if (margin != null) j = 0;
      else {
        currentValues[0] = values[i];
        j = i + 1;
      }

      for (; j < values.length; j++) {
        if (
          margin != null &&
          values[j] >= values[i] * (1 - margin) &&
          values[j] <= values[i] * (1 + margin)
        )
          currentValues[currentValues.length] = values[j];
        else if (values[j] === values[i])
          currentValues[currentValues.length] = values[j];
      }

      if (currentValues.length > modeValues.length) {
        modeValues = currentValues;
      }
    }

    return modeValues;
  }

  function mean(values) {
    let total = 0;
    let i;

    for (i = 0; i < values.length; i++) {
      total = total + values[i];
    }

    return total / values.length;
  }

  function createSameTypeArray(arr, type) {
    let newArr = [];
    let i;

    for (i = 0; i < arr.length; i++) {
      if (typeof arr[i] === type) newArr[newArr.length] = arr[i];
    }
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
        let sameTypeArray = createSameTypeArray(msg.payload, config.valueType);

        let modeValues;

        if (config.valueType === "number" && config.margin != null)
          modeValues = mode(sameTypeArray, config.margin / 100);
        else modeValues = mode(sameTypeArray, null);

        msg.payload = mean(modeValues);
        allValues = [];

        sendOut(
          node,
          msg,
          done,
          modeValues.length >= parseInt(config.majority)
        );
      } else if (
        (msg.payload.constructor === Number ||
          msg.payload.constructor === String) &&
        typeof config.countInputs != "undefined"
      ) {
        if (typeof msg.payload === config.valueType)
          allValues.push(msg.payload);

        if (allValues.length == config.countInputs) {
          let modeValues;

          if (config.valueType === "number" && config.margin != null)
            modeValues = mode(allValues, config.margin / 100);
          else modeValues = mode(allValues, null);

          msg.payload = mean(modeValues);
          allValues = [];

          sendOut(
            node,
            msg,
            done,
            modeValues.length >= parseInt(config.majority)
          );
        }
      } else {
        allValues = [];

        setErrorStatus(node, done);
      }
    });
  }

  RED.nodes.registerType("replication-voter", ReplicationVoter);
};
