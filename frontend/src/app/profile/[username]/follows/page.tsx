"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import UserCard from "@/components/users/UserCard";
import { userApi, followApi } from "@/lib/api";
import type { User, UserWithProfile } from "@/types";

export default function FollowsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Data for each tab
  const [mutualFollows, setMutualFollows] = useState<UserWithProfile[]>([]);
  const [followers, setFollowers] = useState<UserWithProfile[]>([]);
  const [following, setFollowing] = useState<UserWithProfile[]>([]);

  // Get initial tab from query parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "mutual") setTabValue(0);
    else if (tab === "followers") setTabValue(1);
    else if (tab === "following") setTabValue(2);
  }, [searchParams]);

  useEffect(() => {
    if (username) {
      fetchUserAndFollows();
    }
  }, [username]);

  const fetchUserAndFollows = async () => {
    try {
      setLoading(true);

      // Fetch user data
      const userData = await userApi.getByUsername(username);
      setUser(userData.user);

      // Fetch all follow data with currentUserId for is_following flag
      const [mutualData, followersData, followingData] = await Promise.all([
        followApi.getMutualFollows(userData.user.id, 100, 0, currentUser?.id),
        followApi.getFollowers(userData.user.id, 100, 0, currentUser?.id),
        followApi.getFollowing(userData.user.id, 100, 0, currentUser?.id),
      ]);

      // Transform data to UserWithProfile format
      const transformUser = (item: any): UserWithProfile => ({
        id: item.id,
        username: item.username,
        display_name: item.display_name,
        avatar_url: item.avatar_url,
        bio: item.bio,
        is_following: item.is_following,
      });

      setMutualFollows((mutualData.mutual_follows || []).map(transformUser));
      setFollowers(followersData.followers.map(transformUser));
      setFollowing(followingData.following.map(transformUser));
    } catch (error) {
      console.error("Failed to fetch follows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Update URL query parameter
    const tabNames = ["mutual", "followers", "following"];
    router.push(`/profile/${username}/follows?tab=${tabNames[newValue]}`);
  };

  const getCurrentTabData = () => {
    if (tabValue === 0) return mutualFollows;
    if (tabValue === 1) return followers;
    return following;
  };

  const getCurrentTabLabel = () => {
    if (tabValue === 0) return "認証済みフォロワー";
    if (tabValue === 1) return "フォロワー";
    return "フォロー中";
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography>ユーザーが見つかりません</Typography>
        </Box>
      </MainLayout>
    );
  }

  const currentData = getCurrentTabData();

  return (
    <MainLayout>
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
          bgcolor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(0, 0, 0, 0.8)",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            gap: 2,
            width: "100%",
          }}
        >
          <IconButton onClick={() => router.back()}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {user.display_name || user.username}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              @{user.username}
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            width: "100%",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: "bold",
              minWidth: 100,
              flex: 1,
            },
          }}
        >
          <Tab label="認証済みフォロワー" />
          <Tab label="フォロワー" />
          <Tab label="フォロー中" />
        </Tabs>
      </Box>

      {/* User List */}
      <Box>
        {currentData.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" sx={{ color: "text.secondary" }}>
              {getCurrentTabLabel()}がいません
            </Typography>
          </Box>
        ) : (
          currentData.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onFollowChange={fetchUserAndFollows}
            />
          ))
        )}
      </Box>
    </MainLayout>
  );
}
