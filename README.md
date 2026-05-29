# Web Replica Evaluator

AI-assisted page replica and consistency evaluation project for the WeChat Pay backend development internship task.

## Goals

- Reproduce at least three target pages with maintainable frontend source code.
- Build the evaluation framework before detailed page replication.
- Automatically compare original pages and replica pages across functionality, interaction, visual similarity, performance, accessibility, and responsive behavior.
- Stop evaluation immediately when original page capture is invalid, instead of guessing from incomplete or incorrect source data.
- Preserve key AI prompts and iteration records in commits and documentation.

## Tech Stack

- Vite + React + TypeScript
- React Router
- Playwright for browser automation and e2e checks
- pixelmatch, sharp, and ssim.js for visual comparison
- axe-core for accessibility checks
- Vitest for unit tests

## Project Structure

```text
src/
  pages/
    BaiduReplica/
    WeChatPayLoginReplica/
    ThirdReplica/
  shared/
evaluator/
  collectors/
  metrics/
  reports/
  targets/
tests/
docs/
reports/
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Scripts

```bash
npm run build
npm run preview
npm run test
npm run test:e2e
npm run eval
```

## Replica Routes

| Page | Route | Status |
| --- | --- | --- |
| Baidu home | `/replica/baidu` | Stage one scaffold |
| WeChat Pay merchant login | `/replica/wechat-pay-login` | Stage one scaffold |
| Third target page | `/replica/third` | Waiting for target URL |

## Evaluation Principle

The evaluation framework must validate source capture before scoring. If the original page cannot be accessed correctly, critical selectors are missing, the screenshot is blank, or the page appears to be an error/interception page, the run stops and writes a diagnostic report instead of producing a subjective score.

See `网页复刻与一致性评估实施方案.md` for the full implementation plan.

