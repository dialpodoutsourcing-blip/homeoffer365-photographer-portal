export const minimumPasswordLength = 8;

// Supabase's symbol requirement uses printable ASCII punctuation, not spaces
// or accented letters. Keep the displayed checks aligned with that setting.
function hasSymbol(password: string) {
  return Array.from(password).some((character) => {
    const code = character.charCodeAt(0);
    return (code >= 33 && code <= 47) || (code >= 58 && code <= 64)
      || (code >= 91 && code <= 96) || (code >= 123 && code <= 126);
  });
}

export function getPasswordRequirements(password: string) {
  return [
    { id: "length", label: "At least 8 characters", met: password.length >= minimumPasswordLength },
    { id: "lowercase", label: "One lowercase letter (a–z)", met: /[a-z]/.test(password) },
    { id: "uppercase", label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
    { id: "number", label: "One number (0–9)", met: /[0-9]/.test(password) },
    { id: "symbol", label: "One special character, such as !, @, or #", met: hasSymbol(password) },
  ];
}

export function isValidNewPassword(password: string) {
  return getPasswordRequirements(password).every((requirement) => requirement.met);
}
