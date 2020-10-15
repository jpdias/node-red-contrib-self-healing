module.exports = function(RED) {
  function Balancing(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    /**
     * Algorithm values:
     *   1: Round Robin
     *   2: Weighted Round Robin
     *   3: Random Distribution
     */
    this.algorithm = config.algorithm; 
    this.outputs = config.outputs;
    
    
    this.on("input", function (msg) {
      this.outputArray = new Array(this.outputs);
      this.outputArray.fill(null);
      
      switch (this.algorithm) {
        case "1":
          //Round Robin (TODO)
          break;
    
        case "2":
          //Weighted Round Robin (TODO)
          break;
     
        case "3":
          //Random Distribution
          var out = Math.floor((Math.random() * 4));
          this.outputArray[out] = msg;
          
          node.send(this.outputArray);
          break;

        default:
          break;
      }
    });

  }

  RED.nodes.registerType("balancing", Balancing);
}