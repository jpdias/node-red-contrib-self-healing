const helper = require("node-red-node-test-helper");
const replicationVoterNode = require("../replication-voter/replication-voter.js");
const sinon = require("sinon");

helper.init(require.resolve("node-red"));

describe("replication-voter node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  let clock;

  function setupFlow(
    valueType,
    majorityValue,
    countInputs,
    margin,
    result,
    timeout
  ) {
    let testFlow = [
      {
        id: "n1",
        type: "replication-voter",
        name: "replication-voter",
        valueType: valueType,
        majority: majorityValue,
        countInputs: countInputs,
        margin: margin,
        result: result,
        timeout: timeout,
        wires: [["n2"], ["n3"]],
      },
      {
        id: "n2",
        type: "helper",
        name: "success-output-from-test-node",
      },
      {
        id: "n3",
        type: "helper",
        name: "error-output-from-test-node",
      },
    ];
    return testFlow;
  }

  it("should be loaded", function (done) {
    let testFlow = setupFlow("number", 2, 0, 0, "mean", 0);

    helper.load(replicationVoterNode, testFlow, function () {
      let testNode = helper.getNode("n1");
      try {
        testNode.should.have.property("name", "replication-voter");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  function testMajorityInput(inputArray, testFlow, expectedResult, done) {
    helper.load(replicationVoterNode, testFlow, function () {
      let replicationNode = helper.getNode("n1");
      let successNode = helper.getNode("n2");
      let errorNode = helper.getNode("n3");

      const ok = sinon.spy();
      const fail = sinon.spy();

      successNode.on("input", ok);
      errorNode.on("input", fail);

      successNode.on("input", function (msg) {
        ok();
        try {
          msg.payload.should.equal(expectedResult);
          done();
        } catch (err) {
          done(err);
        }
      });

      errorNode.on("input", function (msg) {
        fail();
        done(msg.payload);
      });

      for (let i = 0; i < inputArray.length; i++) {
        replicationNode.receive({ payload: inputArray[i] });
      }

      sinon.assert.calledOnce(ok);
      sinon.assert.notCalled(fail);
    });
  }

  function testMajorityArrayInput(inputArray, testFlow, expectedResult, done) {
    helper.load(replicationVoterNode, testFlow, function () {
      let replicationNode = helper.getNode("n1");
      let successNode = helper.getNode("n2");
      let errorNode = helper.getNode("n3");

      const ok = sinon.spy();
      const fail = sinon.spy();

      successNode.on("input", ok);
      errorNode.on("input", fail);

      successNode.on("input", function (msg) {
        ok();
        try {
          msg.payload.should.equal(expectedResult);
          done();
        } catch (err) {
          done(err);
        }
      });

      errorNode.on("input", function (msg) {
        fail();
        done(msg.payload);
      });

      replicationNode.receive({ payload: inputArray });

      sinon.assert.calledOnce(ok);
      sinon.assert.notCalled(fail);
    });
  }

  function testNoMajorityArrayInput(
    inputArray,
    testFlow,
    expectedResult,
    done
  ) {
    helper.load(replicationVoterNode, testFlow, function () {
      let replicationNode = helper.getNode("n1");
      let successNode = helper.getNode("n2");
      let errorNode = helper.getNode("n3");

      const ok = sinon.spy();
      const fail = sinon.spy();

      successNode.on("input", ok);
      errorNode.on("input", fail);

      successNode.on("input", function (msg) {
        ok();
        done(msg);
      });

      errorNode.on("input", function (msg) {
        //console.log(msg)
        fail();
        try {
          JSON.stringify(msg.payload).should.equal(
            JSON.stringify(expectedResult)
          );
          done();
        } catch (err) {
          done(err);
        }
      });

      replicationNode.receive({ payload: inputArray });

      sinon.assert.calledOnce(fail);
      sinon.assert.notCalled(ok);
    });
  }

  function testNoMajorityInput(inputArray, testFlow, expectedResult, done) {
    helper.load(replicationVoterNode, testFlow, function () {
      let replicationNode = helper.getNode("n1");
      let successNode = helper.getNode("n2");
      let errorNode = helper.getNode("n3");

      const ok = sinon.spy();
      const fail = sinon.spy();

      successNode.on("input", ok);
      errorNode.on("input", fail);

      successNode.on("input", function (msg) {
        ok();
        done(msg);
      });

      errorNode.on("input", function (msg) {
        fail();
        try {
          JSON.stringify(msg.payload).should.equal(
            JSON.stringify(expectedResult)
          );
          done();
        } catch (err) {
          done(err);
        }
      });

      for (let i = 0; i < inputArray.length; i++) {
        replicationNode.receive({ payload: inputArray[i] });
      }
      sinon.assert.notCalled(ok);
      sinon.assert.calledOnce(fail);
    });
  }

  function testTimeoutMajorityInput(
    inputArray,
    testFlow,
    expectedResult,
    done
  ) {
    helper.load(replicationVoterNode, testFlow, function () {
      clock = sinon.useFakeTimers();
      let replicationNode = helper.getNode("n1");
      let successNode = helper.getNode("n2");
      let errorNode = helper.getNode("n3");

      const ok = sinon.spy();
      const fail = sinon.spy();

      successNode.on("input", ok);
      errorNode.on("input", fail);

      successNode.on("input", function (msg) {
        ok();
        try {
          msg.payload.should.equal(expectedResult);
          msg.timeout.should.equal(true);
          clock.restore();
          done();
        } catch (err) {
          clock.restore();
          done(err);
        }
      });

      errorNode.on("input", function (msg) {
        fail();
        clock.restore();
        done(msg.payload);
      });

      for (let i = 0; i < inputArray.length; i++) {
        replicationNode.receive({ payload: inputArray[i] });
        clock.tick(450);
      }
      clock.tick(100);
      sinon.assert.notCalled(ok);
      sinon.assert.calledOnce(fail);
    });
  }

  it("should pass when there is a majority number (int) in the inputs", function (done) {
    let payload = [1, 3, 3, 10];
    let testFlow = setupFlow("number", 2, payload.length, 0, "mean", 0);
    testMajorityInput(payload, testFlow, 3, done);
  });

  it("should pass when there is a majority number (int) in the array input", function (done) {
    let payload = [1, 3, 3, 10];
    let testFlow = setupFlow("number", 2, payload.length, 0, "mean", 0);
    testMajorityArrayInput(payload, testFlow, 3, done);
  });

  it("should pass when there is a majority number (int) in the array input", function (done) {
    let payload = [21, 31, 1000];
    let testFlow = setupFlow("number", 2, payload.length, 50, "mean", 0);
    testMajorityArrayInput(payload, testFlow, 26, done);
  });

  it("should fail when there are undefineds in the inputs", function (done) {
    let payload = [undefined, 31, undefined];
    let testFlow = setupFlow("number", 2, payload.length, 50, "mean", 0);
    testNoMajorityArrayInput(payload, testFlow, [31], done);
  });

  it("should pass when there is a majority number (float/mean) in the inputs", function (done) {
    let payload = [1, 1.1, 0.9, 3.5, 10.0];
    let testFlow = setupFlow("number", 3, payload.length, 10, "mean", 0);
    testMajorityInput(payload, testFlow, 1, done);
  });

  it("should pass when there is a majority number (float/max) in the inputs", function (done) {
    let payload = [1, 1.1, 0.9, 3.5, 10.0];
    let testFlow = setupFlow("number", 3, payload.length, 10, "highest", 0);
    testMajorityInput(payload, testFlow, 1.1, done);
  });

  it("should pass when there is a majority number (float/min) in the inputs", function (done) {
    let payload = [1, 1.1, 0.9, 3.5, 10.0];
    let testFlow = setupFlow("number", 3, payload.length, 10, "lowest", 0);
    testMajorityInput(payload, testFlow, 0.9, done);
  });

  it("should pass when returns the bigger majority in the inputs", function (done) {
    let payload = [1, 1.1, 0.9, 3.5, 10.0, 9.9, 10.1, 9.9, 10.1];
    let testFlow = setupFlow("number", 3, payload.length, 10, "mean", 0);
    testMajorityInput(payload, testFlow, 10.0, done);
  });

  it("should pass when there is a majority string in the inputs", function (done) {
    let payload = ["hello", "world", "world", "test"];
    let testFlow = setupFlow("string", 2, payload.length, 0, "mean", 0);
    testMajorityInput(payload, testFlow, "world", done);
  });

  it("should pass when there is a majority boolean in the inputs", function (done) {
    let payload = [true, true, false, true, false];
    let testFlow = setupFlow("boolean", 3, payload.length, 0, "mean", 0);
    testMajorityInput(payload, testFlow, true, done);
  });

  it("should fail when there is no majority string in the inputs", function (done) {
    let payload = ["hello", "world1", "world2", "test"];
    let testFlow = setupFlow("string", 2, payload.length, 0, "mean", 0);
    testNoMajorityInput(payload, testFlow, payload, done);
  });

  it("should fail when there is no majority number in the inputs", function (done) {
    let payload = [1, 2, 3, 4, 5, 6, 7];
    let testFlow = setupFlow("number", 2, payload.length, 10, "mean", 0);
    testNoMajorityInput(payload, testFlow, payload, done);
  });

  it("should pass when there is majority number in the inputs with timeout", function (done) {
    let payload = [1, 1, 4, 5];
    let testFlow = setupFlow("number", 2, 5, 20, "mean", 1);
    testTimeoutMajorityInput(payload, testFlow, 1, done);
  });
});
