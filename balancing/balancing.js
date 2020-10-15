module.exports = function(RED) {
  function Balancing(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let numberOutputs = config.outputs;
    /**
     * Algorithm values:
     *   1: Round Robin
     *   2: Weighted Round Robin
     *   3: Random Distribution
     */
    let algorithm = config.algorithm;
    
    let lastOutputUsed = 0;

    this.on("input", function (msg) {
      let outputArray = new Array(numberOutputs);
      outputArray.fill(null);
      
      switch (algorithm) {
        case "1":
          //Round Robin
          outputArray[lastOutputUsed] = msg;

          lastOutputUsed++;
          if (lastOutputUsed == numberOutputs) {
              lastOutputUsed = 0;
          }

          node.send(outputArray);
          break;
    
        case "2":
          //Weighted Round Robin (TODO)
          break;
     
        case "3":
          //Random Distribution
          let out = Math.floor((Math.random() * 4));
          outputArray[out] = msg;
          
          node.send(outputArray);
          break;

        default:
          break;
      }
    });

  }

  RED.nodes.registerType("balancing", Balancing);
}