/**
 * Implementation of a regular queue.
 */

class Queue {
  constructor() {
    this.elements = [];
  }

  push(element) {
    this.elements.push(element);
  }

  dequeue() {
    return this.elements.shift();
  }

  isEmpty() {
    return this.elements.length == 0;
  }

  getLength() {
    return this.elements.length;
  }

  getElements() {
    return this.elements;
  }

  peek() {
    return this.isEmpty() ? undefined : this.elements[0];
  }
}

module.exports = Queue;
