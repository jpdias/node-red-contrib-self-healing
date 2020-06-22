module.exports = function (RED) {

    function readingsWatcher(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.minchange = config.minchange;
        this.maxchange = config.maxchange;
        this.lastvalue = null;

        this.on('input', function (msg) {
            if(isNaN(msg.payload)){
                node.status({
                    fill: "red",
                    shape: "circle",
                    text: "NaN"
                });
                return;
            }
            if(!this.lastvalue){
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "First value"
                });
                this.lastvalue = msg.payload;
                msg.timestamp = Date.now().toString();
                node.send([msg,null,null])
            } else {
                let diff =  Math.abs((this.lastvalue - msg.payload)/this.lastvalue);
                if(this.maxchange && diff >= this.maxchange){
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "max change"
                    });
                    msg.timestamp = Date.now().toString();
                    node.send([null,null,msg]);
                } else if (this.minchange && diff <= this.minchange){
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "minimal change"
                    });
                    msg.timestamp = Date.now().toString();
                    node.send([null,msg,null]);
                } else {
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: "ok"
                    });
                    this.lastvalue = msg.payload;
                    msg.timestamp = Date.now().toString();
                    node.send([msg,null,null]);
                }
            }
        });
    }
    RED.nodes.registerType("readings-watcher", readingsWatcher);
}