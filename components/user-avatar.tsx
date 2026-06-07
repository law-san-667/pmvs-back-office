import { cn } from "@/lib/utils";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type UserAvatarProps = {
  className?: string;
  name: string;
  src?: string | null;
};

const UserAvatar: React.FC<UserAvatarProps> = ({ className, name, src }) => {
  return (
    <Avatar className={cn("relative h-8 w-8", className)}>
      <AvatarImage
        className="object-cover object-center"
        src={
          src ? src : `https://api.dicebear.com/8.x/initials/svg?seed=${name}`
        }
      />
      <AvatarFallback>MD</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
