let should = require("should");
let helper = require("node-red-node-test-helper");
let checkpointNode = require("../checkpoint/checkpoint.js");

helper.init(require.resolve("node-red"));

describe("checkpoint node", function () {
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
        type: "checkpoint",
        name: "checkpoint",
      },
    ];

    helper.load(checkpointNode, flow, function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "checkpoint");
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
