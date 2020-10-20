var helper = require("node-red-node-test-helper");
var sinon = require("sinon");
var actionDelayTest = require("../action-delay/action-delay.js");
let clock;

helper.init(require.resolve("node-red"));

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

  let expectedDiscard = [1, 10];
  let expectedAllByOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // let expectedFirst = [1, 2, 10];
  // let expectedLast = [1, 9, 10];

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

  it("shouldn't get any delay message", function (done) {
    let testFlow = [
      {
        id: "node1",
        type: "action-delay",
        name: "action-delay",
        delay: 1,
        strategy: "discard",
        wires: [["node2"], ["node3"]],
      },
      { id: "node2", type: "helper" },
      { id: "node3", type: "helper" },
    ];

    helper.load(actionDelayTest, testFlow, function () {
      let actionDelay = helper.getNode("node1");
      let pass = helper.getNode("node2");
      let delay = helper.getNode("node3");

      // Simulate passage of time since deployment
      clock.tick(1000);

      let passSpy = sinon.spy();
      let delaySpy = sinon.spy();
      pass.on("input", passSpy);
      delay.on("input", delaySpy);

      expectedDiscard.forEach((element) => {
        actionDelay.receive({ payload: element });
        clock.tick(2000);
      });

      try {
        passSpy.should.be.calledTwice();
        delaySpy.should.not.be.called();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should get all delayed messages", function (done) {
    let testFlow = [
      {
        id: "node1",
        type: "action-delay",
        name: "action-delay",
        delay: 1,
        strategy: "allByOrder",
        wires: [["node2"], ["node3"]],
      },
      { id: "node2", type: "helper" },
      { id: "node3", type: "helper" },
    ];

    helper.load(actionDelayTest, testFlow, function () {
      let actionDelay = helper.getNode("node1");
      let pass = helper.getNode("node2");
      let delay = helper.getNode("node3");

      // Simulate passage of time since deployment
      clock.tick(1000);

      let receivedMsgs = 0;

      let passSpy = sinon.spy();
      let delaySpy = sinon.spy();
      pass.on("input", passSpy);
      delay.on("input", delaySpy);

      pass.on("input", function (msg) {
        try {
          // console.log(msg.payload);
          clock.tick(1001);
          msg.payload.should.equal(expectedAllByOrder[receivedMsgs++]);
          if (receivedMsgs == expectedAllByOrder.length) done();
        } catch (err) {
          done(err);
        }
      });

      expectedAllByOrder.forEach((element) => {
        actionDelay.receive({ payload: element });
        clock.tick(10);
      });
    });
  });

  // it("should get the first delayed message", function (done) {
  //   let testFlow = [
  //     {
  //       id: "node1",
  //       type: "action-delay",
  //       name: "action-delay",
  //       delay: 1,
  //       strategy: "first",
  //       wires: [["node2"], ["node3"]],
  //     },
  //     { id: "node2", type: "helper" },
  //     { id: "node3", type: "helper" },
  //   ];

  //   helper.load(actionDelayTest, testFlow, function () {
  //     let actionDelay = helper.getNode("node1");
  //     let pass = helper.getNode("node2");
  //     let delay = helper.getNode("node3");

  //     // Simulate passage of time since deployment
  //     clock.tick(1000);

  //     let receivedMsgs = 0;

  //     let passSpy = sinon.spy();
  //     let delaySpy = sinon.spy();
  //     pass.on("input", passSpy);
  //     delay.on("input", delaySpy);

  //     pass.on("input", function (msg) {
  //       try {
  //         //console.log(msg.payload);
  //         clock.tick(1001);
  //         msg.payload.should.equal(expectedFirst[receivedMsgs++]);
  //         if (receivedMsgs == expectedFirst.length) done();
  //       } catch (err) {
  //         done(err);
  //       }
  //     });

  //     expectedAllByOrder.forEach((element) => {
  //       actionDelay.receive({ payload: element });
  //       clock.tick(10);
  //     });

  //   });
  // });

  // it("should get the last delayed message", function (done) {
  //   let testFlow = [
  //     {
  //       id: "node1",
  //       type: "action-delay",
  //       name: "action-delay",
  //       delay: 1,
  //       strategy: "last",
  //       wires: [["node2"], ["node3"]],
  //     },
  //     { id: "node2", type: "helper" },
  //     { id: "node3", type: "helper" },
  //   ];

  //   helper.load(actionDelayTest, testFlow, function () {
  //     let actionDelay = helper.getNode("node1");
  //     let pass = helper.getNode("node2");
  //     let delay = helper.getNode("node3");

  //     // Simulate passage of time since deployment
  //     clock.tick(1000);

  //     let receivedMsgs = 0;

  //     let passSpy = sinon.spy();
  //     let delaySpy = sinon.spy();
  //     pass.on("input", passSpy);
  //     delay.on("input", delaySpy);

  //     pass.on("input", function (msg) {
  //       try {
  //         //console.log(msg.payload);
  //         clock.tick(1001);
  //         msg.payload.should.equal(expectedLast[receivedMsgs++]);
  //         if (receivedMsgs == expectedLast.length) done();
  //       } catch (err) {
  //         done(err);
  //       }
  //     });

  //     expectedAllByOrder.forEach((element) => {
  //       actionDelay.receive({ payload: element });
  //       clock.tick(10);
  //     });

  //   });
  // });
});
