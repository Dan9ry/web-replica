# Decisions

## 2026-05-29

- Use target id `weixin-pay-login`.
- Use React + TypeScript + CSS Modules per repository replica workflow.
- Implement only the username, password, verification-code input area and login button interaction.
- Use local validation feedback for login-button click; do not call the real Weixin Pay login endpoint.
- Use Phase 3 source baselines for Phase 6 evaluation. Evaluation must not recapture the original site.
- The source URL first renders the merchant home hero with QR login. The requested username/password/captcha form appears after clicking the visible top-right corner icon on the QR login card.
- The click-validation baseline is captured by clicking the green login button with empty fields; source shows `请输入账号和密码`.
- Downloaded and used the source site's public visible logo and login-card corner assets locally. The large hero banner asset was protected by hotlink rules and produced a placeholder, so it was not used.

## Evaluation Rounds

- Round 1 command: `EVAL_TARGET_CONFIG=projects/weixin-pay-login/config/target.json npm run eval`
- Round 1 result: total 89.9, functionality 100, interaction 100, visual 74.7.
- Round 1 change: adjusted CSS hero background tones and lower-page shapes to better approximate the source screenshot without using screenshots as page assets.
- Round 2 result: total 90.3, functionality 100, interaction 100, visual 75.7.
- Round 2 change: added local copies of the source site's public visible logo and QR-corner asset.
- Round 3 result: total 90.4, functionality 100, interaction 100, visual 76.1.
- Stop reason: the maximum Phase 6 iteration limit was reached. Remaining visual difference is dominated by the original site's large photographic hero image; the delivered page remains an interactive DOM/CSS implementation and does not use full-page or cropped source screenshots.

## Same-Type Stability Check

- Same-type task considered: a generic account/password/captcha login form replica.
- Request parsing can proceed with the same state model: initial form and submit-validation state.
- Source-capture planning remains valid: capture top, middle, bottom, DOM summary, and use same-browser handoff for security verification when needed.
- Implementation strategy remains valid: controlled inputs, local validation, no real authentication request, and DOM/CSS form rendering.
