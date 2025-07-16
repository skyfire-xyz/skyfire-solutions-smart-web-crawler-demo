"use client"

export default function TopBar() {
  return (
    <div className="w-full border-b border-gray-200 px-6 pt-8 pb-4">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Smart Web Crawler
        </h1>
        <div>
          <p className="text-gray-700 dark:text-gray-200 text-base leading-relaxed mb-2">
            This demo web crawler illustrates how token-based payments can be used to access and crawl protected websites.<br/>
            There are two sample URLs provided:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 text-base space-y-1">
            <li>
              <span className="font-semibold">Unprotected Website:</span> Accessible to the crawler without any token.
            </li>
            <li>
              <span className="font-semibold">Protected Website:</span> Requires a <span className="font-mono">kya+pay</span> token to allow crawler access.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}