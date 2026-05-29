export interface LoginFields {
  username: string;
  password: string;
  captcha: string;
}

export interface LoginValidationResult {
  canSubmit: boolean;
  message: string;
}

export function validateLoginFields(fields: LoginFields): LoginValidationResult {
  if (fields.username.trim().length === 0 || fields.password.trim().length === 0) {
    return {
      canSubmit: false,
      message: "请输入账号和密码",
    };
  }

  if (fields.captcha.trim().length === 0) {
    return {
      canSubmit: false,
      message: "请输入验证码",
    };
  }

  return {
    canSubmit: false,
    message: "当前为本地复刻演示，不会提交真实登录请求",
  };
}
