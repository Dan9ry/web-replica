# Gitee Signup Replica Spec

## Scope

- Page scope: Gitee signup page form and surrounding two-column auth layout.
- State scope: initial signup form, required prompts after blur, signup button validation state.
- Function scope: name input, personal namespace input, phone/account input, password input, terms checkbox, signup button, local validation messages.
- Non-goals: no real Gitee signup API, SMS/email verification, OAuth login, captcha solving, or storage/submission of real personal information.

## Route And Runtime

- Replica route: `/replica/gitee-signup`
- Planned local URL: `http://127.0.0.1:5173/replica/gitee-signup`
- Source files: `projects/gitee-signup/page/`
- Stack: React + TypeScript + CSS Modules
- Evaluation target config: `projects/gitee-signup/config/target.json`
- Evaluation mode: Phase 6 uses Phase 3 baselines only.
- Acceptance thresholds: total >= 90, functionality >= 90, interaction >= 90, visual >= 90.

## Source Evidence

| State | Top | Middle | Bottom | DOM/notes |
| --- | --- | --- | --- | --- |
| Signup initial | `baselines/signup-initial/original-top.png` | `baselines/signup-initial/original-middle.png` | `baselines/signup-initial/original-bottom.png` | `baselines/signup-initial/original-dom.json`, `baselines/signup-initial/capture-notes.md` |
| Required blur prompts | `baselines/signup-blur-required/original-top.png` | `baselines/signup-blur-required/original-middle.png` | `baselines/signup-blur-required/original-bottom.png` | `baselines/signup-blur-required/original-dom.json`, `baselines/signup-blur-required/capture-notes.md` |
| Submit validation | `baselines/signup-submit-validation/original-top.png` | `baselines/signup-submit-validation/original-middle.png` | `baselines/signup-submit-validation/original-bottom.png` | `baselines/signup-submit-validation/original-dom.json`, `baselines/signup-submit-validation/capture-notes.md` |

All required states have head/top, middle, and footer/bottom captures. Sensitive account-page capture only recorded visible form metadata and visible UI evidence.

## Region And Component Decomposition

| Area/region | Source state and screenshot evidence | Key elements | Visual requirements | Interaction requirements | Implementation component/file |
| --- | --- | --- | --- | --- | --- |
| Auth shell | All states: `original-top.png` | centered white card, left blue testimonial panel, right signup form, footer links, background illustrations | 1000px-ish card, blue-gray left panel with dotted pattern, white form panel, pale page background | inert local links only | `GiteeSignupReplicaPage.tsx`, `GiteeSignupReplicaPage.module.css` |
| Left promo panel | Initial: `original-top.png` | red Gitee logo mark, `gitee`, headline, testimonial text, enterprise link | dark blue-gray background, white text, subtle geometric dots | no core interaction | `components/PromoPanel.tsx` |
| Form header | Initial: `original-top.png` | title `注册`, `已有帐号？点此登录` | strong title, small login link aligned right | login link inert | `components/SignupForm.tsx` |
| Name input | Blur state: `original-top.png` | placeholder `姓名`, red required border/message | 360px input, red border/message after blur or submit | blur empty shows `姓名为必填项` | `components/SignupField.tsx`, `hooks/useSignupForm.ts` |
| Namespace input | Blur state: `original-top.png` | prefix `https://gitee.com/`, placeholder `个人空间地址`, AI/help icons | two-part input row, prefix box, red state after blur | blur empty shows `个人空间地址为必填项` | `components/NamespaceField.tsx`, `hooks/useSignupForm.ts` |
| Phone input | Blur state: `original-top.png` | placeholder `请输入手机号码` | same input rhythm | blur empty shows `手机号码为必填项` | `components/SignupField.tsx`, `hooks/useSignupForm.ts` |
| Password input | Blur state: `original-top.png` | placeholder `密码不少于8位`, eye icon | same input rhythm with right eye icon | blur empty or short shows `密码长度不得低于8个字符` | `components/SignupField.tsx`, `hooks/useSignupForm.ts` |
| Terms and submit | All states | checkbox, terms links, orange `立即注册` button | compact checkbox row, full-width orange button | button click triggers local validation; no network call | `components/SignupForm.tsx`, `hooks/useSignupForm.ts` |
| Native submit tooltip | Submit validation: `original-top.png` | browser-like tooltip `请填写此字段。` near first field | small tooltip with orange icon and caret | shown locally on submit when first field empty | `components/NativePrompt.tsx` |
| Third-party login row | All states | divider, other login icons | small circular icons below form | inert local buttons | `components/SocialLoginRow.tsx` |

## Implementation Strategy

1. Register `/replica/gitee-signup` in `src/App.tsx` and import the project-local page component.
2. Keep all replica source under `projects/gitee-signup/page/`.
3. Build controlled form state with local validation:
   - empty blur marks a field as touched and shows its required message;
   - submit marks fields, shows first-field native-like prompt, and keeps request local.
4. Recreate the two-column desktop auth layout with DOM/CSS, not screenshot backgrounds.
5. Run tests/build, verify interactions, then run current-project evaluator:

```bash
EVAL_TARGET_CONFIG=projects/gitee-signup/config/target.json npm run eval
```

## Phase 4 Checkpoint

- [x] `spec.md` drafted
- [x] State-to-baseline mapping complete
- [x] Source screenshots/baselines listed with implementation strategy
- [x] Region/component decomposition table complete and evidence-bound
- [x] Skip mode: continuing to implementation without user confirmation
