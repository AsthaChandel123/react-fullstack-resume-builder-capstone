import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from '../../firebase/config';
import { ensureAuth } from '../../firebase/autoAuth';
import { DEMO_BANNER_TEXT } from '../demoData';
import type { MatchSignal, BridgeCriteria } from '../types';

interface EmployerReplyData {
  message: string;
  sentAt: unknown;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700',
  viewed: 'bg-blue-100 text-blue-800',
  replied: 'bg-green-100 text-green-800',
};

export default function CandidateDashboard() {
  const [matches, setMatches] = useState<MatchSignal[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobTitles, setJobTitles] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, EmployerReplyData>>({});
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError('Firebase not configured. Set VITE_FIREBASE_* env vars.');
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    ensureAuth().then(user => {
      if (!user) { setError('Could not connect.'); setLoading(false); return; }

      const db = getDb();
      const q = query(
        collection(db, 'matches'),
        where('candidateId', '==', user.uid)
      );

      unsub = onSnapshot(q, async (snap) => {
      let data = snap.docs.map((d) => ({ ...d.data(), matchId: d.id } as MatchSignal));

      // When the user has no real applications yet, fall back to the live
      // demo dataset (isDemo:true docs that any signed-in user can read).
      // This keeps the dashboard lively without inventing client-side data.
      if (data.length === 0) {
        try {
          const demoSnap = await getDocs(
            query(
              collection(db, 'matches'),
              where('isDemo', '==', true),
              where('demoRole', '==', 'candidate'),
            ),
          );
          data = demoSnap.docs.map((d) => ({ ...d.data(), matchId: d.id } as MatchSignal));
          setIsDemoMode(true);
        } catch {
          // Demo fetch failed silently — dashboard renders empty.
        }
      } else {
        setIsDemoMode(false);
      }
      setMatches(data);
      setLoading(false);

      // Fetch job titles for unique criteria codes
      const codes = [...new Set(data.map((m) => m.criteriaCode))];
      const titles: Record<string, string> = {};
      await Promise.all(
        codes.map(async (code) => {
          if (jobTitles[code]) { titles[code] = jobTitles[code]; return; }
          try {
            const criteriaDoc = await getDoc(doc(db, 'criteria', code));
            if (criteriaDoc.exists()) {
              titles[code] = (criteriaDoc.data() as BridgeCriteria).jobTitle;
            } else {
              titles[code] = code;
            }
          } catch {
            titles[code] = code;
          }
        })
      );
      setJobTitles((prev) => ({ ...prev, ...titles }));

      // Fetch replies for matches with replied status
      const repliedMatches = data.filter((m) => m.status === 'replied');
      const replyData: Record<string, EmployerReplyData> = {};
      await Promise.all(
        repliedMatches.map(async (m) => {
          if (replies[m.matchId]) { replyData[m.matchId] = replies[m.matchId]; return; }
          try {
            const repliesSnap = await getDocs(
              query(collection(db, 'replies'), where('matchId', '==', m.matchId))
            );
            if (!repliesSnap.empty) {
              const r = repliesSnap.docs[0].data() as EmployerReplyData;
              replyData[m.matchId] = r;
            }
          } catch {
            // Reply fetch failed silently
          }
        })
      );
      setReplies((prev) => ({ ...prev, ...replyData }));
      }, (err) => {
        setError(err.message);
        setLoading(false);
      });
    });

    return () => { unsub?.(); };
  }, []);

  const gapColor = (gap: number) => {
    if (gap > 5) return 'text-green-700';
    if (gap < -15) return 'text-red-700';
    return 'text-gray-700';
  };

  const formatDate = (d: unknown): string => {
    if (!d) return '';
    let date: Date;
    if (d instanceof Date) {
      date = d;
    } else if (typeof d === 'object' && d !== null && typeof (d as { toDate?: unknown }).toDate === 'function') {
      // Firestore Timestamp
      date = (d as { toDate: () => Date }).toDate();
    } else {
      date = new Date(d as string | number);
    }
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-label="Loading applications">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="sr-only">Loading applications</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6" role="alert">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  // matches / jobTitles / replies are all sourced live from Firestore now;
  // when isDemoMode is true the records came from isDemo:true docs.
  const displayMatches = matches;
  const displayJobTitles = jobTitles;
  const displayReplies = replies;

  if (displayMatches.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h2 className="text-xl font-bold mb-2">No match signals sent yet</h2>
        <p className="text-gray-500 mb-6">
          Complete a Bridge assessment to send your verified scores to employers.
        </p>
        <a
          href="/"
          className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 text-sm font-medium"
        >
          Back to Resume Builder
        </a>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">My Applications</h2>
        <a
          href="/"
          className="text-sm text-blue-600 hover:text-blue-800 underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Back to Resume Builder
        </a>
      </div>

      {isDemoMode && (
        <div
          role="note"
          aria-label="Sample data notice"
          className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <strong className="font-semibold">Sample data.</strong> {DEMO_BANNER_TEXT}
        </div>
      )}

      <div className="space-y-4">
        {displayMatches.map((m) => (
          <article
            key={m.matchId}
            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
            aria-label={`Application for ${displayJobTitles[m.criteriaCode] || m.criteriaCode}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-base">{displayJobTitles[m.criteriaCode] || m.criteriaCode}</h3>
                <p className="text-xs text-gray-500">Sent {formatDate(m.sentAt)}</p>
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs capitalize font-medium ${STATUS_STYLES[m.status] || STATUS_STYLES.pending}`}>
                {m.status}
              </span>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Resume</div>
                <div className="font-bold text-lg">{Math.round(m.resumeScore)}</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Verified</div>
                <div className="font-bold text-lg">{Math.round(m.verifiedScore)}</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Integrity</div>
                <div className="font-bold text-lg">{Math.round(m.integrityScore)}</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Gap</div>
                <div className={`font-bold text-lg ${gapColor(m.gap)}`}>
                  {m.gap > 0 ? '+' : ''}{Math.round(m.gap)}
                </div>
              </div>
            </div>

            {/* Threshold */}
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className={`inline-block w-2 h-2 rounded-full ${m.meetsThreshold ? 'bg-green-500' : 'bg-red-400'}`} aria-hidden="true" />
              <span className={m.meetsThreshold ? 'text-green-700' : 'text-red-600'}>
                {m.meetsThreshold ? 'Meets threshold' : 'Below threshold'}
              </span>
            </div>

            {/* Employer Reply */}
            {displayReplies[m.matchId] && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs font-medium text-green-800 mb-1">Employer Reply</div>
                <p className="text-sm text-green-900 whitespace-pre-wrap">{displayReplies[m.matchId].message}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
    </>
  );
}
