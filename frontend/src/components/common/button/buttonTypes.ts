export const ButtonVariant = {
  Primary: "primary",
  Secondary: "secondary",
  Danger: "danger",
  DangerOutline: "danger-outline",
} as const;

export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];
