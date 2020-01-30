module.exports = function (RED) {
    var compensatedCounter = 0;

    function confidenceLevel(compensatedCounter, history) {
        return (1 / compensatedCounter + 1 / history.length) >= 1 ? 1 : (1 / compensatedCounter + 1 / history.length);
    }    

    const mode = myArray =>
        myArray.reduce(
            (a, b, i, arr) =>
                arr.filter(v => JSON.stringify(v) === JSON.stringify(a)).length >= arr.filter(v => JSON.stringify(v) === JSON.stringify(b)).length ? a : b, null);

    function modeCompensate(node, mode, history, histSize, send, done) {
        node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Mode"
        });
        let modeval = mode(history);
        node.context().set("history" + node.id, history);
        send([{ payload: modeval }, { payload: history[history.length - 1] }, { payload:  confidenceLevel(compensatedCounter, history)  }]);
        done();    }

    function lastCompensate(node, history, histSize, send, done) {
        node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Last"
        });
        let last = history[history.length - 1];
        node.context().set("history" + node.id, history);
        send([{ payload: last }, { payload: history[history.length - 1] }, { payload: confidenceLevel(compensatedCounter, history) }]);
        done();
    }

    function minCompensate(history, node, histSize, send, done) {
        let min = history.reduce((prev, curr) => {
            return Math.min(prev, curr);
        });
        node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Min"
        });
        node.context().set("history" + node.id, history);
        send([{ payload: min }, { payload: history[history.length - 1] }, { payload: confidenceLevel(compensatedCounter, history) }]);
        done();
    }

    function maxCompensate(history, node, histSize, send, done) {
        let max = history.reduce((prev, curr) => {
            return Math.max(prev, curr);
        });
        node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Max"
        });
        node.context().set("history" + node.id, history);
        send([{ payload: max }, { payload: history[history.length - 1] }, { payload: confidenceLevel(compensatedCounter, history) }]);
        done();
    }

    function meanCompensate(history, node, histSize, send, done) {
        let sum = history.reduce(function (a, b) {
            return a + b;
        });
        let avg = sum / history.length;
        node.status({
            fill: "yellow",
            shape: "ring",
            text: "Timeout. Sending Mean"
        });
        node.context().set("history" + node.id, history);
        send([{ payload: avg }, { payload: history[history.length - 1] }, { payload: confidenceLevel(compensatedCounter, history) }]);
        done();
    }

    function sendMessage(node, send, done, strategy, histSize) {
        let history = node.context().get("history" + node.id);
        if (history.length > 0) {
            compensatedCounter++;
            switch (strategy) {
                case "mean":
                    meanCompensate(history, node, histSize, send, done);
                    break;
                case "max":
                    maxCompensate(history, node, histSize, send, done);
                    break;
                case "min":
                    minCompensate(history, node, histSize, send, done);
                    break;
                case "last":
                    lastCompensate(node, history, histSize, send, done);
                    break;
                case "mode":
                    modeCompensate(node, mode, history, histSize, send, done);
                    break;
                default:
                    break;
            }
        }
    }

    function CompensateConfiability(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var schedule = "undefined";
        node.context().set("history" + node.id, []);
        node.on("input", function (msg, send, done) {
            let strategy = config.strategy;
            let history = node.context().get("history" + node.id);
            if (schedule == "undefined")
                schedule = setInterval(
                    sendMessage,
                    parseInt(config.timeout) * 1000,
                    node,
                    send,
                    done,
                    strategy,
                    config.msghistory
                );
            if (typeof msg.payload === "number") {
                clearInterval(schedule);
                schedule = setInterval(
                    sendMessage,
                    parseInt(config.timeout) * 1000,
                    node,
                    send,
                    done,
                    strategy,
                    config.msghistory
                );
                if (history.length > config.msghistory) {
                    history.shift();
                }
                history.push(msg.payload);
                node.context().set("history" + node.id, history);
                node.status({ fill: "green", shape: "ring", text: "Ok" });
                compensatedCounter === 0 ? 0 : compensatedCounter--;
                send([msg, null, { payload: 1 }]);
                done();
            } else {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "Payload Not a Number"
                });
            }
        });
    }

    RED.nodes.registerType("sensor-compensate-confiability", CompensateConfiability);
};

