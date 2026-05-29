import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, test } from "vitest";
import { loadTargets } from "../../evaluator/core/targets";

const previousConfig = process.env.EVAL_TARGET_CONFIG;

async function createProjectFixture(originalUrl = "https://example.com"): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), "web-replica-target-config-"));
  await mkdir(join(rootDir, "projects", "example", "config"), { recursive: true });
  await writeFile(
    join(rootDir, "projects", "example", "config", "target.json"),
    JSON.stringify(
      {
        id: "example",
        name: "Example",
        originalUrl,
        replicaUrl: "http://127.0.0.1:5173/replica/example",
        criticalSelectors: [],
        viewports: [{ name: "desktop", width: 1365, height: 768 }],
      },
      null,
      2,
    ),
    "utf8",
  );
  return rootDir;
}

afterEach(() => {
  if (previousConfig === undefined) {
    delete process.env.EVAL_TARGET_CONFIG;
  } else {
    process.env.EVAL_TARGET_CONFIG = previousConfig;
  }

  delete process.env.EVAL_TARGET;
  delete process.env.EVAL_ALL;
});

describe("loadTargets", () => {
  test("loads the current project target from EVAL_TARGET_CONFIG", async () => {
    const rootDir = await createProjectFixture();
    process.env.EVAL_TARGET_CONFIG = "projects/example/config/target.json";

    const targets = await loadTargets(rootDir);

    expect(targets.map((target) => target.id)).toEqual(["example"]);
    expect(targets[0].projectRoot).toBe(join(rootDir, "projects", "example"));
    expect(targets[0].baselineDir).toBe(join(rootDir, "projects", "example", "baselines"));
  });

  test("requires a current project target config", async () => {
    const rootDir = await createProjectFixture();
    delete process.env.EVAL_TARGET_CONFIG;

    await expect(loadTargets(rootDir)).rejects.toThrow(
      "必须通过 EVAL_TARGET_CONFIG 指定当前复刻项目配置",
    );
  });

  test("rejects project configs without an original URL", async () => {
    const rootDir = await createProjectFixture("");
    process.env.EVAL_TARGET_CONFIG = "projects/example/config/target.json";

    await expect(loadTargets(rootDir)).rejects.toThrow("当前复刻项目配置缺少 originalUrl");
  });
});
