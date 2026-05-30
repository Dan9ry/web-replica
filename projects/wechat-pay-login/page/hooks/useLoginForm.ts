import { useMemo, useState } from "react";
import {
  getWechatPayLoginError,
  shouldShowCaptchaFailure,
  type WechatPayLoginForm,
} from "../utils/loginValidation";

const captchas = ["J7NW", "K6YM", "W9HN", "R2PW"];

export function useLoginForm() {
  const [form, setForm] = useState<WechatPayLoginForm>({
    username: "",
    password: "",
    captcha: "",
  });
  const [captchaIndex, setCaptchaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const captchaText = useMemo(() => captchas[captchaIndex % captchas.length], [captchaIndex]);

  function updateField(field: keyof WechatPayLoginForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) {
      setError(null);
    }
  }

  function refreshCaptcha() {
    setCaptchaIndex((current) => current + 1);
    setForm((current) => ({ ...current, captcha: "" }));
    setError(null);
  }

  function submit() {
    const validationError = getWechatPayLoginError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      if (shouldShowCaptchaFailure(form)) {
        setError("验证码错误，请重新输入");
      }
      setIsSubmitting(false);
    }, 520);
  }

  return {
    captchaText,
    error,
    form,
    isSubmitting,
    refreshCaptcha,
    submit,
    updateField,
  };
}

