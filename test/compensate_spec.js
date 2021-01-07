let helper = require("node-red-node-test-helper");
let compensateNode = require("../compensate/compensate.js");

helper.init(require.resolve("node-red"));

describe("compensate node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    let flow = [
      {
        id: "n1",
        type: "sensor-compensate",
        name: "compensate",
        msghistory: 5,
        timeout: 1,
        strategy: "mean",
        confidenceFormula: "",
      },
    ];

    helper.load(compensateNode, flow, function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "compensate");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  function testNode(strategy, expectedResult, done) {
    let messageSequence = [10.1, 10.3, 10.5, 10.5, 10.4, 10.6];

    let flow = [
      {
        id: "n1",
        type: "sensor-compensate",
        name: "compensate",
        msghistory: 6,
        timeout: 0.01,
        strategy: strategy,
        confidenceFormula: "",
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];

    helper.load(compensateNode, flow, function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let messageCounter = 0;

      n2.on("input", function (msg, _send, _done) {
        messageCounter++;
        if (messageCounter == 7) {
          try {
            msg.payload.should.equal(expectedResult);
            done();
          } catch (error) {
            done(error);
          }
        }
      });

      messageSequence.forEach((element) => {
        n1.receive({ payload: element });
      });
    });
  }

  it("should compensate missing value with the maximum previous value", function (done) {
    testNode("max", 10.6, done);
  });

  it("should compensate missing value with minimum previous value", function (done) {
    testNode("min", 10.1, done);
  });

  it("should compensate missing value with the mode of the previous values", function (done) {
    testNode("mode", 10.5, done);
  });

  it("should compensate missing value with the last value received", function (done) {
    testNode("last", 10.6, done);
  });

  it("should compensate missing value with the mean of the previous values", function (done) {
    testNode("mean", 10.4, done);
  });

  it("should send confidence value according to expression", function (done) {
    let flow = [
      {
        id: "n1",
        type: "sensor-compensate",
        name: "compensate",
        msghistory: 1,
        timeout: 0.05,
        strategy: "max",
        confidenceFormula:
          "(1 / _compensatedCounter) >= 1 ? 1 : (1 / _compensatedCounter)",
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];

    helper.load(compensateNode, flow, function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let messageCounter = 0;

      n2.on("input", function (msg, _send, _done) {
        if (messageCounter >= 1) {
          try {
            msg.confidenceValue.should.equal(1 / messageCounter);
            messageCounter++;
            if (messageCounter == 6) done();
          } catch (error) {
            done(error);
          }
        } else {
          messageCounter++;
        }
      });

      n1.receive({ payload: 10.1 });
    });
  });
});
