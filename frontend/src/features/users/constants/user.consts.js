export const EMPTY_USER_FORM = Object.freeze({
  displayName: "",
  email: "",
  password: "",
  role: "user",
});

export const USER_ROLE_OPTIONS = Object.freeze([
  { label: "Usuario", value: "user" },
  { label: "Administrador", value: "admin" },
]);

export const USER_STATUS = Object.freeze({
  active: "active",
  disabled: "disabled",
});
