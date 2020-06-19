module.exports = function (RED) {

    function readingsWatcher(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.minchange = config.minchange;
        this.maxchange = config.maxchange;
        this.lastvalue = null;

        this.on('input', function (msg) {
            if(typeof msg.payload != Number){
                node.status({
                    fill: "red",
                    shape: "circle",
                    text: "NaN"
                });
                node.done();
                return;
            }
            if(!this.lastvalue){
                node.status({
                    fill: "green",
                    shape: "circle",
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
                        shape: "circle",
                        text: "max change"
                    });
                    msg.timestamp = Date.now().toString();
                    node.send([null,null,msg]);
                } else if (this.minchange && diff <= this.minchange){
                    node.status({
                        fill: "red",
                        shape: "circle",
                        text: "minimal change"
                    });
                    msg.timestamp = Date.now().toString();
                    node.send([null,msg,null]);
                } else {
                    node.status({
                        fill: "green",
                        shape: "circle",
                        text: "ok"
                    });
                    msg.timestamp = Date.now().toString();
                    node.send([msg,null,null]);
                }
                this.lastvalue = msg.payload;
            }
        });
    }
    RED.nodes.registerType("readings-watcher", readingsWatcher);
}