var request = require('request');

module.exports = function(RED) {

    function FlowControl(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg, send, done) {
            targetUrl = `http://${config.targetHost}:${config.targetPort}/flow/${config.targetFlow}`
          
            if(typeof(msg.payload) === "boolean"){
                try {
                    request.get(targetUrl, function (error, response, body) {
                        
                        if (error) {
                            node.status({fill:"red",shape:"ring",text:"Error"});
                            done(error);
                        }
                        editedFlow = JSON.parse(body)
                        editedFlow["disabled"] = msg.payload ? true : false
                        request.put({
                            method: 'PUT',
                            uri: targetUrl,
                            json: editedFlow
                        }, function (error, response, body) {
                        if (error) {
                            node.status({fill:"red",shape:"ring",text:"Error"});
                            node.send({"payload": "error"});
                            done(error);
                        } else {
                            node.status({fill:"green",shape:"ring",text:"Ok"});
                            node.send({"payload": {"id": config.targetFlow, "isDisabled": editedFlow["disabled"]}});
                            done();
                        }
                        console.log('Upload successful!  Server responded with:', body);
                        })
                    });
                } catch (error) {
                    if (error) {
                        node.status({fill:"red",shape:"ring",text:"Node Missconfig"});
                        done(error);
                    } 
                }    
            }
        });
    }

    RED.nodes.registerType("flow-control",FlowControl);
}
