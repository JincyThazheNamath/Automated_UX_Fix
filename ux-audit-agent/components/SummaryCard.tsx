'use client';

import { useState, useEffect } from 'react';
import { Share2, Download, X, ZoomIn } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal && !isClosing) {
        handleCloseModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal, isClosing]);

  // Handle closing animation
  const handleCloseModal = () => {
    setIsClosing(true);
    // Wait for exit animation to complete before unmounting
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 350); // Match animation duration (350ms)
  };

  return (
    <>
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
            <div
              className="relative group cursor-pointer"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setShowModal(true)}
            >
              <div className="relative w-full md:w-64 h-48 md:h-40 overflow-hidden rounded-lg border-2 border-gray-600 transition-all duration-300 group-hover:border-teal-500 group-hover:shadow-lg group-hover:shadow-teal-500/20">
                <img
                  src={result.screenshot}
                  alt="Website screenshot"
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isHovered ? 'scale-110' : 'scale-100'
                  }`}
                />
                {/* Overlay with zoom icon */}
                <div
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="bg-teal-600/90 rounded-full p-3 transform transition-transform duration-300 group-hover:scale-110">
                    <ZoomIn size={24} className="text-white" />
                  </div>
                </div>
                {/* Hint text */}
                <div
                  className={`absolute bottom-2 left-2 right-2 text-xs text-white bg-black/70 px-2 py-1 rounded transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  Click to view full size
                </div>
              </div>
            </div>
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

      {/* Full-size Screenshot Modal */}
      {showModal && result.screenshot && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseModal}
        >
          {/* Close button - positioned relative to viewport, outside screenshot */}
          <button
            onClick={handleCloseModal}
            className={`fixed top-8 right-8 z-20 bg-black/90 hover:bg-black text-white rounded-full p-3 border-2 border-gray-600 hover:border-teal-500 transition-all ease-out shadow-lg ${
              isClosing ? 'opacity-0 scale-95 duration-350' : 'opacity-100 scale-100 hover:scale-110 duration-200'
            }`}
            style={isClosing ? { transitionDuration: '350ms' } : {}}
            aria-label="Close screenshot"
          >
            <X size={24} />
          </button>

          <div
            className={`relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center ${
              isClosing ? 'modal-content-exit' : 'modal-content-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Screenshot container */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={result.screenshot}
                alt="Website screenshot - Full size"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border-4 border-gray-700"
              />
            </div>

            {/* Instructions */}
            <div
              className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm transition-all ease-out ${
                isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}
              style={{ transitionDuration: isClosing ? '350ms' : '200ms' }}
            >
              Click outside or press ESC to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}

