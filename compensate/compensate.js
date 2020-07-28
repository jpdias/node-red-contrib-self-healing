module.exports = function (RED) {
    var compensatedCounter = 0
    var history = []
    var scheduler
    var strategy
    var confidenceFormula
    function confidenceLevel(compensatedCounter, history) {
        console.log(confidenceFormula);
        if(confidenceFormula == "") {
            return NaN
        }
        try {
            return eval(confidenceFormula);
        }
        catch (e) {
            return NaN
        }
        //(1 / compensatedCounter) >= 1 ? 1 : (1 / compensatedCounter);
    }

    const mode = myArray =>
        myArray.reduce(
            (a, b, i, arr) =>
                arr.filter(v => JSON.stringify(v) === JSON.stringify(a)).length >= arr.filter(v => JSON.stringify(v) === JSON.stringify(b)).length ? a : b, null);


    function modeCompensate(node, mode, history, histSize, send, done) {
        node.status({
            fill: "yellow",
            shape: "dot",
            text: "Timeout. Sending Mode"
        });
        let modeval = mode(history);

        send([
            { payload: modeval, confidenceValue: confidenceLevel(compensatedCounter, history), timestamp: Date.now().toString() }
        ]);
        done();
    }

    function lastCompensate(node, history, histSize, send, done) {
        node.status({
            fill: "yellow",
            shape: "dot",
            text: "Timeout. Sending Last"
        });
        let last = history[history.length - 1];
        send([
            { payload: last, confidenceValue: confidenceLevel(compensatedCounter, history), timestamp: Date.now().toString() }
        ]);
        done();
    }

    function minCompensate(history, node, histSize, send, done) {
        let min = history.reduce((prev, curr) => {
            return Math.min(prev, curr);
        });
        node.status({
            fill: "yellow",
            shape: "dot",
            text: "Timeout. Sending Min"
        });
        send([{ payload: min, confidenceValue: confidenceLevel(compensatedCounter, history), timestamp: Date.now().toString() }]);
        done();
    }

    function maxCompensate(history, node, histSize, send, done) {
        let max = history.reduce((prev, curr) => {
            return Math.max(prev, curr);
        });
        node.status({
            fill: "yellow",
            shape: "dot",
            text: "Timeout. Sending Max"
        });
        send([
            { payload: max, confidenceValue: confidenceLevel(compensatedCounter, history), timestamp: Date.now().toString() }
        ]);
        done();
    }

    function meanCompensate(history, node, histSize, send, done) {
        /*
        Moving Average (MA) Model (since hist only contains the "histSize" values)
        */
        let sum = history.reduce(function (a, b) {
            return a + b;
        });
        let avg = sum / history.length;
        node.status({
            fill: "yellow",
            shape: "dot",
            text: "Timeout. Sending Mean"
        });
        send([
            { payload: avg, confidenceValue: confidenceLevel(compensatedCounter, history), timestamp: Date.now().toString() }
        ]);
        done();
    }

    function sendMessage(node, send, done, strategy, histSize) {
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
        } else {
            node.status({ fill: "red", shape: "dot", text: "There is no historical data" });
        }
    }

    function Compensate(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        clearInterval(scheduler);
        compensatedCounter = 0;
        history = [];
        strategy = config.strategy;
        confidenceFormula = config.confidenceFormula;
        node.on("input", function (msg, send, done) {
            if (!scheduler && typeof msg.payload === "number") {
                scheduler = setInterval(
                    sendMessage,
                    parseInt(config.timeout) * 1000,
                    node,
                    send,
                    done,
                    strategy,
                    config.msghistory
                );
            }
            clearInterval(scheduler);
            if (typeof msg.payload === "number") {
                if (history.length > config.msghistory) {
                    history.shift();
                }
                history.push(msg.payload);
                node.status({ fill: "green", shape: "dot", text: "Ok" });
                compensatedCounter == 0 ? compensatedCounter = 0 : compensatedCounter--;

                send([{ payload: msg.payload, confidenceValue: confidenceLevel(compensatedCounter, history), timestamp: Date.now().toString() }]);
                scheduler = setInterval(
                    sendMessage,
                    parseInt(config.timeout) * 1000,
                    node,
                    send,
                    done,
                    strategy,
                    config.msghistory
                );
                done();
            } else {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Payload Not a Number"
                });
            }
        });
    }

    RED.nodes.registerType("sensor-compensate", Compensate);
};

