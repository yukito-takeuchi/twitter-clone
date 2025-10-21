'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Button, TextField, Typography, Container, Alert } from '@mui/material';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(email, password, username, displayName);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            𝕏
          </Typography>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            アカウントを作成
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="表示名"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            margin="normal"
            helperText="他のユーザーに表示される名前"
          />

          <TextField
            fullWidth
            label="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            margin="normal"
            helperText="@から始まるユニークなID（3-50文字、英数字とアンダースコアのみ）"
          />

          <TextField
            fullWidth
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
            autoComplete="new-password"
            helperText="6文字以上"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              fontSize: '16px',
            }}
          >
            {loading ? '登録中...' : 'アカウント作成'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              すでにアカウントをお持ちですか？{' '}
              <Link href="/login" style={{ color: '#1D9BF0', textDecoration: 'none' }}>
                ログイン
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
