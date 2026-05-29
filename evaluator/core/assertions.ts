import type { Page } from "playwright";
import type { AssertionStep, BrowserActionStep, InteractionCheckResult } from "./types.js";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function actualForAssertion(page: Page, assertion: AssertionStep): Promise<string | number> {
  if (assertion.type === "expectUrlIncludes") {
    return page.url();
  }

  const locator = page.locator(assertion.selector);

  if (assertion.type === "expectCount") {
    return locator.count();
  }

  if (assertion.type === "expectValue") {
    return locator.inputValue({ timeout: 5_000 });
  }

  if (assertion.type === "expectAttribute") {
    return (await locator.first().getAttribute(assertion.attribute ?? "data-value")) ?? "";
  }

  if (assertion.type === "expectClassContains") {
    return (await locator.first().getAttribute("class")) ?? "";
  }

  return normalizeText(await locator.first().innerText({ timeout: 5_000 }));
}

export async function executeBrowserAction(page: Page, step: BrowserActionStep): Promise<void> {
  if (step.type === "fill") {
    await page.locator(step.selector).fill(step.value, { timeout: 10_000 });
  } else if (step.type === "click") {
    await page.locator(step.selector).click({ timeout: 10_000 });
  } else if (step.type === "press") {
    await page.locator(step.selector).press(step.key, { timeout: 10_000 });
  } else if (step.type === "waitForSelector") {
    await page.locator(step.selector).waitFor({
      state: "visible",
      timeout: step.timeoutMs ?? 10_000,
    });
  } else if (step.type === "waitForURLIncludes") {
    await page.waitForURL((url) => url.href.includes(step.value), {
      timeout: step.timeoutMs ?? 10_000,
    });
  } else if (step.type === "hover") {
    await page.locator(step.selector).hover({ timeout: 10_000 });
  } else if (step.type === "focus") {
    await page.locator(step.selector).focus({ timeout: 10_000 });
  } else if (step.type === "blur") {
    await page.locator(step.selector).blur({ timeout: 10_000 });
  } else if (step.type === "check") {
    await page.locator(step.selector).check({ timeout: 10_000 });
  } else if (step.type === "uncheck") {
    await page.locator(step.selector).uncheck({ timeout: 10_000 });
  } else if (step.type === "selectOption") {
    await page.locator(step.selector).selectOption(step.value, { timeout: 10_000 });
  } else if (step.type === "scroll") {
    if (step.selector) {
      await page.locator(step.selector).evaluate(
        (element, offset) => element.scrollBy(offset.x ?? 0, offset.y ?? 0),
        { x: step.x, y: step.y },
      );
    } else {
      await page.mouse.wheel(step.x ?? 0, step.y ?? 0);
    }
  } else {
    await page.waitForTimeout(step.ms);
  }
}

export async function evaluateAssertion(page: Page, assertion: AssertionStep): Promise<void> {
  if (assertion.type === "expectUrlIncludes") {
    if (!page.url().includes(assertion.value)) {
      throw new Error(`URL should include "${assertion.value}", actual "${page.url()}"`);
    }
    return;
  }

  const locator = page.locator(assertion.selector);

  if (assertion.type === "expectVisible") {
    if (!(await locator.first().isVisible({ timeout: 5_000 }).catch(() => false))) {
      throw new Error(`${assertion.selector} should be visible`);
    }
  } else if (assertion.type === "expectHidden") {
    if (await locator.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      throw new Error(`${assertion.selector} should be hidden`);
    }
  } else if (assertion.type === "expectTextIncludes") {
    const actual = normalizeText(await locator.first().innerText({ timeout: 5_000 }));
    if (!actual.includes(assertion.value)) {
      throw new Error(`${assertion.selector} text should include "${assertion.value}", actual "${actual}"`);
    }
  } else if (assertion.type === "expectTextEquals") {
    const actual = normalizeText(await locator.first().innerText({ timeout: 5_000 }));
    if (actual !== assertion.value) {
      throw new Error(`${assertion.selector} text should equal "${assertion.value}", actual "${actual}"`);
    }
  } else if (assertion.type === "expectCount") {
    const actual = await locator.count();
    if (typeof assertion.value === "number" && actual !== assertion.value) {
      throw new Error(`${assertion.selector} count should be ${assertion.value}, actual ${actual}`);
    }
    if (typeof assertion.min === "number" && actual < assertion.min) {
      throw new Error(`${assertion.selector} count should be >= ${assertion.min}, actual ${actual}`);
    }
    if (typeof assertion.max === "number" && actual > assertion.max) {
      throw new Error(`${assertion.selector} count should be <= ${assertion.max}, actual ${actual}`);
    }
  } else if (assertion.type === "expectValue") {
    const actual = await locator.first().inputValue({ timeout: 5_000 });
    if (actual !== assertion.value) {
      throw new Error(`${assertion.selector} value should be "${assertion.value}", actual "${actual}"`);
    }
  } else if (assertion.type === "expectAttribute") {
    const actual = (await locator.first().getAttribute(assertion.attribute ?? "data-value")) ?? "";
    if (actual !== assertion.value) {
      throw new Error(`${assertion.selector} attribute ${assertion.attribute} should be "${assertion.value}", actual "${actual}"`);
    }
  } else if (assertion.type === "expectClassContains") {
    const actual = (await locator.first().getAttribute("class")) ?? "";
    if (!actual.includes(assertion.value)) {
      throw new Error(`${assertion.selector} class should contain "${assertion.value}", actual "${actual}"`);
    }
  } else if (assertion.type === "expectFocused") {
    const focused = await locator.first().evaluate((element) => element === element.ownerDocument.activeElement);
    if (!focused) {
      throw new Error(`${assertion.selector} should be focused`);
    }
  } else if (assertion.type === "expectEnabled") {
    if (!(await locator.first().isEnabled({ timeout: 5_000 }).catch(() => false))) {
      throw new Error(`${assertion.selector} should be enabled`);
    }
  } else if (assertion.type === "expectDisabled") {
    if (await locator.first().isEnabled({ timeout: 5_000 }).catch(() => true)) {
      throw new Error(`${assertion.selector} should be disabled`);
    }
  }
}

export async function buildFailedAssertionResult(
  page: Page,
  base: Omit<InteractionCheckResult, "passed">,
  failedStep: number,
  assertion: AssertionStep,
  message: string,
  screenshot?: string,
): Promise<InteractionCheckResult> {
  return {
    ...base,
    passed: false,
    failedStep,
    type: assertion.type,
    selector: "selector" in assertion ? assertion.selector : undefined,
    expected: "value" in assertion ? assertion.value : undefined,
    actual: await actualForAssertion(page, assertion).catch(() => ""),
    screenshot,
    message,
  };
}
