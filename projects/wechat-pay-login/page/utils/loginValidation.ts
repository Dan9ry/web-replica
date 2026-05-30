export interface WechatPayLoginForm {
  username: string;
  password: string;
  captcha: string;
}

export function getWechatPayLoginError(form: WechatPayLoginForm): string | null {
  if (form.username.trim().length === 0) {
    return "请输入登录账号";
  }

  if (form.password.trim().length === 0) {
    return "请输入登录密码";
  }

  if (form.captcha.trim().length === 0) {
    return "请输入验证码";
  }

  return null;
}

export function shouldShowCaptchaFailure(form: WechatPayLoginForm): boolean {
  return getWechatPayLoginError(form) === null;
}

