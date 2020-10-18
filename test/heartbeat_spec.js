var helper = require("node-red-node-test-helper");
var heartbeatNode = require("../heartbeat/heartbeat.js");

helper.init(require.resolve("node-red"));

describe("heartbeat node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function (done) {
    let testFlow = [{ id: "node1", type: "heartbeat", name: "heartbeat" }];

    // Load flow and start it
    helper.load(heartbeatNode, testFlow, function () {
      let myTestNode = helper.getNode("node1");

      try {
        myTestNode.should.have.property("name", "heartbeat");
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
