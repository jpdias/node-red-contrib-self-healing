let helper = require("node-red-node-test-helper");
var sinon = require("sinon");
let readingswatcher = require("../readings-watcher/readings-watcher.js");

helper.init(require.resolve("node-red"));

let clock;
let testflow;

describe("readings-watcher node", function () {
  function run_flow(messageSequence, okCount, errorCount, done) {
    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      let ok = helper.getNode("ok");
      let error = helper.getNode("error");

      let okSpy = sinon.spy();
      let errorSpy = sinon.spy();

      let receivedMsgs = 0;

      ok.on("input", function (msg) {
        try {
          okSpy();
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
        } catch (err) {
          done(err);
        }
      });

      error.on("input", function (msg) {
        try {
          errorSpy();
          msg.payload.should.equal(messageSequence[receivedMsgs++]);
        } catch (err) {
          done(err);
        }
      });

      messageSequence.forEach((element) => {
        watcher.receive({ payload: element });
      });

      clock.tick(100);

      try {
        okSpy.callCount.should.be.equal(okCount);
        errorSpy.callCount.should.be.equal(errorCount);
        done();
      } catch (error) {
        done(error);
      }
    });
  }

  beforeEach(function (done) {
    testflow = [
      {
        id: "watcher",
        type: "readings-watcher",
        name: "readings-watcher",
        wires: [["ok"], ["error"]],
      },
      { id: "ok", type: "helper" },
      { id: "error", type: "helper" },
    ];
    helper.startServer(done);
    clock = sinon.useFakeTimers();
  });

  afterEach(function (done) {
    clock.restore();
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");
      try {
        watcher.should.have.property("name", "readings-watcher");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should report if input is not a number", function (done) {
    helper.load(readingswatcher, testflow, function () {
      let watcher = helper.getNode("watcher");

      try {
        watcher.receive({ payload: "NaN" });
        clock.tick(100);
        watcher.warn.should.be.calledOnce();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should allow consecutive readings when using 'percentile minchange' and their values are sufficiently different", function (done) {
    let messageSequence = [1, 1.5];
    let minchange = 0.1;
    minchange.should.be.lessThan(
      Math.abs(messageSequence[1] - messageSequence[0]) / messageSequence[0]
    );
    testflow[0].strategyMask = 1;
    testflow[0].minchange = minchange;
    testflow[0].valueType = "percentile";

    run_flow(messageSequence, messageSequence.length, 0, done);
  });

  it("should trigger an error when using 'percentile minchange' and consecutive readings are too similar", function (done) {
    let messageSequence = [1, 1.05];
    let minchange = 0.1;
    minchange.should.be.greaterThanOrEqual(
      Math.abs(messageSequence[0] - messageSequence[1]) / messageSequence[0]
    );
    testflow[0].strategyMask = 1;
    testflow[0].minchange = minchange;
    testflow[0].valueType = "percentile";

    run_flow(messageSequence, messageSequence.length - 1, 1, done);
  });

  it("should allow consecutive readings when using 'fixed minchange' and their values are sufficiently different", function (done) {
    let messageSequence = [10, 15];
    let minchange = 4;
    minchange.should.be.lessThan(
      Math.abs(messageSequence[1] - messageSequence[0])
    );
    testflow[0].strategyMask = 1;
    testflow[0].minchange = minchange;
    testflow[0].valueType = "fixed";

    run_flow(messageSequence, messageSequence.length, 0, done);
  });

  it("should trigger an error when using 'fixed minchange' and consecutive readings are too similar", function (done) {
    let messageSequence = [10, 11];
    let minchange = 2;
    minchange.should.be.greaterThanOrEqual(
      Math.abs(messageSequence[0] - messageSequence[1])
    );
    testflow[0].strategyMask = 1;
    testflow[0].minchange = minchange;
    testflow[0].valueType = "fixed";

    run_flow(messageSequence, messageSequence.length - 1, 1, done);
  });

  it("should allow consecutive readings when using 'percentile maxchange' and their values are sufficiently similar", function (done) {
    let messageSequence = [0.9, 1.1];
    let maxchange = 0.5;
    maxchange.should.be.greaterThan(
      Math.abs(messageSequence[0] - messageSequence[1]) / messageSequence[0]
    );
    testflow[0].strategyMask = 2;
    testflow[0].maxchange = maxchange;
    testflow[0].valueType = "percentile";

    run_flow(messageSequence, messageSequence.length, 0, done);
  });

  it("should trigger an error when using 'percentile maxchange' and consecutive readings are too different", function (done) {
    let messageSequence = [0.3, 0.5];
    let maxchange = 0.65;
    maxchange.should.be.lessThanOrEqual(
      Math.abs(messageSequence[0] - messageSequence[1]) / messageSequence[0]
    );
    testflow[0].strategyMask = 2;
    testflow[0].maxchange = maxchange;
    testflow[0].valueType = "percentile";

    run_flow(messageSequence, messageSequence.length - 1, 1, done);
  });

  it("should allow consecutive readings when using 'fixed maxchange' and their values are sufficiently similar", function (done) {
    let messageSequence = [9, 11];
    let maxchange = 5;
    maxchange.should.be.greaterThan(
      Math.abs(messageSequence[0] - messageSequence[1])
    );
    testflow[0].strategyMask = 2;
    testflow[0].maxchange = maxchange;
    testflow[0].valueType = "fixed";

    run_flow(messageSequence, messageSequence.length, 0, done);
  });

  it("should trigger an error when using 'fixed maxchange' and consecutive readings are too different", function (done) {
    let messageSequence = [3, 5];
    let maxchange = 1;
    maxchange.should.be.lessThanOrEqual(
      Math.abs(messageSequence[0] - messageSequence[1])
    );
    testflow[0].strategyMask = 2;
    testflow[0].maxchange = maxchange;
    testflow[0].valueType = "fixed";

    run_flow(messageSequence, messageSequence.length - 1, 1, done);
  });

  it("should allow consecutive readings when using 'stucklimit' and the last 'X' values are not all exactly equal", function (done) {
    let messageSequence = [1, 1, 1, 2, 1, 1];
    let stucklimit = 4;
    testflow[0].strategyMask = 4;
    testflow[0].stucklimit = stucklimit;

    run_flow(messageSequence, messageSequence.length, 0, done);
  });

  it("should trigger an error when using 'stucklimit' and the last 'X' consecutive readings are equal", function (done) {
    let messageSequence = [1, 1, 1, 1, 1];
    let stucklimit = messageSequence.length;
    testflow[0].strategyMask = 4;
    testflow[0].stucklimit = stucklimit;
    testflow[0].valueType = "percentile";

    run_flow(messageSequence, messageSequence.length - 1, 1, done);
  });
});
