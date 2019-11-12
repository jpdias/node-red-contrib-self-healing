module.exports = function(RED) {
    const mode = (myArray) => myArray.reduce(
        (a,b,i,arr) => (
            arr.filter(v => JSON.stringify(v) === JSON.stringify(a)).length 
            >= arr.filter(v => JSON.stringify(v) === JSON.stringify(b)).length ? a : b
        ), null
    )

    function ReplicationVoter(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg, send, done) {
            if(msg.payload.constructor === Array){ 
                let arrayMode = mode(msg.payload);
                let majorCount = msg.payload.filter(x => JSON.stringify(x) == JSON.stringify(arrayMode)).length;
                msg.payload = arrayMode
                if(majorCount >= parseInt(config.majority)){
                    node.send([ msg, null ]);
                    done();
                } else {
                    node.send([ null, msg ]);
                    done();
                }
            } else {
                node.status({fill:"red",shape:"ring",text:"Error"});
                done(error);
            }
            
        });
    }

    RED.nodes.registerType("replication-voter",ReplicationVoter);
}
