'use client';

import { Share2, Download } from 'lucide-react';
import { AuditResult } from '../types/audit';

interface SummaryCardProps {
  result: AuditResult;
  onShare: () => void;
  onDownload: () => void;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-teal-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Displays the audit summary with overall score, severity breakdown, and category breakdown.
 * Includes share and download functionality for the audit report.
 */
export default function SummaryCard({ result, onShare, onDownload }: SummaryCardProps) {
  return (
    <div className="bg-[#1a2332] rounded-2xl shadow-xl p-8 border border-gray-700/50">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">Audit Summary</h2>
            <div className="flex gap-2">
              <button
                onClick={onShare}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                title="Share Report"
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-[#0a1628] hover:bg-[#0f1d35] border border-gray-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                title="Download Report"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
          <p className="text-gray-300 break-all">{result.url}</p>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
        {result.screenshot && (
          <img
            src={result.screenshot}
            alt="Website screenshot"
            className="w-full md:w-64 h-48 md:h-40 object-cover rounded-lg border-2 border-gray-600"
          />
        )}
      </div>

      {/* Overall Score */}
      <div className="mb-6 p-6 bg-[#0a1628] rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-1">Overall UX Score</h3>
            <p className="text-sm text-gray-400">Based on severity-weighted analysis</p>
          </div>
          <div className={`text-5xl font-bold ${getScoreColor(result.summary.overallScore)}`}>
            {result.summary.overallScore}
          </div>
        </div>
        <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              result.summary.overallScore >= 80 ? 'bg-teal-500' :
              result.summary.overallScore >= 60 ? 'bg-yellow-500' :
              result.summary.overallScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${result.summary.overallScore}%` }}
          />
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Issues by Severity</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#0a1628] p-4 rounded-lg text-center border border-gray-700/50">
            <div className="text-3xl font-bold text-white">{result.summary.totalIssues}</div>
            <div className="text-sm text-gray-300 mt-1">Total Issues</div>
          </div>
          <div className="bg-red-900/30 p-4 rounded-lg text-center border-2 border-red-500/50">
            <div className="text-3xl font-bold text-red-300">{result.summary.critical}</div>
            <div className="text-sm text-red-200 mt-1">Critical</div>
          </div>
          <div className="bg-orange-900/30 p-4 rounded-lg text-center border-2 border-orange-500/50">
            <div className="text-3xl font-bold text-orange-300">{result.summary.high}</div>
            <div className="text-sm text-orange-200 mt-1">High</div>
          </div>
          <div className="bg-yellow-900/30 p-4 rounded-lg text-center border-2 border-yellow-500/50">
            <div className="text-3xl font-bold text-yellow-300">{result.summary.medium}</div>
            <div className="text-sm text-yellow-200 mt-1">Medium</div>
          </div>
          <div className="bg-teal-900/30 p-4 rounded-lg text-center border-2 border-teal-500/50">
            <div className="text-3xl font-bold text-teal-300">{result.summary.low}</div>
            <div className="text-sm text-teal-200 mt-1">Low</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Issues by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#0a1628] p-4 rounded-lg text-center border border-gray-700/50 hover:border-teal-500/50 transition-colors">
            <div className="text-2xl mb-2">♿</div>
            <div className="text-2xl font-bold text-white">{result.summary.accessibility}</div>
            <div className="text-sm text-gray-400 mt-1">Accessibility</div>
          </div>
          <div className="bg-[#0a1628] p-4 rounded-lg text-center border border-gray-700/50 hover:border-teal-500/50 transition-colors">
            <div className="text-2xl mb-2">👆</div>
            <div className="text-2xl font-bold text-white">{result.summary.usability}</div>
            <div className="text-sm text-gray-400 mt-1">Usability</div>
          </div>
          <div className="bg-[#0a1628] p-4 rounded-lg text-center border border-gray-700/50 hover:border-teal-500/50 transition-colors">
            <div className="text-2xl mb-2">🎨</div>
            <div className="text-2xl font-bold text-white">{result.summary.design}</div>
            <div className="text-sm text-gray-400 mt-1">Design</div>
          </div>
          <div className="bg-[#0a1628] p-4 rounded-lg text-center border border-gray-700/50 hover:border-teal-500/50 transition-colors">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-white">{result.summary.performance}</div>
            <div className="text-sm text-gray-400 mt-1">Performance</div>
          </div>
          <div className="bg-[#0a1628] p-4 rounded-lg text-center border border-gray-700/50 hover:border-teal-500/50 transition-colors">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-2xl font-bold text-white">{result.summary.seo}</div>
            <div className="text-sm text-gray-400 mt-1">SEO</div>
          </div>
        </div>
      </div>
    </div>
  );
}

