"use client";

import cx from "classnames";
import Image from "next/image";

interface XperienceLogoProps {
  className?: string;
  width?: number;
  height?: number;
  withText?: boolean;
}

export function XperienceLogo({
  className,
  width = 130,
  height = 36,
  withText = false,
}: XperienceLogoProps) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      {/* Imagem no modo claro */}
      <Image
        src="/images/xperience-logo.svg"
        alt="Xperience Hubs"
        width={width}
        height={height}
        className="block dark:hidden max-h-8 size-auto"
        priority
      />
      {/* Imagem no modo escuro */}
      <Image
        src="/images/xperience-logo-white.svg"
        alt="Xperience Hubs"
        width={width}
        height={height}
        className="hidden dark:block max-h-8 size-auto"
        priority
      />
      {withText && (
        <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
          Xperience Hubs
        </span>
      )}
    </div>
  );
}

