import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Avatar,
  Grid,
} from "@mui/material";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      if (!isFirstLogin) setIsFirstLogin(true);

      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error in component:", error);
      setError(
        error.message ||
          "Something went wrong. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(-45deg, #ff9a9e, #fad0c4, #fad0c4, #a18cd1, #fbc2eb, #84fab0, #8fd3f4)",
        backgroundSize: "400% 400%",
        animation: "gradientBG 15s ease infinite",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        "@keyframes gradientBG": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={8}
          sx={{
            borderRadius: 5,
            overflow: "hidden",
            display: "flex",
            minHeight: { xs: "auto", md: 500 },
          }}
        >
          {/* Left Side (Banner) */}
          <Grid
            item
            xs={false}
            md={6}
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              p: 4,
              background:
                "linear-gradient(135deg, rgba(102,126,234,0.9), rgba(118,75,162,0.9))",
              color: "white",
              textAlign: "center",
            }}
          >
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome to QMS 🚀
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 300 }}>
              Manage your Quality Management System with ease.  
              Sign in to access the dashboard and explore insights.
            </Typography>
          </Grid>

          {/* Right Side (Form) */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              p: 5,
              backdropFilter: "blur(10px)",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box textAlign="center" mb={3}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 60,
                  height: 60,
                  margin: "0 auto",
                  mb: 2,
                }}
              >
                <LockOutlined fontSize="large" />
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                Sign in to your account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your credentials to continue
              </Typography>
            </Box>

            {isFirstLogin && (
              <Alert severity="info" sx={{ mb: 2 }}>
                First login detected. Creating admin user...
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    transition: "0.3s",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    transition: "0.3s",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.4,
                  fontSize: "1rem",
                  borderRadius: 3,
                  textTransform: "none",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Sign In"}
              </Button>
            </Box>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
