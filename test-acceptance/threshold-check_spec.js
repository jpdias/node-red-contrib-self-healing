const { Builder, By, until } = require("selenium-webdriver");
const { spawn } = require("child_process");
require("should");

describe("threshold-check node", async function () {
  this.timeout(0);
  let driver;
  let proc;
  const testPort = "8090";
  const errorXpath =
    "//*[text()='reading value']/../preceding-sibling::*[contains(@class, 'red-ui-flow-node-button')]/*[contains(@class, 'red-ui-flow-node-button-button')]";

  it("should be test threshold-check", async function () {
    driver = await new Builder()
      .forBrowser("firefox")
      .usingServer("http://selenium:4444/wd/hub")
      .build();

    const testJson = "test-acceptance/threshold-check.json";
    proc = spawn("node-red", ["-p", testPort, testJson], {
      detached: true,
    });

    try {
      await driver.sleep(1500);
      await driver.get("http://nodered:8090");

      await driver
        .wait(until.elementLocated(By.xpath(errorXpath)), 10000)
        .click();

      await driver
        .wait(
          until.elementLocated(By.id("red-ui-tab-debug-link-button")),
          10000
        )
        .click();

      let debugPanel = await driver.wait(
        until.elementLocated(
          By.className("red-ui-debug-content red-ui-debug-content-list")
        ),
        10000
      );

      let firstMsgContent = await debugPanel.findElement(
        By.css(".red-ui-debug-msg .red-ui-debug-msg-row")
      );

      let firstMsgName = await debugPanel.findElement(
        By.css(".red-ui-debug-msg .red-ui-debug-msg-name")
      );

      const msgText = await firstMsgContent.getAttribute("textContent");
      msgText.should.be.equal("10");

      const nodeName = await firstMsgName.getAttribute("textContent");
      nodeName.should.be.equal("node: error actuator");
    } finally {
      process.kill(-proc.pid);
      await driver.quit();
    }
  });
});
