import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getPosts } from '../api/posts';
import styles from './PostList.module.css';

const CATEGORIES = ['', 'General', 'Tech', 'Design', 'Business', 'Lifestyle'];

const LIMIT = 10;

export default function PostList() {
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(location.state?.toast || '');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    const params = { limit: LIMIT, offset: (page - 1) * LIMIT };
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;

    getPosts(params)
      .then(res => { setPosts(res.data); setTotal(res.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters, page]);

  function handleFilterChange(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}
      <div className={styles.header}>
        <h1>All Posts <span className={styles.count}>{total}</span></h1>
        <Link to="/create" className={styles.btn}>+ New Post</Link>
      </div>

      <div className={styles.filters}>
        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>
          <p>No posts found.</p>
          <Link to="/create">Create your first post</Link>
        </div>
      ) : (
        <>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th></th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td className={styles.thumbCell}>
                    {post.cover_image
                      ? <img src={post.cover_image} alt="" className={styles.thumb} />
                      : <div className={styles.thumbPlaceholder} />}
                  </td>
                  <td className={styles.title}>{post.title}</td>
                  <td>{post.author}</td>
                  <td><span className={styles.category}>{post.category}</span></td>
                  <td>
                    <span className={`${styles.badge} ${styles[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className={styles.date}>{new Date(post.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/posts/${post.id}`} className={styles.viewBtn}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
        </>
      )}
    </div>
  );
}
