let sinon = require("sinon");
let helper = require("node-red-node-test-helper");
let timingCheckNode = require("../timing-check/timing.js");

let clock;

helper.init(require.resolve("node-red"));

describe("timing Node", function () {
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
    const testFlow = [
      {
        id: "testNode",
        type: "timing",
        name: "timing",
      },
    ];

    helper.load(timingCheckNode, testFlow, function () {
      const testNode = helper.getNode("testNode");
      try {
        testNode.should.have.property("name", "timing");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  const expectedResults = {
    normal: 1,
    fast: 2,
    slow: 3,
  };

  it("should be able to detect if the flow is normal", function (done) {
    const period = 0.5;
    timingTest(expectedResults.normal, period, done);
  });

  it("should be able to detect if the flow is normal in the verge of the minimum period value", function (done) {
    const period = 0.46;
    timingTest(expectedResults.normal, period, done);
  });

  it("should be able to detect if the flow is normal in the verge of the maximum period value", function (done) {
    const period = 0.54;
    timingTest(expectedResults.normal, period, done);
  });

  it("should be able to detect if the flow is too fast", function (done) {
    const period = 0.4;
    timingTest(expectedResults.fast, period, done);
  });

  it("should be able to detect if the flow is too fast when slightly less than the minimum period value", function (done) {
    const period = 0.43;
    timingTest(expectedResults.fast, period, done);
  });

  it("should be able to detect if the flow is too slow", function (done) {
    const period = 0.6;
    timingTest(expectedResults.slow, period, done);
  });

  it("should be able to detect if the flow is too slow when slightly greater than the maximum period value", function (done) {
    const period = 0.57;
    timingTest(expectedResults.slow, period, done);
  });

  function timingTest(expectedResult, messagePeriod, done) {
    const testFlow = [
      {
        id: "timingNode",
        type: "timing",
        name: "timing",
        period: "0.5",
        margin: "0.1",
        slidingWindowLength: "2",
        wires: [["normalOutput"], ["fastOutput"], ["slowOutput"]],
      },
      {
        id: "normalOutput",
        type: "helper",
        name: "normal-output-from-timing-node",
      },
      {
        id: "fastOutput",
        type: "helper",
        name: "too-fast-output-from-timing-node",
      },
      {
        id: "slowOutput",
        type: "helper",
        name: "too-slow-output-from-timing-node",
      },
    ];

    helper.load(timingCheckNode, testFlow, () => {
      const timingNode = helper.getNode("timingNode");
      const normalOutput = helper.getNode("normalOutput");
      const fastOutput = helper.getNode("fastOutput");
      const slowOutput = helper.getNode("slowOutput");

      const normalSpy = sinon.spy();
      const fastSpy = sinon.spy();
      const slowSpy = sinon.spy();

      normalOutput.on("input", normalSpy);
      fastOutput.on("input", fastSpy);
      slowOutput.on("input", slowSpy);

      try {
        timingNode.receive({ payload: "Testing" });
        clock.tick(10);
        normalSpy.should.be.calledOnce();
        
        clock.tick(messagePeriod * 1000);
        timingNode.receive({ payload: "Testing" });
        clock.tick(10);
        
        validateOutputs(expectedResult, normalSpy, fastSpy, slowSpy);
        
        done();
      } catch (error) {
        done(error);
      }
    });
  }

  function validateOutputs(expectedResult, normalSpy, fastSpy, slowSpy) {
    if (expectedResult == 1) {
      normalSpy.should.be.calledTwice();
      fastSpy.should.not.be.called();
      slowSpy.should.not.be.called();
    } else if (expectedResult == 2) {
      normalSpy.should.be.calledOnce();
      fastSpy.should.be.calledOnce();
      slowSpy.should.not.be.called();
    } else {
      normalSpy.should.be.calledOnce();
      fastSpy.should.not.be.called();
      slowSpy.should.be.calledOnce();
    }
  }
});
