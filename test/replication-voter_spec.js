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
    valueType,
    majorityValue,
    countInputs,
    margin,
    result,
    inputType,
    sendPayload,
    majority,
    shouldFail,
    done
  ) {
    let testFlow = [
      {
        id: "n1",
        type: "replication-voter",
        name: "replication-voter",
        valueType: valueType,
        majority: majorityValue,
        countInputs: countInputs,
        margin: margin,
        result: result,
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
      errorNode.on("input", () => {
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

      if (inputType == "number" || inputType == "string") {
        let i;

        for (i = 0; i < sendPayload.length; i++) {
          testNode.receive({ payload: sendPayload[i] });
        }
      } else if (inputType == "array") {
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

  it("should pass when there is a majority number in the inputs", function (done) {
    let sendPayload = [1, 2, 2, 3];

    basicTest("number", 2, 4, 0, "mean", "number", sendPayload, 2, false, done);
  });

  it("should fail when there is no majority number in the inputs", function (done) {
    let sendPayload = [1, 2, 3];

    basicTest(
      "number",
      2,
      3,
      0,
      "mean",
      "number",
      sendPayload,
      null,
      true,
      done
    );
  });

  it("should pass when there is a majority number in the array", function (done) {
    let sendPayload = [1, 2, 2, 3];

    basicTest("number", 2, 4, 0, "mean", "array", sendPayload, 2, false, done);
  });

  it("should fail when there is no majority number in the array", function (done) {
    let sendPayload = [1, 2, 3];

    basicTest(
      "number",
      2,
      3,
      0,
      "mean",
      "array",
      sendPayload,
      null,
      true,
      done
    );
  });

  it("should pass when there is a majority string in the inputs", function (done) {
    let sendPayload = ["world", "hello", "hello", "ldso"];

    basicTest(
      "string",
      2,
      4,
      0,
      "mean",
      "string",
      sendPayload,
      "hello",
      false,
      done
    );
  });

  it("should fail when there is no majority string in the inputs", function (done) {
    let sendPayload = ["hello", "world", "ldso"];

    basicTest(
      "string",
      2,
      3,
      0,
      "mean",
      "string",
      sendPayload,
      null,
      true,
      done
    );
  });

  it("should pass when there is a majority string in the array", function (done) {
    let sendPayload = ["hello", "world", "world", "ldso"];

    basicTest(
      "string",
      2,
      4,
      0,
      "mean",
      "array",
      sendPayload,
      "world",
      false,
      done
    );
  });

  it("should fail when there is no majority string in the array", function (done) {
    let sendPayload = ["hello", "world", "ldso"];

    basicTest(
      "string",
      2,
      3,
      0,
      "mean",
      "array",
      sendPayload,
      null,
      true,
      done
    );
  });

  it("should pass when the value type is number and the inputs are numbers and strings", function (done) {
    let sendPayload = [1, "hello", 2, 2, "world", 3];

    basicTest("number", 2, 4, 0, "mean", "array", sendPayload, 2, false, done);
  });

  it("should pass when the value type is string and the inputs are numbers and strings", function (done) {
    let sendPayload = [1, "hello", 2, 2, "world", "world", 3];

    basicTest("string", 2, 4, 0, "mean", "array", sendPayload, 2, false, done);
  });

  it("should pass when there is a high margin that makes the majority happen", function (done) {
    let sendPayload = [1, 1, 2, 2];

    basicTest(
      "number",
      3,
      4,
      70,
      "mean",
      "number",
      sendPayload,
      1.5,
      false,
      done
    );
  });

  it("should fail when there is a low margin that doesn't make the majority happen", function (done) {
    let sendPayload = [1, 1, 2, 2];

    basicTest(
      "number",
      3,
      4,
      40,
      "mean",
      "number",
      sendPayload,
      null,
      true,
      done
    );
  });

  it("should pass when the result type is the mean value and the majority is the mean value", function (done) {
    let sendPayload = [1, 1, 2, 2];

    basicTest(
      "number",
      3,
      4,
      70,
      "mean",
      "number",
      sendPayload,
      1.5,
      false,
      done
    );
  });

  it("should pass when the result type is the highest value and the majority is the highest value", function (done) {
    let sendPayload = [1, 1, 2, 2];

    basicTest(
      "number",
      3,
      4,
      70,
      "highest",
      "number",
      sendPayload,
      2,
      false,
      done
    );
  });

  it("should pass when the result type is the lowest value and the majority is the lowest value", function (done) {
    let sendPayload = [1, 1, 2, 2];

    basicTest(
      "number",
      3,
      4,
      70,
      "lowest",
      "number",
      sendPayload,
      1,
      false,
      done
    );
  });

  it("should pass when the biggest of two possible majorities is considered the majority", function (done) {
    let sendPayload = [1, 2, 2, 3, 3, 3];

    basicTest("number", 2, 6, 0, "mean", "number", sendPayload, 3, false, done);
  });
});
