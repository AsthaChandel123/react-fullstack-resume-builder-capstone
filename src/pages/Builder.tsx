import { ResumeForm } from '@/builder/components/ResumeForm';
import { LivePreview } from '@/builder/components/LivePreview';
import { AICoachPanel } from '@/builder/components/AICoachPanel';
import { downloadPDF } from '@/utils/pdf';
import { printResume } from '@/utils/print';
import { fillDemoResume } from '@/utils/demoData';

export function Builder() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col lg:flex-row">
      <div
        className="builder-form flex-1 overflow-y-auto lg:max-h-[calc(100vh-120px)]"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-end px-4 pt-3 no-print" data-no-print>
          <button
            type="button"
            onClick={fillDemoResume}
            className="min-h-[36px] rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
              background: 'var(--bg-surface)',
            }}
            aria-label="Fill form with demo resume data"
          >
            Fill Demo Resume
          </button>
        </div>
        <ResumeForm />
      </div>

      <div className="builder-preview w-full lg:sticky lg:top-0 lg:max-h-[calc(100vh-120px)] lg:w-[50%] lg:overflow-y-auto">
        <div className="space-y-4 p-4">
          <div className="no-print mb-2" data-no-print>
            <AICoachPanel />
          </div>
          <div className="flex gap-2 no-print" data-no-print>
            <button
              type="button"
              onClick={printResume}
              className="min-h-[44px] flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--accent-navy)' }}
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => downloadPDF()}
              className="min-h-[44px] flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--accent-red)' }}
            >
              Download PDF
            </button>
          </div>
          <LivePreview />
        </div>
      </div>
    </div>
  );
}
