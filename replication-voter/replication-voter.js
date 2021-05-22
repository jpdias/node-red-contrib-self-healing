module.exports = function (RED) {
  function arrayWithoutElementAtIndex(arr, index) {
    return arr.filter(function (value, arrIndex) {
      return index !== arrIndex;
    });
  }

  function majorityCheck(values, margin, majorityCount) {
    for (let i = 0; i < values.length; i++) {
      let count = 1;
      arrayWithoutElementAtIndex(values, i).forEach((rElement) => {
        if (values[i] + margin >= rElement && rElement >= values[i] - margin) {
          count++;
        }
      });
      if (count >= majorityCount) {
        return values[i];
      }
    }
    return null;
  }

  function mean(values) {
    return values.reduce((a, b) => a + b) / values.length;
  }

  function max(values) {
    return Math.max.apply(null, values);
  }

  function min(values) {
    return Math.min.apply(null, values);
  }

  function msgToSend(values, majority, config) {
    if (values.length == 0) return null;

    if (majority) {
      if (config.valueType === "string" || config.valueType === "boolean") {
        if (values === "true" || values[0] === "false") {
          return values === "true";
        }
        return values;
      } else if (config.valueType === "number") {
        if (config.result === "mean") return mean(values);
        else if (config.result === "highest") return max(values);
        else if (config.result === "lowest") return min(values);
        else return values[0];
      }
    } else {
      return values;
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

  function allSameTypeInArray(arr, valueType) {
    return arr.reduce(function (result, val) {
      return result && typeof val === valueType;
    }, true);
  }

  function findMajorityInArray(msg, config, node, done) {
    if (allSameTypeInArray(msg.payload, "number")) {
      //array of numbers
      let majorityVal = majorityCheck(
        msg.payload,
        config.margin,
        config.majority
      );
      if (majorityVal) {
        // majority
        let valuesToConsider = msg.payload.filter(function (value) {
          return (
            majorityVal + config.margin >= value &&
            value >= majorityVal - config.margin
          );
        });
        msg.payload = msgToSend(valuesToConsider, true, config);
        sendOut(node, msg, done, true);
      } else {
        //no majority
        msg.payload = msgToSend(msg.payload, false, config);
        sendOut(node, msg, done, false);
      }
    } else if (
      allSameTypeInArray(msg.payload, "string") ||
      allSameTypeInArray(msg.payload, "boolean")
    ) {
      //array of strings or booleans
      let counts = {};
      msg.payload.forEach(function (x) {
        counts[x] = (counts[x] || 0) + 1;
      });
      let mostFreq = Object.keys(counts).reduce(function (a, b) {
        return counts[a] > counts[b] ? a : b;
      });
      if (counts[mostFreq] >= config.majority) {
        msg.payload = msgToSend(mostFreq, true, config);
        sendOut(node, msg, done, true);
      } else {
        msg.payload = msgToSend([mostFreq], false, config);
        sendOut(node, msg, done, false);
      }
    } else {
      setErrorStatus(node, done);
    }
  }

  function ReplicationVoter(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let allValues = [];

    node.on("input", function (msg, send, done) {
      //if input is an array
      if (Array.isArray(msg.payload) && msg.payload.length > 0) {
        findMajorityInArray(msg, config, node, done);
      }

      //if input is a value
      if (
        typeof msg.payload == "string" ||
        typeof msg.payload == "number" ||
        typeof msg.payload == "boolean"
      ) {
        if (allSameTypeInArray(allValues, typeof msg.payload)) {
          allValues.push(msg.payload);
          if (allValues.length >= config.countInputs) {
            findMajorityInArray(msg, config, node, done);
            allValues = [];
          }
        } else {
          setErrorStatus(node, done);
        }
      }
    });
  }

  RED.nodes.registerType("replication-voter", ReplicationVoter);
};
