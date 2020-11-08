var helper = require("node-red-node-test-helper");
var sinon = require("sinon");
var actionDelayTest = require("../action-delay/action-delay.js");
let clock;

helper.init(require.resolve("node-red"));

function setupFlow(nodeStrategy, nodeDelay, nodeDelayInterval) {
  let testFlow = [
    {
      id: "node1",
      type: "action-delay",
      name: "action-delay",
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

describe("action-delay-test Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
    clock = sinon.useFakeTimers();
  });

  afterEach(function (done) {
    clock.restore();
    helper.unload();
    helper.stopServer(done);
  });

  let shouldDiscard = [2, 3, 4, 5, 6, 7, 8, 9];
  let expectedAllByOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("should be loaded", function (done) {
    let testFlow = [
      { id: "node1", type: "action-delay", name: "action-delay" },
    ];

    // Load flow and start it
    helper.load(actionDelayTest, testFlow, function () {
      let myTestNode = helper.getNode("node1");

      try {
        myTestNode.should.have.property("name", "action-delay");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("It should discard all delayed messages", function (done) {
    let testFlow = setupFlow("discard", 1, 0);
    let expectedDiscard = [1, 10];

    helper.load(actionDelayTest, testFlow, function () {
      let actionDelay = helper.getNode("node1");
      let pass = helper.getNode("node2");
      let delay = helper.getNode("node3");

      let passMsgCounter = 0;
      let delayMsgCounter = 0;

      let passSpy = sinon.spy();
      let delaySpy = sinon.spy();

      pass.on("input", function (msg) {
        passSpy();
        try {
          msg.payload.should.equal(expectedDiscard[passMsgCounter++]);
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
        actionDelay.receive({ payload: expectedAllByOrder[i] });
      }
      clock.tick(1001);
      actionDelay.receive({
        payload: expectedAllByOrder[expectedAllByOrder.length - 1],
      });
      clock.tick(10);

      try {
        passSpy.callCount.should.be.equal(expectedDiscard.length);
        delaySpy.callCount.should.be.equal(shouldDiscard.length);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("It should send the first delayed message", function (done) {
    let testFlow = setupFlow("first", 1, 0);
    let expectedFirst = [1, 2, 10];

    helper.load(actionDelayTest, testFlow, function () {
      let actionDelay = helper.getNode("node1");
      let pass = helper.getNode("node2");
      let delay = helper.getNode("node3");

      let passMsgCounter = 0;
      let delayMsgCounter = 0;

      let passSpy = sinon.spy();
      let delaySpy = sinon.spy();

      pass.on("input", function (msg) {
        passSpy();
        try {
          msg.payload.should.equal(expectedFirst[passMsgCounter++]);
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
        actionDelay.receive({ payload: expectedAllByOrder[i] });
      }
      clock.tick(1001);
      actionDelay.receive({
        payload: expectedAllByOrder[expectedAllByOrder.length - 1],
      });
      clock.tick(10);

      try {
        passSpy.callCount.should.be.equal(expectedFirst.length);
        delaySpy.callCount.should.be.equal(shouldDiscard.length);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("It should send the last delayed message", function (done) {
    let testFlow = setupFlow("last", 1, 0);
    let expectedLast = [1, 9, 10];

    helper.load(actionDelayTest, testFlow, function () {
      let actionDelay = helper.getNode("node1");
      let pass = helper.getNode("node2");
      let delay = helper.getNode("node3");

      let passMsgCounter = 0;
      let delayMsgCounter = 0;

      let passSpy = sinon.spy();
      let delaySpy = sinon.spy();

      pass.on("input", function (msg) {
        passSpy();
        try {
          msg.payload.should.equal(expectedLast[passMsgCounter++]);
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
        actionDelay.receive({ payload: expectedAllByOrder[i] });
      }
      clock.tick(1001);
      actionDelay.receive({
        payload: expectedAllByOrder[expectedAllByOrder.length - 1],
      });
      clock.tick(10);

      try {
        passSpy.callCount.should.be.equal(expectedLast.length);
        delaySpy.callCount.should.be.equal(shouldDiscard.length);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("It should send all the delayed messages", function (done) {
    let testFlow = setupFlow("allByOrder", 1, 0);

    helper.load(actionDelayTest, testFlow, function () {
      let actionDelay = helper.getNode("node1");
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
        actionDelay.receive({ payload: expectedAllByOrder[i] });
      }
      clock.tick(9090);
      actionDelay.receive({
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
});
