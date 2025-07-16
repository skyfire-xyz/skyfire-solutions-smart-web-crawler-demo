"use client"

export default function TopBar() {
  return (
    <div className="flex w-full items-center justify-between p-6 border-b border-gray-200">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Smart Web Crawler Bot
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          This page is a UI for web-crawler trying to scrape content from websites
        </p>
      </div>
    </div>
  )
}