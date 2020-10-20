let should = require("should");
let helper = require("node-red-node-test-helper");
let balancingNode = require("../balancing/balancing.js");

helper.init(require.resolve("node-red"));

describe("balancing node", function () {
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
        type: "balancing",
        name: "balancing",
        outputs: 3,
        algorithm: "1",
        weights: "1.1.1",
      },
    ];

    helper.load(balancingNode, flow, function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "balancing");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  function createFlow(algorithm) {
    let flow = [
      {
        id: "n1",
        type: "balancing",
        name: "balancing",
        outputs: 3,
        algorithm: algorithm,
        weights: "1.1.1",
        wires: [["n2"], ["n3"], ["n4"]],
      },
      { id: "n2", type: "helper" },
      { id: "n3", type: "helper" },
      { id: "n4", type: "helper" },
    ];

    return flow;
  }

  function testNode(algorithm, done) {
    let flow = createFlow(algorithm);

    helper.load(balancingNode, flow, function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let n4 = helper.getNode("n4");

      let count = 0;

      n2.on("input", function (msg, _send, _done) {
        should(msg).have.property("payload", "Testing");
        count++;
      });

      n3.on("input", function (msg, _send, _done) {
        should(msg).have.property("payload", "Testing");
        count++;
      });

      n4.on("input", function (msg, _send, _done) {
        should(msg).have.property("payload", "Testing");
        count++;
      });

      n1.receive({ payload: "Testing" });

      setTimeout(function () {
        if (count == 1) done();
      }, 50);
    });
  }

  it("should send message to only one output using Round Robin algorithm", function (done) {
    testNode("1", done);
  });

  it("should send message to only one output using Weighted Round Robin algorithm", function (done) {
    testNode("2", done);
  });

  it("should send message to only one output using Random algorithm", function (done) {
    testNode("3", done);
  });

  it("should see if Round Robin algorithm works properly", function (done) {
    let flow = createFlow("1");

    helper.load(balancingNode, flow, function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let n4 = helper.getNode("n4");

      let expectedOutputNode = "";
      let count = 0;
      let isValid = true;

      n2.on("input", function (msg, _send, _done) {
        should(msg).have.property("payload", "Testing");
        expectedOutputNode = "n2";
        count++;
      });

      n3.on("input", function (msg, _send, _done) {
        should(msg).have.property("payload", "Testing");
        expectedOutputNode = "n3";
        count++;
      });

      n4.on("input", function (msg, _send, _done) {
        should(msg).have.property("payload", "Testing");
        expectedOutputNode = "n4";
        count++;
      });

      let temp = 2;
      for (let i = 1; i <= 4; i++) {
        if (isValid == false) break;

        n1.receive({ payload: "Testing" });

        setTimeout(function () {
          if (expectedOutputNode != "n" + temp) {
            isValid = false;
          }
        }, 50);

        temp++;
        if (temp == 5) temp = 2;
      }

      if (isValid == true) done();
      else done(new Error());
    });
  });
});
