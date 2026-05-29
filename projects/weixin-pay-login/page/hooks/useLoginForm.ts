import { type FormEvent, useMemo, useState } from "react";
import { validateLoginFields } from "../utils/loginValidation";

const captchaVariants = ["SLDA", "RFBQ", "NWXY", "HMYX"];

export function useLoginForm(initialSubmitted = false) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [captchaIndex, setCaptchaIndex] = useState(initialSubmitted ? 1 : 0);

  const validation = useMemo(
    () => validateLoginFields({ username, password, captcha }),
    [captcha, password, username],
  );
  const message = submitted ? validation.message : "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  function refreshCaptcha() {
    setCaptchaIndex((current) => (current + 1) % captchaVariants.length);
  }

  return {
    captcha,
    captchaText: captchaVariants[captchaIndex],
    message,
    password,
    setCaptcha,
    setPassword,
    setUsername,
    submit,
    username,
    refreshCaptcha,
  };
}
