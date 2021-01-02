let helper = require("node-red-node-test-helper");
let redundancyNode = require("../redundancy/redundancy.js");

helper.init(require.resolve("node-red"));

describe("redundancy node", function () {
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
        type: "redundancy-manager",
        name: "redundancy",
      },
    ];

    helper.load(redundancyNode, flow, function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "redundancy");
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
