let helper = require("node-red-node-test-helper");
let confidenceNode = require("../confidence/confidence.js");

helper.init(require.resolve("node-red"));

describe("confidence node", function () {
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
        type: "confidence",
        name: "confidence",
      },
    ];

    helper.load(confidenceNode, flow, function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "confidence");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  function uncertaintyFlowBuilder(uncertainty) {
    let testFlow = [
      {
        id: "n1",
        type: "confidence",
        name: "confidence",
        measurementUncertainty: uncertainty,
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

  it("should return 99% confidence", function (done) {
    const payload = 100;
    const uncertainty = 1;
    const desiredConfidence = 0.99;
    const flow = uncertaintyFlowBuilder(uncertainty);

    helper.load(confidenceNode, flow, function () {
      let successNode = helper.getNode("n2");

      successNode.on("input", (msg) => {
        try {
          msg.should.have.property("payload", payload);
          msg.should.have.property("confidence", desiredConfidence);
          done();
        } catch (error) {
          done(error);
        }
      });

      let testNode = helper.getNode("n1");
      testNode.receive({ payload: payload });
    });
  });

  it("should return 0% confidence when uncertainty is equal to payload", function (done) {
    const payload = 1;
    const uncertainty = 1;
    const desiredConfidence = 0;
    const flow = uncertaintyFlowBuilder(uncertainty);

    helper.load(confidenceNode, flow, function () {
      let successNode = helper.getNode("n2");

      successNode.on("input", (msg) => {
        try {
          msg.should.have.property("payload", payload);
          msg.should.have.property("confidence", desiredConfidence);
          done();
        } catch (error) {
          done(error);
        }
      });

      let testNode = helper.getNode("n1");
      testNode.receive({ payload: payload });
    });
  });

  it("should return 0% confidence when uncertainty is higher than payload", function (done) {
    const payload = 1;
    const uncertainty = 10;
    const desiredConfidence = 0;
    const flow = uncertaintyFlowBuilder(uncertainty);

    helper.load(confidenceNode, flow, function () {
      let successNode = helper.getNode("n2");

      successNode.on("input", (msg) => {
        try {
          msg.should.have.property("payload", payload);
          msg.should.have.property("confidence", desiredConfidence);
          done();
        } catch (error) {
          done(error);
        }
      });

      let testNode = helper.getNode("n1");
      testNode.receive({ payload: payload });
    });
  });

  it("should trigger an error flow if payload is not a number", function (done) {
    const payload = "bad value";
    const uncertainty = 1;
    const flow = uncertaintyFlowBuilder(uncertainty);

    helper.load(confidenceNode, flow, function () {
      let errorNode = helper.getNode("n3");

      errorNode.on("input", (msg) => {
        try {
          msg.should.have.property("payload", payload);
          msg.should.have.property("fault");
          done();
        } catch (error) {
          done(error);
        }
      });

      let testNode = helper.getNode("n1");
      testNode.receive({ payload: payload });
    });
  });
});
