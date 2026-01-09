import { DecorativePaw } from '@/components/icons/PawIcons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginUser } from '@/services/localStorage';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = loginUser(email, password);

      if (!user) {
        setError('Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Successfully logged in
      navigate('/');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 opacity-5">
        <DecorativePaw className="w-32 h-32 text-primary" />
      </div>
      <div className="absolute bottom-20 right-10 opacity-5 rotate-45">
        <DecorativePaw className="w-24 h-24 text-accent" />
      </div>
      <div className="absolute top-1/2 right-20 opacity-5 -rotate-12">
        <DecorativePaw className="w-16 h-16 text-secondary" />
      </div>

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="flex items-center gap-2">
            <DecorativePaw className="w-8 h-8 text-primary" />
            <span className="text-xl font-display font-bold text-foreground">
              Pawcation
            </span>
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md">
          <div className="bg-card border rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Welcome Back! 🐾
              </h1>
              <p className="text-muted-foreground">
                Log in to continue your paw-some journey
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="paw"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer tagline */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center bg-gradient-to-t from-background to-transparent">
        <p className="text-sm text-muted-foreground">
          🐶 Paw-tested. Human-assisted.
        </p>
      </footer>
    </div>
  );
}
