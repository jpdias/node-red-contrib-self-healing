let helper = require("node-red-node-test-helper");
let thresholdCheckNode = require("../threshold-check/threshold-check.js");

helper.init(require.resolve("node-red"));

describe("threshold-check node", function () {
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
        id: "node1",
        type: "threshold-check",
        name: "threshold-check",
      },
    ];

    helper.load(thresholdCheckNode, testFlow, function () {
      let testNode = helper.getNode("node1");
      try {
        testNode.should.have.property("name", "threshold-check");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("should fail on equal operation that is different", function (done) {
    let equalRule = {
      property: "payload",
      propertyType: "msg",
      type: "eq",
      value: "10",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
      failMsg: "",
    };

    let testFlow = [
      {
        id: "n1",
        type: "threshold-check",
        name: "threshold-check",
        rules: [equalRule],
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

    helper.load(thresholdCheckNode, testFlow, function () {
      let errorNode = helper.getNode("n3");
      errorNode.on("input", (msg) => {
        console.log(msg);
        msg.should.have.property("fault");
        done();
      });

      let testNode = helper.getNode("n1");
      testNode.receive({ payload: "11" });
    });
  });
});
