let jsc = require("jsverify");
const Queue = require("../utils/queue");

function isEqual(elem1, elem2) {
  return elem1 == elem2;
}

describe("queue", function () {
  jsc.property(
    "dequeued element is always the first inserted before any dequeue",
    "array number",
    function (arr) {
      let queue = new Queue();

      let firstElement = undefined;
      if (arr.length > 0) firstElement = arr[0];
      arr.forEach((element) => {
        queue.push(element);
      });
      return isEqual(queue.dequeue(), firstElement);
    }
  );

  jsc.property(
    "pushing then dequeing -> empty queue",
    "array number",
    function (arr) {
      let queue = new Queue();

      arr.forEach((element) => {
        queue.push(element);
        queue.dequeue();
      });
      return isEqual(queue.getElements().length, 0);
    }
  );

  jsc.property(
    "dequeing on empty returns undefined",
    jsc.integer(1, 100),
    function (num) {
      let queue = new Queue();

      let allUndefined = true;
      for (let i = 0; i < num; i++) {
        let element = queue.dequeue();
        if (element != undefined) allUndefined = false;
      }
      return allUndefined;
    }
  );
});
