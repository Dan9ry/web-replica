import { describe, expect, it } from "vitest";
import {
  getWechatPayLoginError,
  shouldShowCaptchaFailure,
} from "../../projects/wechat-pay-login/page/utils/loginValidation";

describe("wechat pay login validation", () => {
  it("asks for missing account fields before local submit", () => {
    expect(
      getWechatPayLoginError({
        username: "",
        password: "",
        captcha: "",
      }),
    ).toBe("请输入登录账号");

    expect(
      getWechatPayLoginError({
        username: "merchant@example.com",
        password: "",
        captcha: "",
      }),
    ).toBe("请输入登录密码");
  });

  it("allows local submit only after all fields are filled, then shows captcha failure", () => {
    const form = {
      username: "merchant@example.com",
      password: "password123",
      captcha: "9K2P",
    };

    expect(getWechatPayLoginError(form)).toBeNull();
    expect(shouldShowCaptchaFailure(form)).toBe(true);
  });
});

