/**
 * Implementation of a upper bounded stack.
 * When stack is full and an element is pushed, the last element is removed.
 */

class BoundedStack {
  constructor(maxsize) {
    this.stack = [];
    this.maxsize = maxsize;
  }

  push(element) {
    if (this.isFull()) this.stack.shift();
    this.stack.push(element);
  }

  pop() {
    if (this.isEmpty()) return null;
    return this.stack.pop();
  }

  peek() {
    if (this.isEmpty()) return null;
    return this.stack[this.stack.length - 1];
  }

  isEmpty() {
    return !this.stack.length;
  }

  isFull() {
    return this.stack.length >= this.maxsize;
  }

  areAllElementsEqual() {
    if (this.isEmpty()) return false;
    return this.stack.every((element) => element === this.stack[0]);
  }
}

module.exports = BoundedStack;
