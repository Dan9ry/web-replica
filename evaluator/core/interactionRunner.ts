import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import {
  buildFailedAssertionResult,
  evaluateAssertion,
  executeBrowserAction,
} from "./assertions.js";
import type { InteractionCaseConfig, InteractionCheckResult, PageTarget } from "./types.js";

interface RunInteractionOptions {
  target: PageTarget;
  reportDir: string;
}

function defaultInteractionCases(target: PageTarget): InteractionCaseConfig[] {
  return (target.states ?? []).flatMap((state) => {
    if (!state.expectations || state.expectations.length === 0) {
      return [];
    }

    return [
      {
        id: `${state.id}-state-expectations`,
        name: `${state.name} 状态断言`,
        targetState: state.id,
        replicaUrl: state.replicaUrl ?? target.replicaUrl,
        steps: state.replicaSteps ?? [],
        assertions: state.expectations,
      },
    ];
  });
}

export async function runInteractionChecks({
  target,
  reportDir,
}: RunInteractionOptions): Promise<InteractionCheckResult[]> {
  const cases = target.interactions && target.interactions.length > 0
    ? target.interactions
    : defaultInteractionCases(target);

  if (cases.length === 0) {
    return [];
  }

  const viewport = target.viewports[0] ?? { name: "desktop", width: 1365, height: 768 };
  const browser = await chromium.launch({ headless: true });
  const results: InteractionCheckResult[] = [];

  try {
    for (const testCase of cases) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const base = {
        id: testCase.id,
        stateId: testCase.targetState ?? testCase.sourceState ?? testCase.id,
        name: testCase.name,
        weight: testCase.weight ?? 1,
      };

      try {
        await page.goto(testCase.replicaUrl ?? target.replicaUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });

        let stepIndex = 0;
        for (const step of testCase.steps ?? []) {
          stepIndex += 1;
          await executeBrowserAction(page, step);
        }

        for (const assertion of testCase.assertions ?? []) {
          stepIndex += 1;
          try {
            await evaluateAssertion(page, assertion);
          } catch (error) {
            const screenshotDir = join(reportDir, "assets", target.id, "interaction-failures");
            await mkdir(screenshotDir, { recursive: true });
            const screenshotPath = join(screenshotDir, `${testCase.id}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => undefined);
            results.push(
              await buildFailedAssertionResult(
                page,
                base,
                stepIndex,
                assertion,
                error instanceof Error ? error.message : String(error),
                screenshotPath,
              ),
            );
            throw error;
          }
        }

        results.push({
          ...base,
          passed: true,
        });
      } catch (error) {
        if (!results.some((result) => result.id === testCase.id)) {
          results.push({
            ...base,
            passed: false,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      } finally {
        await page.close().catch(() => undefined);
      }
    }
  } finally {
    await browser.close().catch(() => undefined);
  }

  return results;
}
