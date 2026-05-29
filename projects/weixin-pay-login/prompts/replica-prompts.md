# Replica Prompts

## Initial User Prompt

复刻网页，跳过用户确认：

- 网址：`https://pay.weixin.qq.com/index.php/core/home/login`
- 复刻范围：仅复刻用户名、密码、验证码输入区域，以及登录按钮的点击交互。

## Implementation Prompt Notes

- Implement only the confirmed requested form region and click interaction.
- Use React + TypeScript + CSS Modules.
- Keep all replica page source under `projects/weixin-pay-login/page/`.
- Do not call the real Weixin Pay login endpoint.
