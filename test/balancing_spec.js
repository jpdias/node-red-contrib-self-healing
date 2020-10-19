let should = require("should");
let helper = require("node-red-node-test-helper");
let balancingNode = require("../balancing/balancing.js");

helper.init(require.resolve("node-red"));

describe('balancing node', function () {
    
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', function (done) {
    let flow = [{id: "n1", type: "balancing", name: "balancing", outputs: 3, algorithm: "1", weights: "1.1.1"}];

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

  function testNode(algorithm, done) {
    let flow = [
      {id: "n1", type: "balancing", name: "balancing", outputs: 3, algorithm: algorithm, weights: "1.1.1", wires: [["n2"],["n3"],["n4"]]},
      {id: "n2", type: "helper"},
      {id: "n3", type: "helper"},
      {id: "n4", type: "helper"}
    ];

    helper.load(balancingNode, flow, function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let n4 = helper.getNode("n4");

      let count = 0;

      n2.on("input", function (msg, _send, _done) {
        should(msg).have.property('payload', 'Testing');
        count++;
      });

      n3.on("input", function (msg, _send, _done) {
        should(msg).have.property('payload', 'Testing');
        count++;
      });

      n4.on("input", function (msg, _send, _done) {
        should(msg).have.property('payload', 'Testing');
        count++;
      });

      n1.receive({payload: "Testing"});

      setTimeout(function () {
        if(count == 1)
          done();
      }, 1000);
    });
  }


  it('should send message to only one output using Round Robin algorithm', function (done) {
    testNode("1", done);
  });
    
  it('should send message to only one output using Weighted Round Robin algorithm', function (done) {
    testNode("2", done);
  });
    
  it('should send message to only one output using Random algorithm', function (done) {
    testNode("3", done);
  });

    
});