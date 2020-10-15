module.exports = function (RED) {
    function Timing(config) {
        RED.nodes.createNode(this, config);

        this.lastTimestamp = null;
        this.periodBetweenReadings = config.period * 1000; //seconds to milliseconds
        this.intervalMargin = config.margin;

        this.maximumPeriod = this.periodBetweenReadings + this.intervalMargin*this.periodBetweenReadings;
        this.minimumPeriod = this.periodBetweenReadings - this.intervalMargin*this.periodBetweenReadings;

        let node = this;

        this.on('input', (msg) => {
            let currentTimestamp = Date.now();

            if(this.lastTimestamp == null){
                this.lastTimestamp = currentTimestamp;
                msg.timestamp = currentTimestamp;

                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "First message"
                });

                node.send([msg, null, null]);
            }
            else{
                let intervalPeriod = currentTimestamp - this.lastTimestamp;

                if(intervalPeriod > this.maximumPeriod){
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "Too Fast"
                    });
    
                    node.send([null, null, msg]);
                }
                else if(intervalPeriod < this.minimumPeriod){
                    node.status({
                        fill: "yellow",
                        shape: "dot",
                        text: "Too Slow"
                    });
    
                    node.send([null, msg, null]);
                }
                else{
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: "Normal"
                    });
    
                    node.send([msg, null, null]);
                }
            }
        }
        );
    }

    RED.nodes.registerType("timing", Timing);
}
