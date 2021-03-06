var helper = require("node-red-node-test-helper");
var sinon = require("sinon");
var debounceTest = require("../debounce/debounce.js");
let clock;

helper.init(require.resolve("node-red"));

let shouldDiscard = [2, 3, 4, 5, 6, 7, 8, 9];
let expectedAllByOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function setupFlow(nodeStrategy, nodeDelay, nodeDelayInterval) {
  let testFlow = [
    {
      id: "node1",
      type: "debounce",
      name: "debounce",
      delay: nodeDelay,
      delayInterval: nodeDelayInterval,
      strategy: nodeStrategy,
      wires: [["node2"], ["node3"]],
    },
    { id: "node2", type: "helper" },
    { id: "node3", type: "helper" },
  ];
  return testFlow;
}

function testInput(DispatchExpected, testFlow, done) {
  helper.load(debounceTest, testFlow, function () {
    let debounce = helper.getNode("node1");
    let pass = helper.getNode("node2");
    let delay = helper.getNode("node3");

    let passMsgCounter = 0;
    let delayMsgCounter = 0;

    let passSpy = sinon.spy();
    let delaySpy = sinon.spy();

    pass.on("input", function (msg) {
      passSpy();
      try {
        msg.payload.should.equal(DispatchExpected[passMsgCounter++]);
      } catch (err) {
        done(err);
      }
    });

    delay.on("input", function (msg) {
      delaySpy();
      try {
        msg.payload.should.equal(shouldDiscard[delayMsgCounter++]);
      } catch (err) {
        done(err);
      }
    });

    for (let i = 0; i < expectedAllByOrder.length - 1; i++) {
      debounce.receive({ payload: expectedAllByOrder[i] });
    }
    clock.tick(1001);
    debounce.receive({
      payload: expectedAllByOrder[expectedAllByOrder.length - 1],
    });
    clock.tick(10);

    try {
      passSpy.callCount.should.be.equal(DispatchExpected.length);
      delaySpy.callCount.should.be.equal(shouldDiscard.length);
      done();
    } catch (error) {
      done(error);
    }
  });
}

describe("debounce-test Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
    clock = sinon.useFakeTimers();
  });

  afterEach(function (done) {
    clock.restore();
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    let testFlow = [{ id: "node1", type: "debounce", name: "debounce" }];

    // Load flow and start it
    helper.load(debounceTest, testFlow, function () {
      let myTestNode = helper.getNode("node1");

      try {
        myTestNode.should.have.property("name", "debounce");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("It should discard all delayed messages", function (done) {
    let testFlow = setupFlow("discard", 1, 0);
    let expectedDiscard = [1, 10];

    testInput(expectedDiscard, testFlow, done);
  });

  it("It should send the first delayed message", function (done) {
    let testFlow = setupFlow("first", 1, 0);
    let expectedFirst = [1, 2, 10];

    testInput(expectedFirst, testFlow, done);
  });

  it("It should send the last delayed message", function (done) {
    let testFlow = setupFlow("last", 1, 0);
    let expectedLast = [1, 9, 10];

    testInput(expectedLast, testFlow, done);
  });

  it("It should send all the delayed messages", function (done) {
    let testFlow = setupFlow("allByOrder", 1, 0);

    helper.load(debounceTest, testFlow, function () {
      let debounce = helper.getNode("node1");
      let pass = helper.getNode("node2");
      let delay = helper.getNode("node3");

      let passMsgCounter = 0;
      let delayMsgCounter = 0;

      let passSpy = sinon.spy();
      let delaySpy = sinon.spy();

      pass.on("input", function (msg) {
        passSpy();
        try {
          msg.payload.should.equal(expectedAllByOrder[passMsgCounter++]);
        } catch (err) {
          done(err);
        }
      });

      delay.on("input", function (msg) {
        delaySpy();
        try {
          msg.payload.should.equal(shouldDiscard[delayMsgCounter++]);
        } catch (err) {
          done(err);
        }
      });

      for (let i = 0; i < expectedAllByOrder.length - 1; i++) {
        debounce.receive({ payload: expectedAllByOrder[i] });
      }
      clock.tick(9090);
      debounce.receive({
        payload: expectedAllByOrder[expectedAllByOrder.length - 1],
      });
      clock.tick(10);

      try {
        passSpy.callCount.should.be.equal(expectedAllByOrder.length);
        delaySpy.callCount.should.be.equal(shouldDiscard.length);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("It should send all the delayed messages until cancel, then restart", function (done) {
    let testFlow = setupFlow("allByOrder", 1, 0);

    helper.load(debounceTest, testFlow, function () {
      let debounce = helper.getNode("node1");
      let pass = helper.getNode("node2");
      let delay = helper.getNode("node3");

      let passMsgCounter = 0;
      let delayMsgCounter = 0;

      let passSpy = sinon.spy();
      let delaySpy = sinon.spy();

      let cancelIndex = 5; // corresponds to msg.payload == 6
      let shouldDiscardCancel = [2, 3, 4, 5, 6, 7, 8, 9];
      let expectedAllByOrderAfterCancel = [1, 50, 7, 8, 9, 10];

      const cancelMsg = {
        payload: 50,
        cancel: "cancel",
      };

      pass.on("input", function (msg) {
        passSpy();
        try {
          msg.payload.should.equal(
            expectedAllByOrderAfterCancel[passMsgCounter++]
          );
        } catch (err) {
          done(err);
        }
      });

      delay.on("input", function (msg) {
        delaySpy();
        try {
          msg.payload.should.equal(shouldDiscardCancel[delayMsgCounter++]);
        } catch (err) {
          done(err);
        }
      });

      for (let i = 0; i < expectedAllByOrder.length - 1; i++) {
        debounce.receive({ payload: expectedAllByOrder[i] });
        if (i === cancelIndex) {
          debounce.receive(cancelMsg);
        }
      }
      clock.tick(9090);
      debounce.receive({
        payload: expectedAllByOrder[expectedAllByOrder.length - 1],
      });
      clock.tick(10);

      try {
        passSpy.callCount.should.be.equal(expectedAllByOrderAfterCancel.length);
        delaySpy.callCount.should.be.equal(shouldDiscardCancel.length);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
