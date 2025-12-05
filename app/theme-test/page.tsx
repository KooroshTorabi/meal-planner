'use client'

export default function ThemeTestPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">Dark Mode Test Page</h1>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Background Colors</h2>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white">
              This box should have a white background in light mode and dark gray in dark mode.
            </p>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-900 dark:text-white">
              This box should have a light gray background in light mode and very dark in dark mode.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Text Colors</h2>
          
          <p className="text-gray-900 dark:text-white">
            Primary text - should be dark in light mode, white in dark mode
          </p>
          
          <p className="text-gray-600 dark:text-gray-400">
            Secondary text - should be gray in light mode, light gray in dark mode
          </p>
          
          <p className="text-primary-600 dark:text-primary-400">
            Primary color text - should adapt to dark mode
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Buttons</h2>
          
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              Primary Button
            </button>
            
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg">
              Secondary Button
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Current Theme Info</h2>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="mb-2">
              <strong>HTML classes:</strong> <span id="html-classes"></span>
            </p>
            <p className="mb-2">
              <strong>Computed background:</strong> <span id="computed-bg"></span>
            </p>
            <p>
              <strong>LocalStorage theme:</strong> <span id="storage-theme"></span>
            </p>
          </div>
        </section>

        <button
          onClick={() => {
            const html = document.documentElement
            const classes = html.classList.toString()
            const computedBg = window.getComputedStyle(html).backgroundColor
            const storedTheme = localStorage.getItem('theme')
            
            document.getElementById('html-classes')!.textContent = classes || 'none'
            document.getElementById('computed-bg')!.textContent = computedBg
            document.getElementById('storage-theme')!.textContent = storedTheme || 'none'
          }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          Refresh Theme Info
        </button>
      </div>
    </main>
  )
}
