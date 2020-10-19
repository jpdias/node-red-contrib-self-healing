module.exports = function (RED) {
  function ActionDelay(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let delayInMilis = parseInt(config.delay) * 1000;
    let schedule = "undefined";
    let allActions = []; //all msg payloads
    let lastMsgTimestamp = 0;

    function resetSchedule() {
      clearInterval(schedule);
      schedule = "undefined";
    }

    const executeMsg = (send, done) => {
      if (allActions.length == 0) {
        resetSchedule();
      } else if (config.strategy == "allByOrder") {
        send([allActions.shift(), null]);
        done();
      } else if (config.strategy == "last") {
        send([allActions.pop(), null]);
        allActions = [];
        resetSchedule();
        done();
      } else if (config.strategy == "first") {
        send([allActions.shift(), null]);
        allActions = [];
        resetSchedule();
        done();
      }
    };
    node.on("input", function (msg, send, done) {
      const newMsgTimestamp = new Date().getTime();
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
        const newMsg = msg;
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
