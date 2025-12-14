import React from "react";

export interface UserInfoProps {
  name: string;
  avatarUrl?: string;
}

export const UserInfo = ({ name, avatarUrl }: UserInfoProps) => (
  <div className="flex items-center gap-2">
    {avatarUrl && (
      <img
        src={avatarUrl}
        alt={name}
        className="w-8 h-8 rounded-full border"
      />
    )}
    <span className="font-medium text-gray-800">{name}</span>
  </div>
);
