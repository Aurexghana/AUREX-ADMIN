"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme";

// The full "AUREX" lockup (icon + wordmark baked into one image, from
// Figma), one export per theme - moved here (out of AdminShell, its
// original and, until now, only caller) so the auth pages can share the
// exact same logo without duplicating this const or its reasoning.
//
// Exported at 4x (272x192 / 272x204, not the design frame's own native
// 68x48 / 68x51) since the frame's own size rendered blurry once scaled
// to fill actual device pixels on any HiDPI screen - Next's <Image>
// never upscales past a source's real resolution, so a too-small source
// just gets stretched by the browser instead. Each export carries its
// own natural pixel size (they aren't identical aspect ratios) so the
// <Image> below can be given real width/height and scaled by CSS height
// alone, undistorted.
//
// `unoptimized` - the source PNGs' own background was removed (see
// public/brand/ - Figma exported these with a flat white/near-black
// backing, not real transparency) by feathering alpha out to a
// transparent edge; Next's built-in image optimizer re-encodes PNGs
// through a palette/quantized pipeline that collapses that feathered
// edge back into a hard opaque box, undoing the removal. This is a
// small, fixed-size brand asset already exported at the exact resolution
// it's shown at, so skipping the optimizer (meant for resizing/format-
// negotiating arbitrary content images) costs nothing.
const LOGO = {
  light: { src: "/brand/logo-lockup-light.png", width: 272, height: 192 },
  dark: { src: "/brand/logo-lockup-dark.png", width: 272, height: 204 },
} as const;

/**
 * Swaps the logo lockup itself per theme rather than reusing one
 * icon-only mark in both - same reasoning as the main site's own
 * BrandMark: a mark tuned for one background reads wrong (or vanishes)
 * against the other once the theme toggle is switched.
 */
export default function BrandLogo({ className = "h-8 w-auto shrink-0" }: { className?: string }) {
  const { theme } = useTheme();
  const logo = LOGO[theme];
  return <Image src={logo.src} alt="AUREX" width={logo.width} height={logo.height} unoptimized className={className} />;
}
