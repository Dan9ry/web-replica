# Gitee Signup Replica Request

## User Request

复刻网页：

- 网址：https://gitee.com/signup
- 复刻范围：复刻注册页面，包括点击输入框离开后的必填项提示，各个输入框，注册按钮交互提示。

## Auto Plan

- Target id: `gitee-signup`
- Original URL: `https://gitee.com/signup`
- Planned replica URL: `http://127.0.0.1:5173/replica/gitee-signup`
- Stack: React + TypeScript + CSS Modules
- Source capture mode: 交互辅助采集
- Evaluation mode: Phase 6 uses Phase 3 project-local baselines only.
- Skip mode: Phase 1 and Phase 4 confirmation waits are skipped.

## Scope

- Gitee signup page form region and surrounding context.
- Visible signup inputs.
- Required-field feedback after focusing and blurring empty inputs.
- Signup button click feedback using local validation only.

## Non-Goals

- No real Gitee signup API calls.
- No SMS/email sending.
- No OAuth, QR login, real captcha solving, or risk-control bypass.
- No storage or submission of real personal information.

## Acceptance Thresholds

- Total score >= 90
- Functionality >= 90
- Interaction >= 90
- Visual >= 90
