'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Avatar,
  Typography,
} from '@mui/material';
import { Close, CameraAlt } from '@mui/icons-material';
import { User, Profile } from '@/types';
import ImageCropDialog from './ImageCropDialog';
import { imageApi, profileApi, userApi } from '@/lib/api';

interface ProfileEditDialogProps {
  open: boolean;
  user: User;
  profile: Profile;
  onClose: () => void;
  onSave: () => void;
}

export default function ProfileEditDialog({
  open,
  user,
  profile,
  onClose,
  onSave,
}: ProfileEditDialogProps) {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const [website, setWebsite] = useState(profile.website || '');

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [coverImageUrl, setCoverImageUrl] = useState(profile.cover_image_url || '');

  const [avatarFile, setAvatarFile] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<string | null>(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar');

  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setCropType(type);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    // Create File from Blob
    const file = new File([croppedImage], `${cropType}.jpg`, { type: 'image/jpeg' });

    if (cropType === 'avatar') {
      setAvatarFile(URL.createObjectURL(croppedImage));
    } else {
      setCoverFile(URL.createObjectURL(croppedImage));
    }

    setCropDialogOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;
      let newCoverUrl = coverImageUrl;

      // Upload avatar if changed
      if (avatarFile) {
        const blob = await fetch(avatarFile).then((r) => r.blob());
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        const urls = await imageApi.uploadImages([file], user.id);
        newAvatarUrl = urls[0];
      }

      // Upload cover if changed
      if (coverFile) {
        const blob = await fetch(coverFile).then((r) => r.blob());
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
        const urls = await imageApi.uploadImages([file], user.id);
        newCoverUrl = urls[0];
      }

      // Update profile
      await profileApi.update(user.id, {
        bio,
        location,
        website,
        avatar_url: newAvatarUrl,
        cover_image_url: newCoverUrl,
      });

      // Update display name if changed (User table)
      if (displayName !== user.display_name) {
        await userApi.update(user.id, { display_name: displayName });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            color: 'text.primary',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              プロフィールを編集
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderRadius: '9999px',
              textTransform: 'none',
              px: 3,
            }}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Cover Image */}
          <Box
            sx={{
              position: 'relative',
              height: 200,
              bgcolor: 'action.hover',
              backgroundImage: coverFile
                ? `url(${coverFile})`
                : coverImageUrl
                ? `url(${getImageUrl(coverImageUrl)})`
                : 'linear-gradient(to right, #1DA1F2, #14171A)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'cover')}
              style={{ display: 'none' }}
            />
            <IconButton
              onClick={handleCoverClick}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.8)',
                },
              }}
            >
              <CameraAlt />
            </IconButton>
          </Box>

          {/* Avatar */}
          <Box sx={{ px: 2, mt: -8 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'avatar')}
                style={{ display: 'none' }}
              />
              <Avatar
                src={avatarFile || (avatarUrl ? getImageUrl(avatarUrl) : undefined)}
                sx={{
                  width: 134,
                  height: 134,
                  border: '4px solid',
                  borderColor: 'background.default',
                  fontSize: '48px',
                }}
              >
                {!avatarFile && !avatarUrl && (user.display_name?.[0] || user.username[0])}
              </Avatar>
              <IconButton
                onClick={handleAvatarClick}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                  },
                }}
              >
                <CameraAlt />
              </IconButton>
            </Box>
          </Box>

          {/* Form Fields */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="名前"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              inputProps={{ maxLength: 50 }}
              helperText={`${displayName.length}/50`}
            />
            <TextField
              fullWidth
              label="自己紹介"
              multiline
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              inputProps={{ maxLength: 160 }}
              helperText={`${bio.length}/160`}
            />
            <TextField
              fullWidth
              label="場所"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              inputProps={{ maxLength: 30 }}
            />
            <TextField
              fullWidth
              label="Webサイト"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              inputProps={{ maxLength: 100 }}
              placeholder="https://example.com"
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={cropImageSrc}
        cropShape={cropType === 'avatar' ? 'round' : 'rect'}
        aspect={cropType === 'avatar' ? 1 : 16 / 9}
        onClose={() => setCropDialogOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
