import { describe, expect, test } from "vitest";
import { validateLoginFields } from "../../projects/weixin-pay-login/page/utils/loginValidation";

describe("weixin pay login validation", () => {
  test("requires username and password before local login submit can proceed", () => {
    expect(validateLoginFields({ username: "", password: "", captcha: "" })).toEqual({
      canSubmit: false,
      message: "请输入账号和密码",
    });
    expect(validateLoginFields({ username: "merchant", password: "", captcha: "ABCD" })).toEqual({
      canSubmit: false,
      message: "请输入账号和密码",
    });
  });

  test("requires verification code after account credentials are present", () => {
    expect(
      validateLoginFields({ username: "merchant", password: "secret", captcha: "" }),
    ).toEqual({
      canSubmit: false,
      message: "请输入验证码",
    });
  });
});
