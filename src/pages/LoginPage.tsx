import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { PawIcon } from "@/components/icons/PawIcon";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password validation function
  const validatePassword = (pwd: string) => {
    if (mode === 'signup' && pwd.length > 0 && (pwd.length < 6 || pwd.length > 15)) {
      return 'Password must be between 6-15 characters';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    
    // Validate password for signup
    if (mode === 'signup') {
      const pwdError = validatePassword(password);
      if (pwdError) {
        setPasswordError(pwdError);
        return;
      }
    }
    
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/');  // 成功后跳转到主页
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async () => {
    setEmail('test@pawcation.com');
    setPassword('password123');
    setError('');
    setLoading(true);

    try {
      await login('test@pawcation.com', 'password123');
      navigate('/');
    } catch (err: any) {
      // If user doesn't exist, create it
      try {
        await signup('test@pawcation.com', 'password123');
        navigate('/');
      } catch (signupErr: any) {
        setError(signupErr.message || 'Quick login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-3"
            >
              <PawIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Pet-First Travel</span>
            </motion.div>
            <h1 className="text-3xl font-extrabold text-foreground mb-1">
              Pawcation
            </h1>
            <p className="text-muted-foreground text-sm">
              Plan the perfect trip with your furry friend
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl shadow-paw-lg p-5 border border-border">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
                  mode === 'login'
                    ? 'gradient-primary text-primary-foreground shadow-glow'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
                  mode === 'signup'
                    ? 'gradient-primary text-primary-foreground shadow-glow'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-10 bg-muted/50 border-border rounded-lg text-sm"
                    disabled={loading}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      if (newPassword.length <= 15) { // Prevent typing beyond 15 chars
                        setPassword(newPassword);
                        setPasswordError(validatePassword(newPassword));
                      }
                    }}
                    required
                    minLength={mode === 'signup' ? 6 : undefined}
                    maxLength={15}
                    className={`pl-9 h-10 bg-muted/50 border-border rounded-lg text-sm ${
                      passwordError ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    disabled={loading}
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">Password must be 6-15 characters long</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-semibold rounded-lg gradient-primary shadow-glow hover:opacity-90 transition-opacity mt-4"
              >
                {loading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <PawIcon className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">or</span>
              </div>
            </div>

            {/* Quick Login */}
            <Button
              type="button"
              variant="outline"
              onClick={quickLogin}
              disabled={loading}
              className="w-full h-10 rounded-lg border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-colors text-sm"
            >
              <PawIcon className="w-3 h-3 mr-2 text-primary" />
              Quick Demo Login
            </Button>
          </div>

          {/* Demo Info - 简化 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/50 rounded-lg border border-border/50">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Backend Ready</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}