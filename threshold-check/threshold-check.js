module.exports = function (RED) {
  "use strict";

  var operators = {
    eq: {
      apply(a, b) {
        return a == b;
      },
      describe(a, b) {
        return "" + a + "==" + b;
      },
    },
    neq: {
      apply(a, b) {
        return a != b;
      },
      describe(a, b) {
        return "" + a + "!=" + b;
      },
    },
    lt: {
      apply(a, b) {
        return a < b;
      },
      describe(a, b) {
        return "" + a + "<" + b;
      },
    },
    lte: {
      apply(a, b) {
        return a <= b;
      },
      describe(a, b) {
        return "" + a + "<=" + b;
      },
    },
    gt: {
      apply(a, b) {
        return a > b;
      },
      describe(a, b) {
        return "" + a + ">" + b;
      },
    },
    gte: {
      apply(a, b) {
        return a >= b;
      },
      describe(a, b) {
        return "" + a + ">=" + b;
      },
    },
    btwn: {
      apply(a, b, c) {
        return a >= b && a <= c;
      },
      describe(a, b, c) {
        return "" + a + " is between " + b + " and " + c;
      },
    },
    within: {
      apply(a, b, c) {
        return a >= c - b && a <= c + b;
      },
      describe(a, b, c) {
        return "" + a + " is within " + b + " of " + c;
      },
    },
    cont: {
      apply(a, b) {
        return (a + "").indexOf(b) != -1;
      },
      describe(a, b) {
        return "" + a + " contains " + b;
      },
    },
    regex: {
      apply(a, b, _, d) {
        return (a + "").match(new RegExp(b, d ? "i" : ""));
      },
      describe(a, b, _, d) {
        return "" + a + " " + b + " case insensitive: " + d;
      },
    },
    true: {
      apply(a) {
        return a === true;
      },
      describe(a) {
        return "" + a + " is true";
      },
    },
    false: {
      apply(a) {
        return a === false;
      },
      describe(a) {
        return "" + a + " is false";
      },
    },
    null: {
      apply(a) {
        return typeof a == "undefined" || a === null;
      },
      describe(a) {
        return "" + a + " is null";
      },
    },
    nnull: {
      apply(a) {
        return typeof a != "undefined" && a !== null;
      },
      describe(a) {
        return "" + a + " is not null";
      },
    },
    type: {
      apply(a, b) {
        if (b == "array") return Array.isArray(a);
        else if (b == "buffer") return Buffer.isBuffer(a);
        else return typeof a == b && !Array.isArray(a) && !Buffer.isBuffer(a);
      },
      describe(a, b) {
        return (
          (Array.isArray(a)
            ? "array"
            : Buffer.isBuffer(a)
            ? "buffer"
            : typeof a) +
          " is " +
          b
        );
      },
    },
  };

  function thresholdCheck(n) {
    RED.nodes.createNode(this, n);
    this.rules = n.rules || [];
    var node = this;
    for (var i = 0; i < this.rules.length; i += 1) {
      var rule = this.rules[i];

      rule.propertyType = rule.propertyType || "msg";

      rule.previousValue = [];
      rule.meanSize = 1;

      if (!rule.valueType) {
        if (!isNaN(parseFloat(rule.value))) {
          rule.valueType = "num";
        } else {
          rule.valueType = "str";
        }
      }
      if (rule.valueType === "num") {
        rule.value = parseFloat(rule.value);
      }
      if (typeof rule.value2 !== "undefined") {
        if (!rule.value2Type) {
          if (!isNaN(parseFloat(rule.value2))) {
            rule.value2Type = "num";
          } else {
            rule.value2Type = "str";
          }
        }
        if (rule.value2Type === "num") {
          rule.value2 = parseFloat(rule.value2);
        } else if (rule.value2Type === "mean") {
          rule.meanSize = parseInt(rule.value2);
        }
      }
    }

    node.on("input", function (msg, send, done) {
      try {
        for (var i = 0; i < node.rules.length; i += 1) {
          var rule = node.rules[i];
          var test = RED.util.evaluateNodeProperty(
            rule.property,
            rule.propertyType,
            node,
            msg
          );

          var pass = true;

          if (
            !(
              (rule.valueType === "prev" ||
                rule.value2Type === "prev" ||
                rule.valueType === "mean" ||
                rule.value2Type === "mean") &&
              rule.previousValue.length == 0
            )
          ) {
            var v1, v2;
            if (rule.valueType === "prev") {
              v1 = rule.previousValue[0];
            } else if (rule.valueType === "mean") {
              v1 =
                rule.previousValue.reduce(
                  (previous, current) => (current += previous)
                ) / rule.previousValue.length;
            } else {
              v1 = RED.util.evaluateNodeProperty(
                rule.value,
                rule.valueType,
                node,
                msg
              );
            }
            v2 = rule.value2;
            if (rule.value2Type === "prev") {
              v2 = rule.previousValue[0];
            } else if (rule.value2Type === "mean") {
              v2 =
                rule.previousValue.reduce(
                  (previous, current) => (current += previous)
                ) / rule.previousValue.length;
            } else if (typeof v2 !== "undefined") {
              v2 = RED.util.evaluateNodeProperty(
                rule.value2,
                rule.value2Type,
                node,
                msg
              );
            }
            pass = operators[rule.type].apply(test, v1, v2, rule.case);
          }

          rule.previousValue.push(test);
          while (rule.previousValue.length > rule.meanSize)
            rule.previousValue.shift();

          if (!pass) {
            node.status({
              fill: "red",
              shape: "dot",
              text:
                rule.failMsg.length > 1
                  ? rule.failMsg
                  : "Assertion " + (i + 1) + " failed",
            });
            send([
              null,
              {
                payload: msg.payload,
                fault:
                  "Assertion " +
                  (i + 1) +
                  " failed: " +
                  " " +
                  rule.propertyType +
                  ":" +
                  rule.property +
                  ": " +
                  operators[rule.type].describe(test, v1, v2, rule.case) +
                  " " +
                  rule.failMsg,
              },
            ]);
            done();
          } else {
            node.status({
              fill: "green",
              shape: "dot",
              text: "ok",
            });
            send([msg, null]);
            done();
          }
        }
      } catch (err) {
        node.error(err, msg);
        done();
      }
    });
  }
  RED.nodes.registerType("threshold-check", thresholdCheck);
};
