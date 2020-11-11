const request = require("request");
const SentryLog = require("../utils/sentry-log.js");

module.exports = function (RED) {
  function setErrorStatus(errMsg, error, node, send, done) {
    node.status({
      fill: "red",
      shape: "dot",
      text: errMsg,
    });

    sendErrorOutput(error, send, done);
  }

  function sendErrorOutput(error, send, done) {
    send([null, { payload: "Error" }]);
    done(error);
  }

  function setSuccessStatus(node, sucessMsg, editedFlow, send, done, config) {
    node.status({
      fill: "green",
      shape: "dot",
      text: sucessMsg,
    });

    sendSuccessOutput(editedFlow, send, done, config);
  }

  function sendSuccessOutput(editedFlow, send, done, config) {
    send([
      {
        payload: {
          flow: config.targetFlow,
          disabled: editedFlow["disabled"],
        },
      },
      null,
    ]);

    done();
  }

  function setFlowStatus(targetUrl, editedFlow, node, send, done, config) {
    request
      .put(
        {
          uri: targetUrl,
          json: editedFlow,
        },
        function (error, response, body) {
          if (!error && response.statusCode == 200) {
            setSuccessStatus(node, "Ok", editedFlow, send, done, config);
          } else {
            setErrorStatus("Node Missconfig", error, node, send, done);
          }
          console.log("Upload successful!  Server responded with:", body);
        }
      )
      .on("error", function (error) {
        setErrorStatus("Node Missconfig", error, node, send, done);
      });
  }

  function getSetFlowStatus(targetUrl, node, msg, send, done, config) {
    request
      .get(targetUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          let editedFlow = JSON.parse(body);
          editedFlow["disabled"] = !msg.payload ? true : false;
          setFlowStatus(targetUrl, editedFlow, node, send, done, config);
        } else {
          setErrorStatus("Node Missconfig", error, node, send, done);
        }
      })
      .on("error", function (error) {
        setErrorStatus("Node Missconfig", error, node, send, done);
      });
  }

  function FlowControl(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("flow-control was deployed");
    const node = this;
    node.on("input", function (msg, send, done) {
      const targetUrl = `http://${config.targetHost}:${config.targetPort}/flow/${config.targetFlow}`;

      if (typeof msg.payload === "boolean") {
        getSetFlowStatus(targetUrl, node, msg, send, done, config);
      } else {
        setErrorStatus(
          "Not Boolean Input",
          "Input type is not boolean",
          node,
          send,
          done
        );
      }
    });
  }
  RED.nodes.registerType("flow-control", FlowControl);
};
