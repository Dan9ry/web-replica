# WeChat Pay Login Replica Request

## Source

- Original URL: https://pay.weixin.qq.com/index.php/core/home/login
- Material type: URL
- Capture mode: interactive assisted capture with a visible browser if verification appears

## Scope

- Replica URL: http://127.0.0.1:5173/replica/wechat-pay-login
- Project root: projects/wechat-pay-login
- In scope: username input, password input, captcha input area, login button, and local click interaction.
- States: initial form, typed form, validation error, submit loading/failure feedback.
- Non-goals: real WeChat Pay authentication, real captcha validation, QR login, account recovery, merchant backend navigation, payment functions, and any real network login call.

## Evaluation

- Evaluator config: projects/wechat-pay-login/config/target.json
- Evaluation uses only Phase 3 baselines and does not re-capture the source page.
- Acceptance thresholds: total >= 85, functionality >= 85, interaction >= 85, visual >= 60, structure >= 80, content >= 80, engineering >= 80.

