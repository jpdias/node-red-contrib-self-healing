var request = require('request');

module.exports = function(RED) {

    editorConfig = {
        settings: {
            targetNodeRed: {
                value: "http://localhost",
                exportable: true
            }
        }
    }

    function FlowControl(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        node.on('input', function(msg, send, done) {
            targetUrl = `http://localhost:1880/flow/${RED.settings.targetNodeRed}`

            if(typeof(msg.payload) === "boolean" && msg.payload){
                request('targetUrl', function (error, response, body) {
                    body.disabled = false
                    request({
                        method: 'PUT',
                        uri: targetUrl,
                        body: body
                    }, function (error, response, body) {
                      if (error) {
                        node.status({fill:"red",shape:"ring",text:"Error"});
                        done(err);
                      } else {
                        node.status({fill:"green",shape:"ring",text:"Ok"});
                        done();
                      }
                      console.log('Upload successful!  Server responded with:', body);
                    })
                });    
            }
        });
    }

    RED.nodes.registerType("flow-control",FlowControl, editorConfig);
}
