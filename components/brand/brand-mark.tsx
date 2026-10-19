import { cn } from "@/lib/utils";
import Image from "next/image";

export const BRAND_TAGLINE =
  "La Place de marché virtuelle spécifique africaine";

/** Diarama logo followed by the tagline the client wants on every page. */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/logo.png"
        alt="Diarama"
        width={150}
        height={40}
        className="h-9 w-auto shrink-0"
        priority
      />
      <span className="border-l border-slate-200 pl-3 text-xs leading-tight font-semibold text-slate-600">
        {BRAND_TAGLINE}
      </span>
    </div>
  );
}
