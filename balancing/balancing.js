module.exports = function (RED) {
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

    let roundRobinWeights = config.weights.split(".").map(Number);

    let roundRobinOutput = 0;

    this.on("input", function (msg) {
      let outputArray = new Array(numberOutputs);
      outputArray.fill(null);

      let out;

      switch (algorithm) {
        case "1": {
          out = roundRobinOutput%numberOutputs;
          roundRobinOutput++;
          outputArray[out] = msg;
          node.send(outputArray);
          break;
        }
        case "2": {
          let totalWeight = roundRobinWeights.reduce((x, y) => x + y);

          let rand = Math.random();
          let a = 0;
          out = 0;
          for (let i = 0; i < roundRobinWeights.length; i++) {
            if (a <= rand && rand < roundRobinWeights[i] / totalWeight + a) {
              out = i;
              break;
            } else {
              a = roundRobinWeights[i] / totalWeight + a;
            }
          }

          outputArray[out] = msg;
          node.send(outputArray);
          break;
        }

        case "3": {
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
