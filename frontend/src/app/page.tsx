export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          Political Accountability Platform
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Track political promises with community verification and transparent accountability
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Track Promises</h2>
            <p className="text-sm text-muted-foreground">
              Submit and monitor political promises made by elected officials
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Verify Claims</h2>
            <p className="text-sm text-muted-foreground">
              Contribute evidence and vote on verification accuracy
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Earn Recognition</h2>
            <p className="text-sm text-muted-foreground">
              Build your citizen score through quality contributions
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
