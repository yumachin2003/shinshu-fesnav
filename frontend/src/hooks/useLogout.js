import { useContext } from 'react';
import { UserContext } from '../App';

export const useLogout = () => {
  const { setUser } = useContext(UserContext);

  const logout = () => {
    const confirmed = window.confirm("本当にログアウトしますか？");
    if (confirmed) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = "/";
    }
  };

  return logout;
};