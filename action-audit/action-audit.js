const Queue = require("../utils/queue.js");

module.exports = function (RED) {
  function actionAudit(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    config.duration = parseInt(config.duration) || 30;
    let actionQueue = new Queue();

    function timeoutAction(msg) {
      if (!actionQueue.isEmpty()) {
        msg.error = "Timeout occured";
        actionQueue.dequeue();
        node.send([null, msg, null]);
      }
    }

    function receiveAction(msg) {
      const timeout = setTimeout(
        timeoutAction.bind(null, msg),
        config.duration * 1000
      );
      actionQueue.push({
        msg: msg,
        timeoutId: timeout,
      });
    }

    function receiveAck(msg, send) {
      if (actionQueue.isEmpty()) {
        msg.exception = "Received ack with no queued actions";
        send([null, null, msg]);
      } else {
        const action = actionQueue.dequeue();
        clearTimeout(action.timeoutId);
        send([action.msg, null, null]);
      }
    }

    node.on("input", function (msg, send, done) {
      if (msg.action !== undefined) {
        receiveAction(msg, done);
      } else if (msg.ack !== undefined) {
        receiveAck(msg, send);
      } else {
        msg.exception = "Msg has neither action or ack field";
        send([null, null, msg]);
      }

      done();
    });

    node.on("close", function () {
      while (!actionQueue.isEmpty()) {
        clearTimeout(actionQueue.dequeue().timeoutId);
      }
    });
  }

  RED.nodes.registerType("action-audit", actionAudit);
};
