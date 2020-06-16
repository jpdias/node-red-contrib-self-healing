module.exports = function (RED) {

    function Timing(config) {
        RED.nodes.createNode(this, config);
        this.lastTimestamp = null;
        this.repeat = config.frequency*1000; // from seconds to milis
        this.margin = config.margin;
        this.max = this.repeat * (1+this.margin);
        this.min = this.repeat * (1-this.margin);
        var node = this;

        this.on("input", function (msg) {
            if(!this.lastTimestamp){
                this.lastTimestamp = Date.now();
                msg.timestamp = this.lastTimestamp;
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "First msg"
                });
                node.send([msg,null,null]);
            } else {
                let nowtime = Date.now();
                let difference = this.lastTimestamp - nowtime;
                if(difference < this.max && difference > this.min){
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: "Ok"
                    });
                    msg.timestamp = nowtime;
                    node.send([msg,null,null]);
                } else if (difference > this.max) {
                    node.status({
                        fill: "yellow",
                        shape: "dot",
                        text: "Too slow"
                    });
                    msg.timestamp = nowtime;
                    node.send([null, msg, null]);
                } else if (difference < this.min) {
                    node.status({
                        fill: "yellow",
                        shape: "dot",
                        text: "Too fast"
                    });
                    msg.timestamp = nowtime;
                    node.send(null, null, msg);
                }
                this.lastTimestamp = nowtime;
            }
        });
    }

    RED.nodes.registerType("timing", Timing);
}