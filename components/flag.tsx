import { cn } from "@/lib/utils";
import React from "react";
import { Country } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

type FlagProps = {
  country: Country;
  className?: string;
};

const Flag: React.FC<FlagProps> = ({ country, className }) => {
  const Flag = flags[country];

  return (
    <span className={cn("size-4", className)}>
      {Flag && <Flag title={country} />}
    </span>
  );
};

export default Flag;
