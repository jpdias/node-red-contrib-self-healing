module.exports = function (RED) {
  function ActionDelay(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var delayInMilis = parseInt(config.delay) * 1000;
    var schedule = "undefined";
    var allActions = []; //all msg payloads
    var lastMsgTimestamp = 0;

    executeMsg = (send, done) => {
      if (allActions.length == 0) {
        clearInterval(schedule);
        schedule = "undefined";
      } else if (config.strategy == "allByOrder") {
        send([allActions.shift(), null]);
        done();
      } else if (config.strategy == "last") {
        send([allActions.pop(), null]);
        allActions = [];
        clearInterval(schedule);
        schedule = "undefined";
        done();
      } else if (config.strategy == "first") {
        send([allActions.shift(), null]);
        allActions = [];
        clearInterval(schedule);
        schedule = "undefined";
        done();
      }
    };
    node.on("input", function (msg, send, done) {
      newMsgTimestamp = new Date().getTime();
      if (
        newMsgTimestamp - lastMsgTimestamp >= delayInMilis &&
        allActions.length == 0
      ) {
        //pass message, all clear and good
        node.status({ fill: "green", shape: "dot", text: "Dispatched" });
        lastMsgTimestamp = newMsgTimestamp;
        send([msg, null]);
        done();
        return;
      } else if (newMsgTimestamp - lastMsgTimestamp < delayInMilis) {
        node.status({ fill: "yellow", shape: "dot", text: "Delayed" });
        newMsg = msg;
        newMsg.timestamp = newMsgTimestamp;
        lastMsgTimestamp = newMsgTimestamp;
        allActions.push(msg);
        send([null, msg]);
        done();
      }
      if (config.strategy == "discard") {
        allActions = [];
      } else if (schedule == "undefined") {
        schedule = setInterval(executeMsg, delayInMilis, send, done);
      }
    });
  }

  RED.nodes.registerType("action-delay", ActionDelay);
};
