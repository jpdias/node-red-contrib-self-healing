var should = require("should");
var sinon = require("sinon");
var helper = require("node-red-node-test-helper");
var timingCheckNode = require("../timing-check/timing.js");

helper.init(require.resolve("node-red"));

describe("timing Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    let testFlow = [
      {
        id: "testNode",
        type: "timing",
        name: "timing",
      },
    ];

    helper.load(timingCheckNode, testFlow, function () {
      let testNode = helper.getNode("testNode");
      try {
        testNode.should.have.property("name", "timing");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  let expectedResults = {
    normal: 1,
    fast: 2,
    slow: 3,
  };

  it("should be able to detect if the flow is normal", function (done) {
    let period = 0.5;
    timingTest(expectedResults.normal, period, done);
  });

  it("should be able to detect if the flow is normal in the verge of the minimum period value", function (done) {
    let period = 0.455;
    timingTest(expectedResults.normal, period, done);
  });

  it("should be able to detect if the flow is normal in the verge of the maximum period value", function (done) {
    let period = 0.545;
    timingTest(expectedResults.normal, period, done);
  });

  it("should be able to detect if the flow is too fast", function (done) {
    let period = 0.4;
    timingTest(expectedResults.fast, period, done);
  });

  it("should be able to detect if the flow is too fast when slightly less than the minimum period value", function (done) {
    let period = 0.44;
    timingTest(expectedResults.fast, period, done);
  });

  it("should be able to detect if the flow is too slow", function (done) {
    let period = 0.6;
    timingTest(expectedResults.slow, period, done);
  });

  it("should be able to detect if the flow is too slow when slightly greater than the maximum period value", function (done) {
    let period = 0.56;
    timingTest(expectedResults.slow, period, done);
  });

  function timingTest(expectedResult, messagePeriod, done) {
    let testFlow = [
      {
        id: "timingNode",
        type: "timing",
        name: "timing",
        period: "0.5",
        margin: "0.1",
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
      let timingNode = helper.getNode("timingNode");
      let normalOutput = helper.getNode("normalOutput");
      let fastOutput = helper.getNode("fastOutput");
      let slowOutput = helper.getNode("slowOutput");

      let normalSpy = sinon.spy();
      let fastSpy = sinon.spy();
      let slowSpy = sinon.spy();

      normalOutput.on("input", normalSpy);
      fastOutput.on("input", fastSpy);
      slowOutput.on("input", slowSpy);

      timingNode.receive({ payload: "Testing" });

      setTimeout(() => {
        normalSpy.should.be.calledOnce();
      }, 10);

      setTimeout(() => {
        timingNode.receive({ payload: "Testing" });

        setTimeout(() => {
          try {
            validateOutputs(expectedResult, normalSpy, fastSpy, slowSpy);
            done();
          } catch (error) {
            done(error);
          }
        }, 10);
      }, messagePeriod * 1000);
    });
  }

  function validateOutputs(expectedResult, normalSpy, fastSpy, slowSpy) {
    try {
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
    } catch (error) {
      throw error;
    }
  }
});
