module.exports = function (RED) {
  function Balancing(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    // Number of outputs for the node
    let numberOutputs = config.outputs;

    /**
     * Algorithm values:
     *   1: Round Robin
     *   2: Weighted Round Robin
     *   3: Random Distribution
     */
    let algorithm = config.algorithm;

    /**
     * Array with weights for the outputs.
     * Only used when Weighted Round Robin algorithm is chosen
     */
    let wei = config.weights.split(".").map(Number);

    let roundRobinOutput = 0;

    this.on("input", function (msg) {
      // Create the array that is used to output the message
      let outputArray = new Array(numberOutputs);
      outputArray.fill(null);

      let out;

      switch (algorithm) {
        case "1": {
          //Round Robin
          outputArray[roundRobinOutput] = msg;

          roundRobinOutput++;
          if (roundRobinOutput == numberOutputs) {
            roundRobinOutput = 0;
          }

          node.send(outputArray);
          break;
        }
        case "2": {
          //Weighted Round Robin

          let totalWeight = wei.reduce((x, y) => x + y);

          let rand = Math.random();
          let a = 0;
          out = 0;
          for (let i = 0; i < wei.length; i++) {
            if (a <= rand && rand < wei[i] / totalWeight + a) {
              out = i;
              break;
            } else {
              a = wei[i] / totalWeight + a;
            }
          }

          outputArray[out] = msg;
          node.send(outputArray);
          break;
        }

        case "3": {
          //Random Distribution
          out = Math.floor(Math.random() * numberOutputs);
          outputArray[out] = msg;

          node.send(outputArray);
          break;
        }

        default: {
          break;
        }
      }
    });
  }

  RED.nodes.registerType("balancing", Balancing);
};
