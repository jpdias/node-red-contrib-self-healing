const SentryLog = require("../utils/sentry-log.js");

/**
 * 
 * In order for the checkpoint node to work properly,
 * local context storage must be set in your .node-red folder,
 * by adding the following:
 * 
    contextStorage: {
        default: "memoryOnly",
        memoryOnly: {
            module: 'memory'
        },
        file: {
            module: 'localfilesystem'
        },
    },
 *   
 */

module.exports = function (RED) {
  function checkpoint(config) {
    RED.nodes.createNode(this, config);
    SentryLog.sendMessage("checkpoint was deployed");
    let node = this;
    config.ttl = parseInt(config.ttl) || 3600;

    function getTime() {
      return Math.round(new Date() / 1000);
    }

    function getPersistentContext(property) {
      return node.context().get(property, "file");
    }

    function setPersistentContext(property, value) {
      return node.context().set(property, value, "file");
    }

    let active = getPersistentContext("active");
    let lastMsg = getPersistentContext("lastMsg");

    if (active === undefined) {
      setPersistentContext("active", false);
      setPersistentContext("lastMsg", "");
      setPersistentContext("timestamp", getTime());
    } else if (active === true && lastMsg !== undefined) {
      setTimeout(() => {
        node.emit("restart");
      }, 500);
    }

    node.on("input", function (msg, send, done) {
      if (getPersistentContext("active") === false) {
        setPersistentContext("active", true);
      }
      setPersistentContext("lastMsg", msg);
      setPersistentContext("timestamp", getTime());

      send([msg]);

      SentryLog.sendMessage("Received new checkpoint message");

      done();
    });

    node.on("restart", function () {
      let lastMsg = getPersistentContext("lastMsg");
      let timestamp = parseInt(getPersistentContext("timestamp"));
      if (timestamp === undefined || getTime() < timestamp + config.ttl) {
        setPersistentContext("timestamp", getTime());
        node.send([lastMsg]);

        SentryLog.sendMessage("Checkpoint was restarted");
      }
    });

    node.on("reset", function () {
      node.context().set("active", undefined, "file");
      node.context().set("lastMsg", undefined, "file");
      node.context().set("timestamp", undefined, "file");

      SentryLog.sendMessage("Checkpoint was reset");
    });
  }

  RED.nodes.registerType("checkpoint", checkpoint);
};
