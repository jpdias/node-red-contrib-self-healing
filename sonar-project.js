const sonarqubeScanner = require("sonarqube-scanner");

let nodePath = process.argv[2];

if (nodePath) {
  console.log("NODE PATH: " + nodePath);
  sonarqubeScanner(
    {
      serverUrl: "http://localhost:9876",
      options: {
        "sonar.sources": ".",
        "sonar.inclusions": nodePath,
      },
    },
    () => {}
  );
} else {
  throw new Error("No node path defined");
}
