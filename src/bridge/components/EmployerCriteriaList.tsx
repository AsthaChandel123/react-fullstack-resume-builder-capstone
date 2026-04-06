import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from '../../firebase/config';
import { ensureAuth } from '../../firebase/autoAuth';
import { Link } from 'react-router-dom';

interface CriteriaDoc {
  id: string;
  jobTitle: string;
  shortCode: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-amber-100 text-amber-800',
  closed: 'bg-gray-200 text-gray-600',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  closed: 'Closed',
};

export default function EmployerCriteriaList() {
  const [criteria, setCriteria] = useState<CriteriaDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError('Firebase not configured. Set VITE_FIREBASE_* env vars.');
      setLoading(false);
      return;
    }

    ensureAuth().then(user => {
      if (!user) {
        setError('Could not authenticate.');
        setLoading(false);
        return;
      }

      const db = getDb();
      const q = query(
        collection(db, 'criteria'),
        where('employerId', '==', user.uid),
      );

      getDocs(q).then(snap => {
        const docs: CriteriaDoc[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            jobTitle: data.jobTitle ?? 'Untitled',
            shortCode: data.shortCode ?? d.id,
            status: data.status ?? 'active',
            createdAt: data.createdAt ?? '',
          };
        });
        docs.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setCriteria(docs);
        setLoading(false);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load criteria.');
        setLoading(false);
      });
    });
  }, []);

  const updateStatus = useCallback(async (id: string, newStatus: 'active' | 'paused' | 'closed') => {
    setUpdatingId(id);
    try {
      const db = getDb();
      await updateDoc(doc(db, 'criteria', id), { status: newStatus });
      setCriteria(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const copyLink = useCallback(async (shortCode: string) => {
    const url = `${window.location.origin}/bridge/${shortCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(shortCode);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for insecure contexts
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(shortCode);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-label="Loading criteria">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="sr-only">Loading criteria</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6" role="alert">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (criteria.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">No criteria published yet</p>
        <Link
          to="/employer/publish"
          className="inline-block rounded bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-2 focus:outline-blue-500"
        >
          Publish Your First Criteria
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm" aria-label="Published criteria">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Job Title</th>
            <th className="px-4 py-3 text-left font-semibold">Short Code</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Created</th>
            <th className="px-4 py-3 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map(c => {
            const isUpdating = updatingId === c.id;
            return (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.jobTitle}</td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{c.shortCode}</code>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[c.status] || STATUS_BADGE.closed}`}>
                    {STATUS_LABEL[c.status] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => copyLink(c.shortCode)}
                      className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={`Copy link for ${c.jobTitle}`}
                    >
                      {copied === c.shortCode ? 'Copied!' : 'Copy Link'}
                    </button>

                    {/* Pause / Resume */}
                    {c.status === 'active' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(c.id, 'paused')}
                        className="px-3 py-1 rounded text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-amber-500"
                        aria-label={`Pause ${c.jobTitle}`}
                      >
                        {isUpdating ? 'Updating...' : 'Pause'}
                      </button>
                    )}
                    {c.status === 'paused' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(c.id, 'active')}
                        className="px-3 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-green-500"
                        aria-label={`Resume ${c.jobTitle}`}
                      >
                        {isUpdating ? 'Updating...' : 'Resume'}
                      </button>
                    )}

                    {/* Close */}
                    {c.status !== 'closed' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          if (window.confirm('Closing is permanent. Candidates will no longer be able to apply. Continue?')) {
                            updateStatus(c.id, 'closed');
                          }
                        }}
                        className="px-3 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-red-500"
                        aria-label={`Close ${c.jobTitle}`}
                      >
                        {isUpdating ? 'Updating...' : 'Close'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
