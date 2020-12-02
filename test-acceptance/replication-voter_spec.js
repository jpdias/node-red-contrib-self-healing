const { Builder, By, until } = require("selenium-webdriver");
const { spawn } = require("child_process");
require("should");

describe("replication-voter node", async function () {
  this.timeout(0);
  let driver;
  let proc;
  const testPort = "8090";
  const inject1Xpath =
    "//*[text()='Inject1']/../preceding-sibling::*[contains(@class, 'red-ui-flow-node-button')]/*[contains(@class, 'red-ui-flow-node-button-button')]";
  const inject2Xpath =
    "//*[text()='Inject2']/../preceding-sibling::*[contains(@class, 'red-ui-flow-node-button')]/*[contains(@class, 'red-ui-flow-node-button-button')]";

  it("should be test replication-voter", async function () {
    driver = await new Builder()
      .forBrowser("firefox")
      .usingServer("http://selenium:4444/wd/hub")
      .build();

    const testJson = "test-acceptance/replication-voter.json";
    proc = spawn("node-red", ["-p", testPort, testJson], {
      detached: true,
    });

    try {
      await driver.sleep(2000);
      await driver.get("http://nodered:8090");

      await driver.sleep(2000);
      await driver
        .wait(until.elementLocated(By.xpath(inject2Xpath)), 10000)
        .click();
      await driver
        .wait(until.elementLocated(By.xpath(inject1Xpath)), 10000)
        .click();
      await driver
        .wait(until.elementLocated(By.xpath(inject2Xpath)), 10000)
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

      let firstMsg = await debugPanel.findElement(
        By.css(".red-ui-debug-msg .red-ui-debug-msg-row")
      );

      const msg = await firstMsg.getAttribute("textContent");

      msg.should.be.equal("2");
    } finally {
      process.kill(-proc.pid);
      await driver.quit();
    }
  });
});
