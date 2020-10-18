module.exports = function (RED) {
  function readingsWatcher(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    this.minchange = ((config.strategyMask & 1) == 1) ? config.minchange : null;
    this.maxchange = ((config.strategyMask & 2) == 2) ? config.maxchange : null;

    if ((config.strategyMask & 4) == 4) {
      this.stucklimit = config.stucklimit;
      this.readings = new BoundedStack(config.stucklimit);
    }
    else {
      this.stucklimit = null;
      this.readings = new BoundedStack(10);
    }

    this.on("input", function (msg, send, done) {

      // Add/Update timestamp in message
      msg.timestamp = Date.now().toString();

      // Validate message payload
      if (isNaN(msg.payload)) {
        node.status({
          fill: "red",
          shape: "circle",
          text: "NaN"
        });
        done("Expected a number as payload. Got: " + msg.payload);
        return;
      }


      // First registered reading
      if (this.readings.isEmpty()) {
        node.status({
          fill: "green",
          shape: "dot",
          text: "first reading",
        });
        // Add reading to stack
        this.readings.push(msg.payload);
        send([msg, null]);
        done();
        return;
      }

      // Get latest reading from stack
      let lastvalue = this.readings.peek();

      // Add new reading to stack
      this.readings.push(msg.payload);

      // Calculate percentual difference from last reading
      let diff = Math.abs((lastvalue - msg.payload) / lastvalue);
      let result = [null, null];
      let error = null;

      // Maximum change triggered
      if (this.maxchange && diff >= this.maxchange) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "max change",
        });
        msg.type = "maxchange";
        result[1] = msg;
        error = "Consecutive readings differ more than expected (Difference: " + diff + ")";
      }

      // Minimum change triggered
      else if (this.minchange && diff <= this.minchange) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "min change",
        });
        msg.type = "minchange";
        result[1] = msg;
        error = "Consecutive readings more similar than expected (Difference: " + diff + ")";
      }

      // Stuck at same reading triggered
      else if (this.stucklimit && this.readings.isFull() && this.readings.areAllElementsEqual()) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "stuck limit",
        });
        msg.type = "stucklimit";
        result[1] = msg;
        error = "Last " + this.stucklimit + " consecutive readings were the same (Value: " + msg.payload + ")";
      }

      // All good
      else {
        node.status({
          fill: "green",
          shape: "dot",
          text: "ok",
        });
        result[0] = msg;
      }

      // Send result message
      send(result);

      // Finish message handling and trigger errors if they happened
      if(error)
        done(error);
      else
        done();
    });
  }
  RED.nodes.registerType("readings-watcher", readingsWatcher);
};


class BoundedStack {
  constructor(maxsize) {
    this.stack = []
    this.maxsize = maxsize;
  }

  // Inserts the element into the top of the stack
  push(element) {

    // If stack is full, remove oldest element
    if(this.isFull())
      this.stack.shift();

    this.stack.push(element)
  }

  // Removes the element from the top of the stack and returns it.
  // Returns null if stack is empty.
  pop() {
    if (this.isEmpty())
      return null;
    return this.stack.pop();
  }

  // Returns the element from the tope of the stack
  // Returns null if stack is empty.
  peek() {
    if (this.isEmpty())
      return null;
    return this.stack[this.stack.length - 1];
  }

  // Check if stack is empty
  isEmpty() {
    return !this.stack.length;
  }

  // Check if stack is full
  isFull() {
    return this.stack.length >= this.maxsize;
  }

  areAllElementsEqual() {
    if(this.isEmpty())
      return false;

    return (this.stack.every(element => element === this.stack[0]));
  }
}