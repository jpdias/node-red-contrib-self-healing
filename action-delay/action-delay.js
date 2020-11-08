module.exports = function (RED) {
  function ActionDelay(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let delayInMilis = parseInt(config.delay) * 1000;
    let delayInterval =
      config.delayInterval != null ? parseInt(config.delayInterval) : 0;
    let schedule = "undefined";
    let allActions = []; //all msg payloads
    let lastMsgTimestamp = null;

    function resetSchedule() {
      clearInterval(schedule);
      schedule = "undefined";
    }

    const executeMsg = (send, done) => {
      if (allActions.length == 0) {
        // no messages to be sent
        resetSchedule();
      } else if (config.strategy == "allByOrder") {
        // send all messages by order
        send([allActions.shift(), null]);
        done();
      } else if (config.strategy == "last") {
        // send the last message received
        send([allActions.pop(), null]);
        allActions = []; // clear message payload
        resetSchedule();
        done();
      } else if (config.strategy == "first") {
        //send the first message received
        send([allActions.shift(), null]);
        allActions = [];
        resetSchedule();
        done();
      }
    };
    node.on("input", function (msg, send, done) {
      const newMsgTimestamp = new Date().getTime();
      // first message
      if (this.lastMsgTimestamp == null) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "First",
        });
        this.lastMsgTimestamp = newMsgTimestamp; // add latest sent message timestamp
        node.send([msg, null]);
        done();
        return;
      }

      // message is within interval
      // and there is no message backlog
      // pass message, all clear and good
      if (
        newMsgTimestamp - lastMsgTimestamp >= delayInMilis - delayInterval &&
        allActions.length == 0
      ) {
        node.status({ fill: "green", shape: "dot", text: "Dispatched" });
        lastMsgTimestamp = newMsgTimestamp; // update latest sent message timestamp
        send([msg, null]);
        done();
        return;
      }
      // message isn't within interval
      if (newMsgTimestamp - lastMsgTimestamp < delayInMilis - delayInterval) {
        allActions.push(msg); // add message to payload
        node.status({
          fill: "yellow",
          shape: "dot",
          text: "Delayed: " + allActions.length,
        });
        const newMsg = msg;
        newMsg.timestamp = newMsgTimestamp;
        send([null, msg]);
        done();
      }

      if (config.strategy == "discard") {
        allActions = []; // clear payload
      } else if (schedule == "undefined") {
        schedule = setInterval(executeMsg, delayInMilis, send, done);
      }
    });

    node.on("close", function () {
      resetSchedule();
    });
  }

  RED.nodes.registerType("action-delay", ActionDelay);
};
