import Logo from '@/components/Logo'

export default function SetupCheck() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient px-4">
      <div className="max-w-2xl w-full bg-white shadow-2xl rounded-lg p-8">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Setup Check</h1>
        
        {missingVars.length === 0 ? (
          <div className="bg-brand-green/10 border-2 border-brand-green rounded-md p-4">
            <p className="text-brand-green font-medium text-center text-lg">✅ All required environment variables are set!</p>
            <p className="text-gray-600 text-center mt-2 text-sm">Your JENDA MOBILITY app is ready to use!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 font-medium mb-2">❌ Missing Required Environment Variables:</p>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                {missingVars.map(varName => (
                  <li key={varName}>{varName}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h2 className="text-blue-900 font-semibold mb-2">How to Fix:</h2>
              <ol className="list-decimal list-inside text-blue-800 space-y-2">
                <li>Go to <strong>Vercel Dashboard</strong> → Your Project → <strong>Settings</strong> → <strong>Environment Variables</strong></li>
                <li>Add the missing variables listed above</li>
                <li>Go to <strong>Deployments</strong> tab → Click <strong>"Redeploy"</strong></li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Required Variables:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><code className="bg-gray-200 px-1 rounded">DATABASE_URL</code> - PostgreSQL connection string</li>
                <li><code className="bg-gray-200 px-1 rounded">NEXTAUTH_SECRET</code> - Generate with: <code>openssl rand -base64 32</code></li>
                <li><code className="bg-gray-200 px-1 rounded">NEXTAUTH_URL</code> - Your app URL (e.g., https://saas-internet-billing.vercel.app)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

