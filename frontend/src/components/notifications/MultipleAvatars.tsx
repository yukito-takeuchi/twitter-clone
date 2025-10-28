"use client";

import { Box, Avatar, AvatarGroup } from "@mui/material";

interface MultipleAvatarsProps {
  users: Array<{
    username: string;
    display_name: string;
    avatar_url?: string;
  }>;
  max?: number; // Maximum number of avatars to show
}

export default function MultipleAvatars({ users, max = 3 }: MultipleAvatarsProps) {
  if (users.length === 0) return null;

  // Show up to max avatars, with a +N indicator for the rest
  return (
    <AvatarGroup
      max={max}
      sx={{
        "& .MuiAvatar-root": {
          width: 40,
          height: 40,
          fontSize: "14px",
          border: "2px solid white",
        },
        "& .MuiAvatarGroup-avatar": {
          width: 40,
          height: 40,
          fontSize: "14px",
          bgcolor: "rgb(29, 155, 240)",
          fontWeight: "bold",
        },
      }}
    >
      {users.map((user, index) => (
        <Avatar
          key={`${user.username}-${index}`}
          alt={user.display_name}
          src={user.avatar_url}
          sx={{
            bgcolor: !user.avatar_url ? `hsl(${index * 60}, 70%, 60%)` : undefined,
          }}
        >
          {!user.avatar_url && user.display_name?.[0]?.toUpperCase()}
        </Avatar>
      ))}
    </AvatarGroup>
  );
}
