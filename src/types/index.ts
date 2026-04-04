export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'direct' | 'toast';
  sender: { _id: string; username: string; email: string };
  recipient: string | null;
  isRead: boolean;
  isToastShown: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
