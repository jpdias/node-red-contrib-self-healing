let jsc = require("jsverify");
const BoundedStack = require("../utils/bounded-stack");

function isEqual(elem1, elem2) {
  return elem1 == elem2;
}

function isLessOrEqual(num1, num2) {
  return num1 <= num2;
}

describe("bounded stack", function () {
  jsc.property("max length is never passed", "array number", "nat", function (
    arr,
    nat
  ) {
    let boundedStack = new BoundedStack(nat);
    arr.forEach((element) => {
      boundedStack.push(element);
    });
    return isLessOrEqual(boundedStack.stack.length, nat);
  });

  jsc.property(
    "peeked element is always the last inserted",
    "array number",
    jsc.integer(1, 10000),
    function (arr, nat) {
      let boundedStack = new BoundedStack(nat);

      let lastElement = undefined;
      arr.forEach((element) => {
        boundedStack.push(element);
        lastElement = element;
      });
      return isEqual(boundedStack.peek(), lastElement);
    }
  );

  jsc.property(
    "pushing then popping -> empty stack",
    "array number",
    "nat",
    function (arr, nat) {
      let boundedStack = new BoundedStack(nat);

      arr.forEach((element) => {
        boundedStack.push(element);
        boundedStack.pop();
      });
      return isEqual(boundedStack.stack.length, 0);
    }
  );

  jsc.property(
    "popping on empty returns null",
    "nat",
    jsc.integer(1, 100),
    function (arr, nat, num) {
      let boundedStack = new BoundedStack(nat);

      let allNull = true;
      for (let i = 0; i < num; i++) {
        let element = boundedStack.pop();
        if (element != null) allNull = false;
      }
      return allNull;
    }
  );
});
