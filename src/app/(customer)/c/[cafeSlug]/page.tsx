export default async function CafeLandingPage({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[80vh]">
      <div className="w-24 h-24 bg-gray-200 rounded-full mb-6"></div>
      <h1 className="text-2xl font-bold mb-2">Welcome to {resolvedParams.cafeSlug}</h1>
      <p className="text-gray-600 text-center mb-8">
        Share a memory and earn rewards!
      </p>
      <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md mb-4">
        Share Memory
      </button>
      <button className="w-full bg-gray-100 text-gray-800 font-semibold py-3 rounded-lg border">
        View Loyalty Status
      </button>
    </div>
  );
}
