import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * One labeled input for the auth forms - a leading icon (matches the
 * reference direction: email/lock glyphs inside the field) and an
 * optional trailing slot (the password show/hide toggle). Same
 * border/panel treatment as every other text input in this app
 * (InvestmentForm's INPUT_CLASSNAME etc.), just with room carved out on
 * either side for those icons.
 */
export default function AuthField({
  label,
  labelAction,
  icon,
  trailing,
  error,
  className = "",
  ...inputProps
}: {
  label: string;
  labelAction?: ReactNode;
  icon: ReactNode;
  trailing?: ReactNode;
  error?: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-xs uppercase tracking-wide text-cream-dim">{label}</span>
        {labelAction}
      </div>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 flex text-cream-dim">{icon}</span>
        <input
          {...inputProps}
          className={`w-full border bg-panel/60 py-2.5 pl-9 font-sans text-sm text-cream placeholder:text-cream-dim/50 focus:outline-none ${
            trailing ? "pr-9" : "pr-3"
          } ${error ? "border-[#f87171]/60 focus:border-[#f87171]" : "border-grid-line focus:border-gold/50"}`}
        />
        {trailing && <span className="absolute right-3 flex">{trailing}</span>}
      </div>
      {error && <span className="font-sans text-xs text-[#f87171]">{error}</span>}
    </label>
  );
}
