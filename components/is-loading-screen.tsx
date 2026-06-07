import { cn } from "@/lib/utils";
import React from "react";
import { Spinner } from "./ui/spinner";

interface IsLoadingScreenProps {
  divClassName?: string;
  loaderClassName?: string;
  text?: string;
}

const IsLoadingScreen: React.FC<IsLoadingScreenProps> = ({
  divClassName,
  loaderClassName,
  text
}) => {
  return (
    <div
      className={cn(
        "flex h-svh w-full flex-col gap-2 items-center justify-center bg-white",
        divClassName,
      )}
    >
      <Spinner className={cn("text-primary size-6", loaderClassName)} />
      {text && (
        <p className="text-center text-muted-foreground text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

export default IsLoadingScreen;
