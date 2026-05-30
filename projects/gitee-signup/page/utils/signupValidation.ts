export interface SignupFields {
  name: string;
  namespace: string;
  phone: string;
  password: string;
  acceptedTerms: boolean;
}

export type SignupFieldName = keyof SignupFields;

export type SignupErrors = Partial<Record<SignupFieldName, string>>;

export function validateSignupFields(fields: SignupFields): SignupErrors {
  const errors: SignupErrors = {};

  if (fields.name.trim().length === 0) {
    errors.name = "姓名为必填项";
  }

  if (fields.namespace.trim().length === 0) {
    errors.namespace = "个人空间地址为必填项";
  }

  if (fields.phone.trim().length === 0) {
    errors.phone = "手机号码为必填项";
  }

  if (fields.password.trim().length < 8) {
    errors.password = "密码长度不得低于8个字符";
  }

  if (!fields.acceptedTerms) {
    errors.acceptedTerms = "请先阅读并同意使用条款";
  }

  return errors;
}

export function getFirstInvalidField(fields: SignupFields): SignupFieldName | undefined {
  const errors = validateSignupFields(fields);
  return (["name", "namespace", "phone", "password", "acceptedTerms"] as SignupFieldName[]).find(
    (field) => Boolean(errors[field]),
  );
}
