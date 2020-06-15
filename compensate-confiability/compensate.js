module.exports = function (RED) {
    var compensatedCounter = 0;
    var history = []
    var scheduler;
    var strategy;
    function confidenceLevel(compensatedCounter) {
        return (1 / compensatedCounter) >= 1 ? 1 : (1 / compensatedCounter);
    }    

    const mode = myArray =>
        myArray.reduce(
            (a, b, i, arr) =>
                arr.filter(v => JSON.stringify(v) === JSON.stringify(a)).length >= arr.filter(v => JSON.stringify(v) === JSON.stringify(b)).length ? a : b, null);

    /*function linearprediction(node, mode, history, histSize, send, done){
        /*
        Linear Prediction itself can be termed as a system identification problem, 
        where the parametersof an auto-regressive series are estimated within the series itself 

        linear prediction problem can be formulated
        in very simple terms and can be defined in the more general context of linear
        estimation and linear filtering (understood as smoothing)
        
       node.status({
            fill: "yellow",
            shape: "dot",
            text: "Timeout. Sending linear prediction."
        });

    }*/

    function modeCompensate(node, mode, history, histSize, send, done) {
        node.status({
            fill: "yellow",
            shape: "dot",
            text: "Timeout. Sending Mode"
        });
        let modeval = mode(history);

        send([
            { payload: modeval, confidenceLevel: confidenceLevel(compensatedCounter), timestamp:  Date.now().toString() },
            { payload: history[history.length - 1]  },
            { payload:  confidenceLevel(compensatedCounter)  }
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
            { payload: last, confidenceLevel: confidenceLevel(compensatedCounter), timestamp:  Date.now().toString() }, 
            { payload: history[history.length - 1]  }, 
            { payload: confidenceLevel(compensatedCounter) }
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
        send([{ payload: min, confidenceLevel: confidenceLevel(compensatedCounter), timestamp:  Date.now().toString() }, { payload: history[history.length - 1]  }, { payload: confidenceLevel(compensatedCounter) }]);
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
            { payload: max, confidenceLevel: confidenceLevel(compensatedCounter), timestamp:  Date.now().toString()  },
            { payload: history[history.length - 1]},
            { payload: confidenceLevel(compensatedCounter) }
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
            { payload: avg, confidenceLevel: confidenceLevel(compensatedCounter), timestamp:  Date.now().toString() }, 
            { payload: history[history.length - 1]  }, 
            { payload: confidenceLevel(compensatedCounter) }
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

    function CompensateConfiability(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        compensatedCounter = 0;
        history = [];
        strategy = config.strategy;
        node.on("input", function (msg, send, done) {
            if (!scheduler && typeof msg.payload === "number"){
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

                send([{payload: msg.payload, confidenceLevel: confidenceLevel(compensatedCounter), timestamp:  Date.now().toString()}, null, { payload: 1 }]);
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

    RED.nodes.registerType("sensor-compensate-confiability", CompensateConfiability);
};

