/**
 * 
 * In order for the checkpoint node to work properly,
 * local context storage must be set in your .node-red folder,
 * by adding the following:
 * 
    contextStorage: {
        default: "memoryOnly",
        memoryOnly: {
            module: 'memory'
        },
        file: {
            module: 'localfilesystem'
        },
    },
 *   
 */

module.exports = function (RED) {
    function checkpoint(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        function getPersistentContext(property) {
            return node.context().get(property, "file");
        }

        function setPersistentContext(property, value) {
            return node.context().set(property, value, "file");
        }

        let active = getPersistentContext("active");
        let lastMsg = getPersistentContext("lastMsg");

        if (active === undefined) {
            setPersistentContext("active", false);
            setPersistentContext("lastMsg", "");
        } 
        else if(active === true && lastMsg != undefined) {
            setTimeout(() => {
                node.emit("restart", lastMsg);
            }, 500);
        }

        node.on("input", function (msg, send, done) {
            if (getPersistentContext("active") === false)  {
                setPersistentContext("active", true);
            }
            setPersistentContext("lastMsg", msg);

            send([msg]);
            done();
        });

        node.on("restart", function (msg) {
            node.send([msg]);
        });
    }

    RED.nodes.registerType("checkpoint", checkpoint);
};
