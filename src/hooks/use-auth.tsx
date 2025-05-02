
// 'use client';

// import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
// import { useRouter } from 'next/navigation';
// import { Loader2 } from 'lucide-react';

// interface User {
//   _id: string;
//   email: string;
//   name: string;
//   tokens: number;
//   // Add other user properties as needed
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const response = await fetch('/api/auth/me');
//         if (response.ok) {
//           const data = await response.json();
//           setUser(data.user);
//         } else {
//           setUser(null); // Ensure user is null if fetch fails or returns error
//         }
//       } catch (error) {
//         console.error('Failed to fetch user:', error);
//         setUser(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, []); // Run only once on mount

//   const logout = async () => {
//     try {
//       await fetch('/api/auth/logout', { method: 'POST' });
//       setUser(null);
//       router.push('/auth'); // Redirect to auth page after logout
//       router.refresh(); // Force refresh
//     } catch (error) {
//       console.error('Logout failed:', error);
//       // Handle logout error (e.g., show a toast)
//     }
//   };

//   if (loading) {
//     // Optional: Render a loading indicator fullscreen or within the layout
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="h-12 w-12 animate-spin text-primary" />
//       </div>
//     );
//   }

//   return (
//     <AuthContext.Provider value={{ user, loading, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }


// --- Authentication Disabled ---
import { createContext, useContext, ReactNode } from 'react';

// Define User interface even if unused, for potential future re-enablement
interface User {
  _id: string;
  email: string;
  name: string;
  tokens: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// Create context with default disabled values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false, // Assume not loading as auth is disabled
  logout: async () => { console.warn("Logout called while auth is disabled."); },
});

// Provider component that does nothing but render children
export function AuthProvider({ children }: { children: ReactNode }) {
  const disabledValue: AuthContextType = {
    user: null,
    loading: false,
    logout: async () => { console.warn("Logout called while auth is disabled."); },
  };

  return (
    <AuthContext.Provider value={disabledValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook returns the disabled context value
export function useAuth() {
  // No need to check for undefined context as we provide a default
  return useContext(AuthContext);
}
