module.exports = function (RED) {
  function countOccurrences(arr, val, margin) {
    return arr.reduce(function (a, v) {
      return val + margin >= v && v >= val - margin ? a + 1 : a;
    }, 0);
  }

  function majorityCheck(values, margin, majorityCount) {
    let counts = {};
    values.forEach(function (x) {
      counts[x] = counts[x] || 0;
      counts[x] = countOccurrences(values, x, margin);
    });
    let mostFreq = Object.keys(counts).reduce(function (a, b) {
      return counts[a] > counts[b] ? a : b;
    });

    if (counts[mostFreq] >= majorityCount) {
      return Number(mostFreq);
    } else {
      return null;
    }
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
    if (values.length === 0) return null;

    if (majority) {
      if (config.valueType === "string" || config.valueType === "boolean") {
        if (values === "true" || values === "false") {
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

  function findMajorityInArray(allValues, config, node, done, timeout) {
    let msg = { timeout: timeout };
    if (allSameTypeInArray(allValues, "number")) {
      //array of numbers
      let majorityVal = majorityCheck(
        allValues,
        config.margin,
        config.majority
      );
      if (majorityVal) {
        // majority
        let valuesToConsider = allValues.filter(function (value) {
          return (
            majorityVal + config.margin >= value &&
            value >= majorityVal - config.margin
          );
        });
        msg.payload = msgToSend(valuesToConsider, true, config);
        sendOut(node, msg, done, true);
      } else {
        //no majority
        msg.payload = msgToSend(allValues, false, config);
        sendOut(node, msg, done, false);
      }
    } else if (
      allSameTypeInArray(allValues, "string") ||
      allSameTypeInArray(allValues, "boolean")
    ) {
      //array of strings or booleans
      let counts = {};
      allValues.forEach(function (x) {
        counts[x] = (counts[x] || 0) + 1;
      });
      let mostFreq = Object.keys(counts).reduce(function (a, b) {
        return counts[a] > counts[b] ? a : b;
      }); //side-effect: bools -> string
      if (counts[mostFreq] >= config.majority) {
        msg.payload = msgToSend(mostFreq, true, config);
        sendOut(node, msg, done, true);
      } else {
        msg.payload = msgToSend(allValues, false, config);
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
    let timeout = "undefined";

    function resetTimeout() {
      clearTimeout(timeout);
      timeout = "undefined";
    }

    function timeoutFunction(allValues, config, node, done) {
      node.status({
        fill: "yellow",
        shape: "dot",
        text: "Timeout",
      });
      findMajorityInArray(allValues, config, node, done, true);
      resetTimeout();
    }

    node.on("input", function (msg, send, done) {
      //if input is an array
      if (Array.isArray(msg.payload) && msg.payload.length > 0) {
        findMajorityInArray(msg.payload, config, node, done, false);
        allValues = []; //safeguard when mixing values and arrays
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
            resetTimeout();
            findMajorityInArray(allValues, config, node, done, false);
            allValues = [];
          } else if (config.timeout > 0 && timeout == "undefined") {
            timeout = setTimeout(
              timeoutFunction,
              config.timeout * 1000,
              allValues,
              config,
              node,
              done
            );
          }
        } else {
          setErrorStatus(node, done);
        }
      }
    });
  }

  RED.nodes.registerType("replication-voter", ReplicationVoter);
};
