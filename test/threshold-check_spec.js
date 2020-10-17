let helper = require("node-red-node-test-helper");
let thresholdCheckNode = require("../threshold-check/threshold-check.js");

helper.init(require.resolve("node-red"));

describe("threshold-check node", function () {
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
        type: "threshold-check",
        name: "threshold-check",
      },
    ];

    helper.load(thresholdCheckNode, testFlow, function () {
      let testNode = helper.getNode("node1");
      try {
        testNode.should.have.property("name", "threshold-check");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  function basicRuleTest(ruleParams, shouldFail, sendPayload, done) {
    let rule = {
      property: "payload",
      propertyType: "msg",
      type: ruleParams.type,
      value: ruleParams.value,
      valueType: ruleParams.valueType,
      value2: ruleParams.value2,
      valueType2: ruleParams.valueType2,
      case: ruleParams.case,
      failMsg: "",
    };

    let testFlow = [
      {
        id: "n1",
        type: "threshold-check",
        name: "threshold-check",
        rules: [rule],
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

    helper.load(thresholdCheckNode, testFlow, function () {
      let error = {
        exist: false,
        description: "",
      };

      let errorNode = helper.getNode("n3");
      errorNode.on("input", (msg) => {
        try {
          if (shouldFail == true) {
            msg.should.have.property("fault");
          } else {
            error.exist = true;
            error.description = "Error node received input when it shouldn't";
          }
        } catch (err) {
          error.exist = true;
          error.description = "Error node";
        }
      });

      let successNode = helper.getNode("n2");
      successNode.on("input", (msg) => {
        try {
          if (shouldFail == true) {
            error.exist = true;
            error.description = "Success node received input when it shouldn't";
          } else {
            msg.should.not.have.property("fault");
          }
        } catch (err) {
          error.exist = true;
          error.description = "Success node";
        }
      });

      let testNode = helper.getNode("n1");
      testNode.receive({ payload: sendPayload });

      setTimeout(() => {
        if (error.exist) {
          done(error.description);
        } else {
          done();
        }
      }, 200);
    });
  }

  /**
   * Equal rule
   */
  it("should fail on equal operation that is different", function (done) {
    let equalRuleParams = {
      type: "eq",
      value: "10",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(equalRuleParams, true, "5", done);
  });

  it("should pass on equal operation that is equal", function (done) {
    let equalRuleParams = {
      type: "eq",
      value: "10",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(equalRuleParams, false, "10", done);
  });

  /**
   * Not equal rule
   */
  it("should fail on not equal operation that is equal", function (done) {
    let equalRuleParams = {
      type: "neq",
      value: "2",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(equalRuleParams, true, "2", done);
  });

  it("should pass on not equal operation that is different", function (done) {
    let notEqualRuleParams = {
      type: "neq",
      value: "2",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(notEqualRuleParams, false, "582", done);
  });

  /**
   * Less rule
   */
  it("should fail on less operation that is greater", function (done) {
    let lessRuleParams = {
      type: "lt",
      value: "15",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(lessRuleParams, true, "20", done);
  });

  it("should fail on less operation that is equal", function (done) {
    let lessRuleParams = {
      type: "lt",
      value: "15",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(lessRuleParams, true, "15", done);
  });

  it("should pass on less operation that is less", function (done) {
    let lessRuleParams = {
      type: "lt",
      value: "15",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(lessRuleParams, false, "10", done);
  });

  /**
   * Less or equal rule
   */
  it("should fail on less or qual operation that is greater", function (done) {
    let lessOrEqualRuleParams = {
      type: "lte",
      value: "15",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(lessOrEqualRuleParams, true, "146", done);
  });

  it("should pass on less or equal operation that is less", function (done) {
    let lessOrEqualRuleParams = {
      type: "lte",
      value: "15",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(lessOrEqualRuleParams, false, "10", done);
  });

  it("should pass on less or equal operation that is equal", function (done) {
    let lessOrEqualRuleParams = {
      type: "lte",
      value: "15",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(lessOrEqualRuleParams, false, "15", done);
  });

  /**
   * Greater rule
   */
  it("should fail on greater operation that is less", function (done) {
    let greaterRuleParams = {
      type: "gt",
      value: "55",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(greaterRuleParams, true, "20", done);
  });

  it("should fail on greater operation that is equal", function (done) {
    let greaterRuleParams = {
      type: "gt",
      value: "55",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(greaterRuleParams, true, "55", done);
  });

  it("should pass on greater operation that is greater", function (done) {
    let greaterRuleParams = {
      type: "gt",
      value: "55",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(greaterRuleParams, false, "60", done);
  });

  /**
   * Greater or equal rule
   */
  it("should fail on greater or qual operation that is less", function (done) {
    let greaterOrEqualRuleParams = {
      type: "gte",
      value: "150",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(greaterOrEqualRuleParams, true, "146", done);
  });

  it("should pass on greater or equal operation that is greater", function (done) {
    let greaterOrEqualRuleParams = {
      type: "gte",
      value: "150",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(greaterOrEqualRuleParams, false, "300", done);
  });

  it("should pass on greater or equal operation that is equal", function (done) {
    let greaterOrEqualRuleParams = {
      type: "gte",
      value: "150",
      valueType: "num",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(greaterOrEqualRuleParams, false, "150", done);
  });

  /**
   * True rule
   */
  it("should fail on true operation that is false", function (done) {
    let trueRuleParams = {
      type: "true",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(trueRuleParams, true, false, done);
  });

  it("should pass on true operation that is true", function (done) {
    let trueRuleParams = {
      type: "true",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(trueRuleParams, false, true, done);
  });

  it("should pass on true operation that is anything other than false", function (done) {
    let trueRuleParams = {
      type: "true",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(trueRuleParams, true, "9123", done);
  });

  it("should fail on true operation that is null", function (done) {
    let trueRuleParams = {
      type: "true",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(trueRuleParams, true, null, done);
  });

  
  /**
   * False rule
   */
  it("should fail on false operation that is true", function (done) {
    let falseRuleParams = {
      type: "false",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(falseRuleParams, true, true, done);
  });

  it("should pass on false operation that is false", function (done) {
    let falseRuleParams = {
      type: "false",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(falseRuleParams, false, false, done);
  });

  it("should fail on false operation that is null", function (done) {
    let falseRuleParams = {
      type: "false",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(falseRuleParams, false, false, done);
  });

  /**
   * Null rule
   */
  it("should fail on null operation that is a string", function (done) {
    let nullRuleParams = {
      type: "null",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(nullRuleParams, true, "wabba lubba dub dub", done);
  });

  it("should fail on null operation that is a number", function (done) {
    let nullRuleParams = {
      type: "null",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(nullRuleParams, true, 430, done);
  });

  it("should pass on null operation that is null", function (done) {
    let nullRuleParams = {
      type: "null",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(nullRuleParams, false, null, done);
  });

  /**
   * Not null rule
   */
  it("should pass on not null operation that is a string", function (done) {
    let notNullRuleParams = {
      type: "nnull",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(notNullRuleParams, false, "wabba lubba dub dub", done);
  });

  it("should pass on not null operation that is a number", function (done) {
    let notNullRuleParams = {
      type: "nnull",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(notNullRuleParams, false, 430, done);
  });

  it("should fail on not null operation that is null", function (done) {
    let notNullRuleParams = {
      type: "nnull",
      value: "",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(notNullRuleParams, true, null, done);
  });

  /**
   * Between rule
   */
  it("should pass on between rule", function (done) {
    let betweenRuleParams = {
      type: "btwn",
      value: "10",
      valueType: "num",
      value2: "20",
      valueType2: "num",
      case: false,
    };

    basicRuleTest(betweenRuleParams, false, 15, done);
  });

  it("should fail on between rule", function (done) {
    let betweenRuleParams = {
      type: "btwn",
      value: "10",
      valueType: "num",
      value2: "20",
      valueType2: "num",
      case: false,
    };

    basicRuleTest(betweenRuleParams, true, 50, done);
  });

  /**
   * Regex rule
   */
  it("should pass on regex rule with a string", function (done) {
    let regexRuleParams = {
      type: "regex",
      value: "b[aeiou]t",
      valueType: "re",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(regexRuleParams, false, "cricket bat", done);
  });

  /**
   * Contains rule
   */
  it("should pass on contains rule with array of integers with a given number", function (done) {
    let containsRuleParams = {
      type: "cont",
      value: "2",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(containsRuleParams, false, "[1,2,3]", done);
  });

  it("should fail on contains rule with array of integers without a given number", function (done) {
    let containsRuleParams = {
      type: "cont",
      value: "4",
      valueType: "str",
      value2: "",
      valueType2: "str",
      case: false,
    };

    basicRuleTest(containsRuleParams, true, "[1,2,3]", done);
  });

  /**
   * Within rule
   */
  it("should pass on within rule with mean and stable values", function (done) {
    let rule = {
      property: "payload",
      propertyType: "msg",
      type: "within",
      value: "2",
      valueType: "num",
      value2: "3",
      valueType2: "mean",
      case: false,
      failMsg: ""
    };

    let testFlow = [
      {
        id: "n1",
        type: "threshold-check",
        name: "threshold-check",
        rules: [rule],
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

    helper.load(thresholdCheckNode, testFlow, function () {
      let error = {
        exist: false,
        description: "",
      };

      let errorNode = helper.getNode("n3");
      errorNode.on("input", (msg) => {
        try {
          msg.should.have.property("fault");
          error.exist = true;
          error.description = "Error node received input when it shouldn't";
        } catch (err) {
          error.exist = true;
          error.description = "Message has no fault parameter when it should";
        }
      });

      let testNode = helper.getNode("n1");
      testNode.receive({ payload: 6});
      testNode.receive({ payload: 8});
      testNode.receive({ payload: 7});

      setTimeout(() => {
        if (error.exist) {
          done(error.description);
        } else {
          done();
        }
      }, 200);
    });
  });

  it("should fail on within rule with mean and alien value", function (done) {
    let rule = {
      property: "payload",
      propertyType: "msg",
      type: "within",
      value: "10",
      valueType: "num",
      value2: "5",
      valueType2: "mean",
      case: false,
      failMsg: ""
    };

    let testFlow = [
      {
        id: "n1",
        type: "threshold-check",
        name: "threshold-check",
        rules: [rule],
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

    helper.load(thresholdCheckNode, testFlow, function () {
      let error = {
        exist: true,
        description: "",
      };

      let errorNode = helper.getNode("n3");
      errorNode.on("input", (msg) => {
        try {
          msg.should.have.property("fault");
          error.exist = false;
        } catch (err) {
          error.exist = true;
          error.description = "Message has no fault parameter when it should";
        }
      });

      let testNode = helper.getNode("n1");
      testNode.receive({ payload: 10});
      testNode.receive({ payload: 12});
      testNode.receive({ payload: 15});
      testNode.receive({ payload: 11});
      testNode.receive({ payload: 35});
      testNode.receive({ payload: 14});

      setTimeout(() => {
        if (error.exist) {
          done(error.description);
        } else {
          done();
        }
      }, 200);
    });
  });
});
