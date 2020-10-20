let helper = require("node-red-node-test-helper");
let replicationVoterNode = require("../replication-voter/replication-voter.js");

helper.init(require.resolve("node-red"));

describe("replication-voter node", function () {
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
        type: "replication-voter",
        name: "replication-voter",
      },
    ];

    helper.load(replicationVoterNode, testFlow, function () {
      let testNode = helper.getNode("node1");
      try {
        testNode.should.have.property("name", "replication-voter");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  function basicTest(
    majorityValue,
    countInputs,
    sendPayload,
    type,
    majority,
    shouldFail,
    done
  ) {
    let testFlow = [
      {
        id: "n1",
        type: "replication-voter",
        name: "replication-voter",
        majority: majorityValue,
        countInputs: countInputs,
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

    helper.load(replicationVoterNode, testFlow, function () {
      let error = {
        exist: false,
        description: "",
      };

      let errorNode = helper.getNode("n3");
      errorNode.on("input", (msg) => {
        if (shouldFail != true) {
          error.exist = true;
          error.description = "Error node received input when it shouldn't";
        }
      });

      let successNode = helper.getNode("n2");
      successNode.on("input", (msg) => {
        if (shouldFail == true) {
          error.exist = true;
          error.description = "Success node received input when it shouldn't";
        } else {
          if (majority != msg.payload) {
            error.exist = true;
            error.description = "The majority isn't right";
          }
        }
      });

      let testNode = helper.getNode("n1");

      if (type == "number") {
        for (i = 0; i < sendPayload.length; i++) {
          testNode.receive({ payload: sendPayload[i] });
        }
      } else if (type == "array") {
        testNode.receive({ payload: sendPayload });
      }

      setTimeout(() => {
        if (error.exist) {
          done(error.description);
        } else {
          done();
        }
      }, 200);
    });
  }

  it("should pass when there is a majority in the inputs", function (done) {
    let sendPayload = [1, 2, 2, 3];

    basicTest(2, 4, sendPayload, "number", 2, false, done);
  });

  it("should fail when there is no majority in the inputs", function (done) {
    let sendPayload = [1, 2, 3];

    basicTest(2, 3, sendPayload, "number", null, true, done);
  });

  it("should pass when there is a majority in the array", function (done) {
    let sendPayload = [1, 2, 2, 3];

    basicTest(2, 4, sendPayload, "array", 2, false, done);
  });

  it("should fail when there is no majority in the inputs", function (done) {
    let sendPayload = [1, 2, 3];

    basicTest(2, 3, sendPayload, "array", null, true, done);
  });

  it("should pass when the biggest of two possible majorities is considered the majority", function (done) {
    let sendPayload = [1, 2, 2, 3, 3, 3];

    basicTest(2, 6, sendPayload, "number", 3, false, done);
  });
});
