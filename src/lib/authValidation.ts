const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthInput(emailValue: string, password: string) {
  const email = emailValue.trim().toLocaleLowerCase("vi");
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Email không hợp lệ.");
  }
  if (password.length < 8) {
    throw new Error("Mật khẩu phải có ít nhất 8 ký tự.");
  }
  return { email, password };
}
