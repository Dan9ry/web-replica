import { describe, expect, test } from "vitest";
import {
  getFirstInvalidField,
  validateSignupFields,
} from "../../projects/gitee-signup/page/utils/signupValidation";

describe("gitee signup validation", () => {
  test("returns source-like required messages for empty signup fields", () => {
    const result = validateSignupFields({
      name: "",
      namespace: "",
      phone: "",
      password: "",
      acceptedTerms: false,
    });

    expect(result.name).toBe("姓名为必填项");
    expect(result.namespace).toBe("个人空间地址为必填项");
    expect(result.phone).toBe("手机号码为必填项");
    expect(result.password).toBe("密码长度不得低于8个字符");
  });

  test("identifies the first invalid field for native-like submit prompt", () => {
    expect(
      getFirstInvalidField({
        name: "",
        namespace: "demo",
        phone: "13800138000",
        password: "password123",
        acceptedTerms: true,
      }),
    ).toBe("name");
  });
});
