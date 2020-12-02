const { Builder, By, until } = require("selenium-webdriver");
const { spawn } = require("child_process");
require("should");

describe("resource-monitor node", async function () {
  this.timeout(0);
  let driver;
  let proc;
  const testPort = "8090";
  const injectXpath =
    "//*[text()='Input']/../preceding-sibling::*[contains(@class, 'red-ui-flow-node-button')]/*[contains(@class, 'red-ui-flow-node-button-button')]";

  it("should be test resource-monitor", async function () {
    driver = await new Builder()
      .forBrowser("firefox")
      .usingServer("http://selenium:4444/wd/hub")
      .build();

    const testJson = "test-acceptance/resource-monitor.json";
    proc = spawn("node-red", ["-p", testPort, testJson], {
      detached: true,
    });

    try {
      await driver.sleep(2000);
      await driver.get("http://nodered:8090");

      await driver
        .wait(until.elementLocated(By.xpath(injectXpath)), 10000)
        .click();

      await driver
        .wait(
          until.elementLocated(By.id("red-ui-tab-debug-link-button")),
          10000
        )
        .click();

      let textfields = await driver.findElements(
        By.xpath(
          "//*[contains(@class, 'red-ui-debug-msg')]//following-sibling::*"
        )
      );

      textfields.length.should.be.equal(0);
    } finally {
      process.kill(-proc.pid);
      await driver.quit();
    }
  });
});
