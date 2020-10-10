var should = require("should");
var helper = require("node-red-node-test-helper");
var testNode = require("../test-node/test-node.js");

helper.init(require.resolve("node-red"));

describe("test-node Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    // Create flow with one "test-node" node with property name = test-node
    var testFlow = [{ id: "node1", type: "test-node", name: "test-node" }];

    // Load flow and start it
    helper.load(testNode, testFlow, function () {
      // Get "testNode" node instance from "testFlow" specified above
      var myTestNode = helper.getNode("node1");

      /*
        Assert if "testNode" has property "name" with value "test-node"
        Try/Catch asserts for cleaner test fail messages
      */
      try {
        myTestNode.should.have.property("name", "test-node");
        done();
      } catch (error) {
        done(error);
      }
    });
  });


  it("should return integer value", function (done) {
    var flow = [
      /*
        Create flow with two nodes
        n1 is a test-node with its integerValue property set to 50
        n1 also has its output connected to n2
        n2 is a special helper node used to check messages, in this case n1 output message
      */
      { id: "n1", type: "test-node", integerValue: 50, wires: [["n2"]] },
      { id: "n2", type: "helper" },
    ];

    helper.load(testNode, flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");

      // When n2 (helper) gets a message (from test-node)
      n2.on("input", function (msg) {
        try {
          // Assert if msg has property "payload" with value 50
          msg.should.have.property("payload", 50);
          done();
        } catch (error) {
          done(error);
        }
      });

      // Send a message into n1 (test-node) to trigger its logic
      n1.receive({ payload: "run" });
    });
  });
});
