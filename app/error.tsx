'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './not-found.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.errorCode}>Oops!</h1>
        <h2 className={styles.title}>Something went wrong</h2>
        <p className={styles.description}>
          An unexpected error has occurred. We've been notified and are looking into it.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            className={styles.actionBtn}
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
          >
            Try Again
          </button>
          <Link href="/" className={styles.actionBtn} style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'none' }}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
