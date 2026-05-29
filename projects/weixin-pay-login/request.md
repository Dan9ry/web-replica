# Weixin Pay Login Replica Request

## User Request

复刻网页，跳过用户确认：

- 网址：`https://pay.weixin.qq.com/index.php/core/home/login`
- 复刻范围：仅复刻用户名、密码、验证码输入区域，以及登录按钮的点击交互。

## Auto Plan

- Target id: `weixin-pay-login`
- Original URL: `https://pay.weixin.qq.com/index.php/core/home/login`
- Planned replica URL: `http://127.0.0.1:5173/replica/weixin-pay-login`
- Stack: React + TypeScript + CSS Modules
- Source capture mode: 交互辅助采集
- Evaluation mode: Phase 6 uses Phase 3 project-local baselines only.
- Skip mode: Phase 1 and Phase 4 confirmation waits are skipped.

## Scope

- Username input area.
- Password input area.
- Verification-code input area and visible captcha image region.
- Login button.
- Local click interaction: empty/invalid submit shows local validation feedback and does not call the real login API.

## Non-Goals

- No real Weixin Pay login request.
- No account/session/cookie handling.
- No SMS, QR, account recovery, registration, or merchant onboarding flows.
- No CAPTCHA solving or bypass.

## Acceptance Thresholds

- Total score >= 90
- Functionality >= 90
- Interaction >= 90
- Visual >= 90
