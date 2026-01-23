import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  user_id: number;
  email: string;
  name?: string;
  avatar_url?: string;
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
  updateUser: (userData: Partial<User>) => void;
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
        const savedName = localStorage.getItem('userName');
        const savedAvatarUrl = localStorage.getItem('userAvatarUrl');
        
        if (savedUserId && savedEmail) {
          setUser({
            user_id: parseInt(savedUserId),
            email: savedEmail,
            name: savedName || undefined,
            avatar_url: savedAvatarUrl || undefined,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userAvatarUrl');
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
        name: data.name,
        avatar_url: data.avatar_url,
      };

      setUser(newUser);
      
      // 保存到localStorage
      localStorage.setItem('userId', String(newUser.user_id));
      localStorage.setItem('userEmail', newUser.email);
      if (newUser.name) localStorage.setItem('userName', newUser.name);
      // Only store avatar URL if it's not a base64 image to avoid quota errors
      if (newUser.avatar_url && !newUser.avatar_url.startsWith('data:') && newUser.avatar_url.length < 500) {
        localStorage.setItem('userAvatarUrl', newUser.avatar_url);
      }
      
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
        name: data.name,
        avatar_url: data.avatar_url,
      };

      setUser(newUser);
      
      // 保存到localStorage
      localStorage.setItem('userId', String(newUser.user_id));
      localStorage.setItem('userEmail', newUser.email);
      if (newUser.name) localStorage.setItem('userName', newUser.name);
      // Only store avatar URL if it's not a base64 image to avoid quota errors
      if (newUser.avatar_url && !newUser.avatar_url.startsWith('data:') && newUser.avatar_url.length < 500) {
        localStorage.setItem('userAvatarUrl', newUser.avatar_url);
      }
      
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
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatarUrl');
  };

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // 更新localStorage
      if (updatedUser.name) {
        localStorage.setItem('userName', updatedUser.name);
      } else {
        localStorage.removeItem('userName');
      }
      
      // Don't store large base64 images in localStorage - only store if it's a URL
      if (updatedUser.avatar_url) {
        // Only store if it's a reasonable size (not a base64 image)
        // Base64 images start with "data:" and are usually very large
        if (!updatedUser.avatar_url.startsWith('data:') && updatedUser.avatar_url.length < 500) {
          localStorage.setItem('userAvatarUrl', updatedUser.avatar_url);
        } else {
          // For base64 images, don't store in localStorage to avoid quota errors
          localStorage.removeItem('userAvatarUrl');
        }
      } else {
        localStorage.removeItem('userAvatarUrl');
      }
    }
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
    updateUser,
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