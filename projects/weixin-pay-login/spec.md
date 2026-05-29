# Weixin Pay Login Replica Spec

## Scope

- Page scope: Weixin Pay merchant login area inside the captured login page.
- State scope: account/password/captcha login initial state and login-button validation state.
- Function scope: username input, password input, verification-code input, captcha image region, refresh-captcha text, login button click.
- Non-goals: no real Weixin Pay login API, no account/session/cookie handling, no QR login workflow, no merchant onboarding workflow, no CAPTCHA solving.

## Route And Runtime

- Replica route: `/replica/weixin-pay-login`
- Planned local URL: `http://127.0.0.1:5173/replica/weixin-pay-login`
- Source files: `projects/weixin-pay-login/page/`
- Stack: React + TypeScript + CSS Modules
- Evaluation target config: `projects/weixin-pay-login/config/target.json`
- Evaluation mode: Phase 6 uses Phase 3 baselines only.
- Acceptance thresholds: total >= 90, functionality >= 90, interaction >= 90, visual >= 90.

## Source Evidence

| State | Top | Middle | Bottom | DOM/notes |
| --- | --- | --- | --- | --- |
| Login initial | `baselines/login-initial/original-top.png` | `baselines/login-initial/original-middle.png` | `baselines/login-initial/original-bottom.png` | `baselines/login-initial/original-dom.json`, `baselines/login-initial/capture-notes.md` |
| Login validation | `baselines/login-validation/original-top.png` | `baselines/login-validation/original-middle.png` | `baselines/login-validation/original-bottom.png` | `baselines/login-validation/original-dom.json`, `baselines/login-validation/capture-notes.md` |

Both required states have head/top, middle, and footer/bottom coverage. The requested form area appears after switching the QR panel to account/password login through the visible top-right card icon.

## Region And Component Decomposition

| Area/region | Source state and screenshot evidence | Key elements | Visual requirements | Interaction requirements | Implementation component/file |
| --- | --- | --- | --- | --- | --- |
| Page chrome context | Login initial: `original-top.png` | dark top strip, logo row, nav links, green CTA, hero background | enough surrounding context to place the login panel exactly; subdued, not fully interactive | inert local links only | `WeixinPayLoginReplicaPage.tsx`, `WeixinPayLoginReplicaPage.module.css` |
| Login card | Login initial: `original-top.png` | white card at right, title `账号密码登录`, QR-corner toggle icon | fixed card width, white surface, top-right pale QR corner, aligned with source hero | no real QR switch needed beyond visual affordance | `components/LoginCard.tsx` |
| Username input | Login initial: `original-top.png`, DOM input `placeholder=登录账号` | icon, placeholder, border | 256px-like source width, 40px height, pale gray border | controlled input updates local state | `components/LoginField.tsx`, `hooks/useLoginForm.ts` |
| Password input | Login initial: `original-top.png`, DOM input `placeholder=登录密码` | lock icon, password placeholder | same rhythm as username field | controlled password input updates local state | `components/LoginField.tsx`, `hooks/useLoginForm.ts` |
| Verification-code row | Login initial: `original-top.png`, DOM input `placeholder=验证码` | short input, captcha image block, `换一张` text | three-part row, captcha colors approximate current source image without copying it as page background | refresh text changes local captcha variant | `components/CaptchaRow.tsx`, `hooks/useLoginForm.ts` |
| Validation message | Login validation: `original-top.png` | red text `请输入账号和密码` under captcha row | red text aligned to form left, compact vertical spacing | appears after clicking login when username/password are empty | `components/LoginCard.tsx`, `hooks/useLoginForm.ts` |
| Login button | Login initial/validation: `original-top.png` | green full-width button text `登录` | bright WeChat green, 40px height, square-ish corners | clicking performs local validation only; no network call | `components/LoginCard.tsx`, `hooks/useLoginForm.ts` |

## Implementation Strategy

1. Register `/replica/weixin-pay-login` in `src/App.tsx` and import the project-local page component.
2. Keep all replica source under `projects/weixin-pay-login/page/`.
3. Build real DOM/CSS/JS controls:
   - `useLoginForm.ts` stores username, password, captcha, captcha variant, and submitted state.
   - `LoginCard.tsx` renders the requested form area and handles submit.
   - `CaptchaRow.tsx` renders a deterministic local captcha-like SVG/text block and refresh affordance.
4. Use source screenshots only as evidence. The final page must not use full-page screenshot backgrounds or image maps.
5. Do not call the real Weixin Pay login endpoint. Empty or incomplete submit shows the local red validation text.
6. After implementation, run tests/build, start Vite, verify local interaction, then run:

```bash
EVAL_TARGET_CONFIG=projects/weixin-pay-login/config/target.json npm run eval
```

## Phase 4 Checkpoint

- [x] `spec.md` drafted
- [x] State-to-baseline mapping complete
- [x] Source screenshots/baselines listed with implementation strategy
- [x] Region/component decomposition table complete and evidence-bound
- [x] Skip mode: continuing to implementation without user confirmation
