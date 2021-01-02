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

  it("sould become master", function (done) {
    let flow = [
      {
        id: "n1",
        type: "redundancy-manager",
        name: "redundancy",
        wires: [["n2"], [], []],
      },
      {
        id: "n2",
        type: "helper",
        name: "is-master",
      },
    ];

    helper.load(redundancyNode, flow, function () {
      let n2 = helper.getNode("n2");
      let receivedMsgYet = false;

      n2.on("input", (msg) => {
        try {
          if (!receivedMsgYet) {
            receivedMsgYet = true;
            msg.should.have.property("payload");
            msg.payload.should.have.property("master", true);
            done();
          }
        } catch (error) {
          done(error);
        }
      });
    });
  });
});
