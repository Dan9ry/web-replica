import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, test } from "vitest";
import { loadTargets } from "../../evaluator/core/targets";

const previousTarget = process.env.EVAL_TARGET;

async function writeTarget(rootDir: string, fileName: string, id: string, originalUrl: string) {
  await writeFile(
    join(rootDir, "evaluator", "targets", fileName),
    JSON.stringify(
      {
        id,
        name: id,
        originalUrl,
        replicaUrl: `http://127.0.0.1:5173/replica/${id}`,
        criticalSelectors: [],
        viewports: [{ name: "desktop", width: 1365, height: 768 }],
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function createTargetsFixture(): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), "web-replica-targets-"));
  await mkdir(join(rootDir, "evaluator", "targets"), { recursive: true });
  await writeTarget(rootDir, "baidu.json", "baidu", "https://www.baidu.com");
  await writeTarget(
    rootDir,
    "wechat-pay-login.json",
    "wechat-pay-login",
    "https://pay.weixin.qq.com",
  );
  await writeTarget(rootDir, "third-page.json", "third-page", "");
  return rootDir;
}

afterEach(() => {
  if (previousTarget === undefined) {
    delete process.env.EVAL_TARGET;
  } else {
    process.env.EVAL_TARGET = previousTarget;
  }

  delete process.env.EVAL_ALL;
});

describe("loadTargets", () => {
  test("filters targets by EVAL_TARGET when provided", async () => {
    const rootDir = await createTargetsFixture();
    process.env.EVAL_TARGET = "baidu";

    const targets = await loadTargets(rootDir);

    expect(targets.map((target) => target.id)).toEqual(["baidu"]);
  });

  test("does not support all-target evaluation", async () => {
    const rootDir = await createTargetsFixture();
    delete process.env.EVAL_TARGET;
    process.env.EVAL_ALL = "1";

    await expect(loadTargets(rootDir)).rejects.toThrow(
      "必须通过 EVAL_TARGET 指定当前复刻项目",
    );
  });

  test("requires an explicit current project target", async () => {
    const rootDir = await createTargetsFixture();
    delete process.env.EVAL_TARGET;
    delete process.env.EVAL_ALL;

    await expect(loadTargets(rootDir)).rejects.toThrow(
      "必须通过 EVAL_TARGET 指定当前复刻项目",
    );
  });
});
