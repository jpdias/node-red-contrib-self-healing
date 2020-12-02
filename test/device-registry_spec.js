let helper = require("node-red-node-test-helper");
let deviceRegistryNode = require("../device-registry/device-registry.js");

helper.init(require.resolve("node-red"));

describe("device-registry node", function () {
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
        type: "device-registry",
        name: "Device Registry",
      },
    ];

    helper.load(deviceRegistryNode, flow, function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "Device Registry");
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
