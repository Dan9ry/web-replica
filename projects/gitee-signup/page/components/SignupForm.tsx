import { NativePrompt } from "./NativePrompt";
import { NamespaceField } from "./NamespaceField";
import { SignupField } from "./SignupField";
import { SocialLoginRow } from "./SocialLoginRow";
import { useSignupForm } from "../hooks/useSignupForm";
import styles from "../GiteeSignupReplicaPage.module.css";

interface SignupFormProps {
  initialState?: "initial" | "blur" | "submit";
}

export function SignupForm({ initialState = "initial" }: SignupFormProps) {
  const form = useSignupForm(initialState);

  return (
    <section className={styles.formPanel}>
      <header className={styles.formHeader}>
        <h1>注册</h1>
        <p>
          已有帐号？ <a href="#login">点此登录</a>
        </p>
      </header>
      <form onSubmit={form.submit} noValidate>
        <div className={styles.relativeField}>
          <SignupField
            field="name"
            placeholder="姓名"
            value={form.fields.name}
            error={form.errors.name}
            showError={form.shouldShowError("name")}
            onBlur={form.blurField}
            onChange={form.updateField}
          />
          <NativePrompt show={form.firstInvalid === "name"} />
        </div>
        <NamespaceField
          value={form.fields.namespace}
          error={form.errors.namespace}
          showError={form.shouldShowError("namespace")}
          onBlur={form.blurField}
          onChange={form.updateField}
        />
        <SignupField
          field="phone"
          placeholder="请输入手机号码"
          value={form.fields.phone}
          error={form.errors.phone}
          showError={form.shouldShowError("phone")}
          onBlur={form.blurField}
          onChange={form.updateField}
        />
        <SignupField
          field="password"
          type="password"
          placeholder="密码不少于8位"
          value={form.fields.password}
          error={form.errors.password}
          showError={form.shouldShowError("password")}
          onBlur={form.blurField}
          onChange={form.updateField}
          withEye
        />
        <label className={styles.termsRow}>
          <input
            name="accept_term"
            type="checkbox"
            checked={form.fields.acceptedTerms}
            onBlur={() => form.blurField("acceptedTerms")}
            onChange={(event) => form.updateField("acceptedTerms", event.target.checked)}
          />
          <span>
            我已阅读并同意 <a href="#terms">使用条款</a> 及{" "}
            <a href="#inactive">非活跃帐号处理规范</a>
          </span>
        </label>
        {form.firstInvalid === "acceptedTerms" ? (
          <p className={styles.termsError}>{form.errors.acceptedTerms}</p>
        ) : null}
        <button className={styles.submitButton} type="submit">
          立即注册
        </button>
      </form>
      <SocialLoginRow />
    </section>
  );
}
