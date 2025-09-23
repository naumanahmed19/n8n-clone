const fs = require("fs").promises;
const path = require("path");

async function debugNodeLoading() {
  console.log("=== Debug Node Loading ===");
  console.log("Current working directory:", process.cwd());

  const customNodesPath = path.join(process.cwd(), "custom-nodes");
  console.log("Custom nodes path:", customNodesPath);

  try {
    // Test directory exists using the same method as NodeLoader
    console.log("Testing directory existence...");
    const stats = await fs.stat(customNodesPath);
    console.log("Directory exists:", stats.isDirectory());

    console.log("Reading directory contents...");
    const entries = await fs.readdir(customNodesPath, { withFileTypes: true });
    console.log("All entries:");
    entries.forEach((entry) => {
      console.log(
        `  - ${entry.name} (${entry.isDirectory() ? "directory" : "file"})`
      );
    });

    const packageDirs = entries.filter((entry) => entry.isDirectory());
    console.log(
      `Found ${packageDirs.length} package directories:`,
      packageDirs.map((d) => d.name)
    );

    // Test each package directory
    for (const packageDir of packageDirs) {
      const packagePath = path.join(customNodesPath, packageDir.name);
      console.log(`\n--- Testing package: ${packageDir.name} ---`);
      console.log(`Package path: ${packagePath}`);

      // Check package.json exists
      const packageJsonPath = path.join(packagePath, "package.json");
      try {
        await fs.access(packageJsonPath);
        console.log("✓ package.json exists");

        const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
        const packageInfo = JSON.parse(packageJsonContent);
        console.log("✓ package.json is valid JSON");

        console.log("Package info:");
        console.log(`  - name: ${packageInfo.name}`);
        console.log(`  - version: ${packageInfo.version}`);
        console.log(`  - main: ${packageInfo.main}`);
        console.log(`  - nodes: ${JSON.stringify(packageInfo.nodes)}`);

        // Check main file exists
        if (packageInfo.main) {
          const mainPath = path.join(packagePath, packageInfo.main);
          try {
            await fs.access(mainPath);
            console.log(`✓ Main file exists: ${packageInfo.main}`);
          } catch {
            console.log(`✗ Main file missing: ${packageInfo.main}`);
          }
        }

        // Check node files exist
        if (packageInfo.nodes && Array.isArray(packageInfo.nodes)) {
          for (const nodePath of packageInfo.nodes) {
            const fullNodePath = path.join(packagePath, nodePath);
            try {
              await fs.access(fullNodePath);
              console.log(`✓ Node file exists: ${nodePath}`);
            } catch {
              console.log(`✗ Node file missing: ${nodePath}`);
            }
          }
        }
      } catch (error) {
        console.log(`✗ Error with package.json: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Error during debug:", error);
  }
}

debugNodeLoading();
