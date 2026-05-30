import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearToken } from '../api/auth';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Blog Admin</span>
      <div className={styles.links}>
        <Link to="/" className={pathname === '/' ? styles.active : ''}>All Posts</Link>
        <Link to="/create" className={pathname === '/create' ? styles.active : ''}>New Post</Link>
        <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
