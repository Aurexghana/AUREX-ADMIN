import type { SVGProps } from "react";

/**
 * Small monochrome admin-UI icons - new to this repo (not part of the
 * imported design-system files from Step 0), since the main site's own
 * icon set (nav arrows, footer socials, FAQ chevron, trend indicators)
 * has no equivalents for admin actions like approve/reject/reorder/menu.
 * Same convention as the main site's components/icons.tsx: `currentColor`
 * so each icon inherits its button/label's own color, simple stroke-based
 * paths kept in the same visual weight throughout.
 */

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 8.5L6.2 11.7L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 7.4" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 7.4L0 1.4L1.4 0L6 4.6L10.6 0L12 1.4L6 7.4V7.4" fill="currentColor" />
    </svg>
  );
}

export function ArrowUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 11V1M6 1L1.5 5.5M6 1L10.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 1V11M6 11L1.5 6.5M6 11L10.5 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7 0L6.285 0.6965L10.075 4.5H0V5.5H10.075L6.285 9.2865L7 10L12 5L7 0Z" fill="currentColor" />
    </svg>
  );
}

export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M6 2.5h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M14 2.5v4h4M8 13h8M8 16.5h8M8 9.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10 13V3M10 3L6 7M10 3L14 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 13V15.5C3 16.3284 3.67157 17 4.5 17H15.5C16.3284 17 17 16.3284 17 15.5V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ZoomInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 6.5V11.5M6.5 9H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ZoomOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.5 9H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ExternalLinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8.5 4.5H4.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.5 3.5H16.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4L9.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 6H16M8 6V4.5C8 4.22386 8.22386 4 8.5 4H11.5C11.7761 4 12 4.22386 12 4.5V6M6 6L6.6 16.2C6.635 16.9 7.215 17.5 7.9 17.5H12.1C12.785 17.5 13.365 16.9 13.4 16.2L14 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function InboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M3 11.5L5 4.5C5.1 4.2 5.4 4 5.7 4H14.3C14.6 4 14.9 4.2 15 4.5L17 11.5V15C17 15.55 16.55 16 16 16H4C3.45 16 3 15.55 3 15V11.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M3 11.5H7.2C7.5 11.5 7.75 11.7 7.85 12L8.15 13C8.25 13.3 8.5 13.5 8.8 13.5H11.2C11.5 13.5 11.75 13.3 11.85 13L12.15 12C12.25 11.7 12.5 11.5 12.8 11.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="7.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 16C2.5 13.2386 4.73858 11 7.5 11C10.2614 11 12.5 13.2386 12.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13.5 11.1C15.85 11.4 17.5 13.4 17.5 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M10 2.5L18 6.5L10 10.5L2 6.5L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 10.5L10 14.5L18 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 14.5L10 18.5L18 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function CoinsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ellipse cx="7" cy="6" rx="4.5" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 6V14C2.5 15.38 4.5 16.5 7 16.5C9.5 16.5 11.5 15.38 11.5 14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 10C2.5 11.38 4.5 12.5 7 12.5C9.5 12.5 11.5 11.38 11.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="13.5" cy="9.5" rx="4" ry="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5V13.5C9.5 14.7 11.3 15.7 13.5 15.7C15.7 15.7 17.5 14.7 17.5 13.5V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2.5" y="6.5" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 6.5V4.5C7 3.94772 7.44772 3.5 8 3.5H12C12.5523 3.5 13 3.94772 13 4.5V6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 11H17.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 8V12L6 12.7V15.5C6 16.05 6.45 16.5 7 16.5C7.55 16.5 8 16.05 8 15.5V13.2L14 14.5V5.5L3 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M14 5.5C15.5 5.9 16.5 7.35 16.5 9C16.5 10.65 15.5 12.1 14 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M11.5 2.5L13.5 4.5L5 13L2 13.5L2.5 10.5L11 2L11.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 4L12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10 6C8.7 4.7 6.5 4 3 4.5V15C6.5 14.5 8.7 15.2 10 16.5C11.3 15.2 13.5 14.5 17 15V4.5C13.5 4 11.3 4.7 10 6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M10 6V16.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M10 2.5L18 16.5H2L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8V11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="4.5" width="14" height="12.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8H17" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 2.5V5.5M13.5 2.5V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7.5 17H4.5C3.94772 17 3.5 16.5523 3.5 16V4C3.5 3.44772 3.94772 3 4.5 3H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 13.5L17 10L13 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MoreVerticalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="4.5" r="1.4" />
      <circle cx="10" cy="10" r="1.4" />
      <circle cx="10" cy="15.5" r="1.4" />
    </svg>
  );
}

export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 14.5V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 2.5H11.5L9.3 5L11.5 7.5H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 5.5L10 11L16.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4" y="9" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 9V6.5C6.5 4.567 8.067 3 10 3C11.933 3 13.5 4.567 13.5 6.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="6.5" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 17C3.5 13.41 6.41 10.5 10 10.5C13.59 10.5 16.5 13.41 16.5 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function KeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="6.5" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.9 11.1L16.5 3.5M13.5 6.5L16 4M15 8.5L17.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M1.5 10C1.5 10 4.7 4 10 4C15.3 4 18.5 10 18.5 10C18.5 10 15.3 16 10 16C4.7 16 1.5 10 1.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M2.8 5.6C1.9 6.6 1.5 7.5 1.5 7.5C1.5 7.5 4.7 13.5 10 13.5C11 13.5 11.9 13.3 12.7 12.9M17.2 14.4C18.1 13.4 18.5 12.5 18.5 12.5C18.5 12.5 15.3 6.5 10 6.5C9.5 6.5 9 6.55 8.55 6.65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.2 9.2C7.9 9.6 7.7 10.1 7.7 10.6C7.7 11.87 8.73 12.9 10 12.9C10.55 12.9 11.05 12.7 11.45 12.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 2.5L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5 0L5.715 0.6965L1.925 4.5H12V5.5H1.925L5.715 9.2865L5 10L0 5L5 0Z" fill="currentColor" />
    </svg>
  );
}

export function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M18 10C18 5.58172 14.4183 2 10 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M3 10C3 6.13 6.13 3 10 3C13.87 3 17 6.13 17 10C17 13.87 13.87 17 10 17C8.7 17 7.47 16.65 6.42 16.03L3 17L3.97 13.58C3.35 12.53 3 11.3 3 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
