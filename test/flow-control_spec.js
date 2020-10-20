const helper = require("node-red-node-test-helper");
const flowControlNode = require("../flow-control/flow-control.js");

helper.init(require.resolve("node-red"));

describe("flow-control Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    // Create flow with one "test-node" node with property name = test-node
    var flowControl = [
      { id: "node1", type: "flow-control", name: "flow-control" },
    ];

    // Load flow and start it
    helper.load(flowControlNode, flowControl, function () {
      // Get "flowControlNode" node instance from "testFlow" specified above
      var myFlowControlNode = helper.getNode("node1");

      /*
        Assert if "flowControlNode" has property "name" with value "test-node"
        Try/Catch asserts for cleaner test fail messages
      */
      try {
        myFlowControlNode.should.have.property("name", "flow-control");
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
