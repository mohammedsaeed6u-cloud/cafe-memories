export default async function LiveWallPage({ params }: { params: Promise<{ screenId: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Live Memory Wall</h1>
      <p className="text-gray-400">Screen ID: {resolvedParams.screenId}</p>
      
      <div className="mt-12 flex-1 w-full max-w-4xl bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center overflow-hidden relative">
        <p className="text-xl text-gray-500 animate-pulse">Waiting for memories...</p>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-lg">Scan QR code to share your memory here!</p>
      </div>
    </div>
  );
}
