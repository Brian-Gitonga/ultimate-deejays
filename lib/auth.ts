/* Form state and validation rules shared by the auth, account and challenge forms. */

/** A form field name; auth, account and challenge forms share these types. */
export type AuthField = string;

export type AuthFormState = {
  /** "notice" is a neutral message, e.g. a feature that isn't live yet */
  status: "idle" | "error" | "notice";
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string>>;
  /** Echoed back so the form keeps what was typed (passwords are never echoed) */
  values?: { name?: string; email?: string; remember?: boolean; [field: string]: string | boolean | undefined };
};

export const initialAuthState: AuthFormState = { status: "idle" };

export const PASSWORD_MIN_LENGTH = 8;

// Deliberately simple: the real check is the confirmation email your auth provider sends.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string) {
  if (!email) return "Enter your email address.";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return "Enter a valid email address, like name@example.com.";
}

export function validateNewPassword(password: string) {
  if (!password) return "Create a password.";
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > 128) return "Use 128 characters or fewer.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Include at least one letter and one number.";
}

export function validateName(name: string) {
  if (!name) return "Enter your name.";
  if (name.length < 2) return "Enter your full name.";
  if (name.length > 80) return "Use 80 characters or fewer.";
}

/** 0–4, for the sign-up strength meter */
export function passwordStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (/[a-z]/i.test(password) && /\d/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[^a-z0-9]/i.test(password) || password.length >= 14) score++;
  return score;
}
