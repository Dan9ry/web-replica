import { type FocusEvent, type FormEvent, useMemo, useState } from "react";
import {
  type SignupFieldName,
  type SignupFields,
  getFirstInvalidField,
  validateSignupFields,
} from "../utils/signupValidation";

const initialFields: SignupFields = {
  name: "",
  namespace: "",
  phone: "",
  password: "",
  acceptedTerms: false,
};

const validationFields: SignupFieldName[] = ["name", "namespace", "phone", "password"];

export function useSignupForm(initialState: "initial" | "blur" | "submit" = "initial") {
  const [fields, setFields] = useState(initialFields);
  const [touched, setTouched] = useState<Set<SignupFieldName>>(
    () => new Set(initialState === "blur" ? validationFields : []),
  );
  const [submitted, setSubmitted] = useState(initialState === "submit");
  const errors = useMemo(() => validateSignupFields(fields), [fields]);
  const firstInvalid = submitted ? getFirstInvalidField(fields) : undefined;

  function updateField(field: SignupFieldName, value: string | boolean) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  function markTouched(field: SignupFieldName) {
    setTouched((current) => new Set(current).add(field));
  }

  function blurField(field: SignupFieldName, event?: FocusEvent<HTMLInputElement>) {
    markTouched(field);
    event?.currentTarget.blur();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(new Set(["name", "namespace", "phone", "password", "acceptedTerms"]));
    setSubmitted(true);
  }

  function shouldShowError(field: SignupFieldName) {
    return touched.has(field) || submitted;
  }

  return {
    blurField,
    errors,
    fields,
    firstInvalid,
    shouldShowError,
    submit,
    updateField,
  };
}
