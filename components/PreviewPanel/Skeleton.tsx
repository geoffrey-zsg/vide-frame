interface SkeletonProps {
  error?: string;
}

export function Skeleton({ error }: SkeletonProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50/50">
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 max-w-md shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-700 font-bold mb-2 text-lg">渲染出错</p>
          <p className="text-red-600/80 text-sm whitespace-pre-wrap">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-50/30">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-slate-200 rounded-full animate-pulse w-1/3" />
            <div className="h-3 bg-slate-100 rounded-full animate-pulse w-1/4" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-full" />
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-5/6" />
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-4/5" />
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-2/3" />
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="h-24 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
          <div className="h-24 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
          <div className="h-24 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center justify-center opacity-60">
        <svg className="w-10 h-10 text-slate-400 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <p className="text-slate-500 font-medium tracking-wide">等待生成化境...</p>
      </div>
    </div>
  );
}
