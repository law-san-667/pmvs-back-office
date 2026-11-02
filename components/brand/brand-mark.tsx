import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";

/** Diarama logo followed by the tagline the client wants on every page. */
export default function BrandMark({ className }: { className?: string }) {
  const t = useTranslations("nav");
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
      <span className="border-s border-slate-200 ps-3 text-xs leading-tight font-semibold text-slate-600">
        {t("brand.tagline")}
      </span>
    </div>
  );
}
