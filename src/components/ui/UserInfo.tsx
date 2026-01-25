import React from "react";

export interface UserInfoProps {
  name: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const UserInfo = ({ name }: UserInfoProps) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
      <span className="text-xs font-medium text-primary-foreground">
        {getInitials(name)}
      </span>
    </div>
    <span className="font-medium text-gray-800">{name}</span>
  </div>
);
