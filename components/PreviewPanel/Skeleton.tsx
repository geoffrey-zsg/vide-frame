interface SkeletonProps {
  error?: string;
}

export function Skeleton({ error }: SkeletonProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 max-w-sm">
          <p className="text-red-600 font-medium mb-1">渲染出错</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 w-64 mx-auto mt-12">
      <div className="h-6 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2 mt-2" />
    </div>
  );
}
