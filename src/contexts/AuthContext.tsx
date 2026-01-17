import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  user_id: number;
  email: string;
}

interface AuthContextType {
  // 状态
  user: User | null;
  userId: number | null;
  email: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // 方法
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化: 检查localStorage中是否有保存的用户信息
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUserId = localStorage.getItem('userId');
        const savedEmail = localStorage.getItem('userEmail');
        
        if (savedUserId && savedEmail) {
          setUser({
            user_id: parseInt(savedUserId),
            email: savedEmail,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      const newUser = {
        user_id: data.user_id,
        email: data.email,
      };

      setUser(newUser);
      
      // 保存到localStorage
      localStorage.setItem('userId', String(newUser.user_id));
      localStorage.setItem('userEmail', newUser.email);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const signup = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();
      const newUser = {
        user_id: data.user_id,
        email: data.email,
      };

      setUser(newUser);
      
      // 保存到localStorage
      localStorage.setItem('userId', String(newUser.user_id));
      localStorage.setItem('userEmail', newUser.email);
      
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
  };

  const value: AuthContextType = {
    user,
    userId: user?.user_id ?? null,
    email: user?.email ?? null,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};