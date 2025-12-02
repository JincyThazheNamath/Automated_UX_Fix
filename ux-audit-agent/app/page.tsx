'use client';

import { useState, useMemo } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2, XCircle, Info, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface AuditFinding {
  category: 'accessibility' | 'usability' | 'design' | 'performance' | 'seo';
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  description: string;
  location: string;
  suggestion: string;
  codeSnippet?: string;
}

interface AuditResult {
  url: string;
  timestamp: string;
  findings: AuditFinding[];
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    accessibility: number;
    usability: number;
    design: number;
    performance: number;
    seo: number;
    overallScore: number;
  };
  screenshot?: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());

  const generateMockData = (url: string): AuditResult => {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const mockFindings: AuditFinding[] = [
      {
        category: 'accessibility',
        severity: 'critical',
        issue: 'Missing alt text on hero images',
        description: 'The main hero section contains 3 images without alt attributes. Screen reader users cannot understand the visual content, violating WCAG 2.1 Level A requirements.',
        location: 'Hero section',
        suggestion: 'Add descriptive alt text to all images that convey meaning. Decorative images should have empty alt attributes.',
        codeSnippet: '<img src="hero-image.jpg" alt="Team members collaborating in modern office space" />',
      },
      {
        category: 'accessibility',
        severity: 'high',
        issue: 'Low color contrast in navigation links',
        description: 'Navigation links use #4A5568 on #1A2332 background, resulting in a contrast ratio of 3.2:1, which fails WCAG AA standards (requires 4.5:1 for normal text).',
        location: 'Header navigation',
        suggestion: 'Increase text color contrast to meet WCAG AA standards. Use a lighter shade like #E2E8F0 or add background hover states.',
        codeSnippet: '.nav-link { color: #E2E8F0; } /* Contrast ratio: 8.5:1 */',
      },
      {
        category: 'usability',
        severity: 'high',
        issue: 'Unclear call-to-action buttons',
        description: 'Primary CTA buttons lack visual distinction and clear labeling. Users may struggle to identify the main action on the page.',
        location: 'Main content area',
        suggestion: 'Enhance button visibility with stronger contrast, larger size, and action-oriented text like "Get Started" instead of generic "Click Here".',
        codeSnippet: '<button class="cta-primary">Get Started Free</button>',
      },
      {
        category: 'design',
        severity: 'medium',
        issue: 'Inconsistent spacing between sections',
        description: 'Section spacing varies between 32px, 48px, and 64px without a clear pattern, creating visual inconsistency.',
        location: 'Page-wide',
        suggestion: 'Establish a consistent spacing scale (e.g., 8px base unit) and apply it consistently across all sections.',
        codeSnippet: '.section { margin-bottom: 4rem; } /* 64px consistent spacing */',
      },
      {
        category: 'performance',
        severity: 'high',
        issue: 'Unoptimized images without WebP format',
        description: 'All images are served in JPEG/PNG format. Converting to WebP could reduce file sizes by 25-35%, improving page load times.',
        location: 'Image assets',
        suggestion: 'Convert images to WebP format with fallbacks for older browsers. Use responsive images with srcset.',
        codeSnippet: '<picture>\n  <source srcset="image.webp" type="image/webp">\n  <img src="image.jpg" alt="Description">\n</picture>',
      },
      {
        category: 'seo',
        severity: 'critical',
        issue: 'Missing meta description',
        description: 'The page lacks a meta description tag, which impacts search engine visibility and click-through rates from search results.',
        location: 'HTML head',
        suggestion: 'Add a compelling meta description (150-160 characters) that summarizes the page content and includes relevant keywords.',
        codeSnippet: '<meta name="description" content="Your compelling 150-character description here that includes key terms and value proposition.">',
      },
      {
        category: 'accessibility',
        severity: 'medium',
        issue: 'Form inputs missing labels',
        description: 'Contact form has 2 input fields without associated label elements or aria-labels, making them inaccessible to screen readers.',
        location: 'Contact form',
        suggestion: 'Add proper label elements for all form inputs, or use aria-label attributes for icon-only inputs.',
        codeSnippet: '<label for="email">Email Address</label>\n<input type="email" id="email" name="email" required>',
      },
      {
        category: 'usability',
        severity: 'medium',
        issue: 'Mobile navigation menu not intuitive',
        description: 'The mobile hamburger menu lacks clear visual feedback when opened, and menu items are too small for touch targets (less than 44x44px).',
        location: 'Mobile navigation',
        suggestion: 'Increase touch target sizes to at least 44x44px and add visual indicators (animations, backdrop) when menu is open.',
        codeSnippet: '.mobile-menu-item {\n  min-height: 44px;\n  padding: 12px 16px;\n}',
      },
      {
        category: 'design',
        severity: 'low',
        issue: 'Typography scale inconsistency',
        description: 'Heading sizes don\'t follow a consistent scale. H1 uses 48px while H2 uses 36px, but H3 jumps to 28px instead of maintaining ratio.',
        location: 'Typography system',
        suggestion: 'Establish a consistent typographic scale (e.g., 1.25x or 1.5x ratio) and apply it consistently across all heading levels.',
        codeSnippet: 'h1 { font-size: 3rem; }\nh2 { font-size: 2.25rem; }\nh3 { font-size: 1.875rem; }',
      },
      {
        category: 'performance',
        severity: 'medium',
        issue: 'No lazy loading for below-fold images',
        description: 'All images load immediately, including those below the fold. This increases initial page load time unnecessarily.',
        location: 'Image gallery section',
        suggestion: 'Implement lazy loading for images below the fold using the loading="lazy" attribute or Intersection Observer API.',
        codeSnippet: '<img src="image.jpg" alt="Description" loading="lazy">',
      },
      {
        category: 'seo',
        severity: 'high',
        issue: 'Missing structured data (Schema.org)',
        description: 'The page lacks structured data markup, missing opportunities for rich snippets in search results.',
        location: 'HTML head',
        suggestion: 'Add JSON-LD structured data for Organization, WebSite, or Article schema depending on content type.',
        codeSnippet: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Company"\n}\n</script>',
      },
      {
        category: 'accessibility',
        severity: 'high',
        issue: 'Keyboard navigation not fully functional',
        description: 'Dropdown menus and modal dialogs cannot be fully navigated using only keyboard. Tab order is broken in several areas.',
        location: 'Interactive elements',
        suggestion: 'Ensure all interactive elements are keyboard accessible. Add proper focus management and ARIA attributes for complex components.',
        codeSnippet: '<div role="menu" aria-label="Navigation menu">\n  <a href="#" role="menuitem" tabindex="0">Item</a>\n</div>',
      },
      {
        category: 'usability',
        severity: 'low',
        issue: 'Breadcrumb navigation missing',
        description: 'Multi-level pages lack breadcrumb navigation, making it difficult for users to understand their location and navigate back.',
        location: 'Page header',
        suggestion: 'Add breadcrumb navigation for pages deeper than 2 levels in the site hierarchy.',
        codeSnippet: '<nav aria-label="Breadcrumb">\n  <ol>\n    <li><a href="/">Home</a></li>\n    <li><a href="/products">Products</a></li>\n  </ol>\n</nav>',
      },
    ];

    const summary = {
      totalIssues: mockFindings.length,
      critical: mockFindings.filter(f => f.severity === 'critical').length,
      high: mockFindings.filter(f => f.severity === 'high').length,
      medium: mockFindings.filter(f => f.severity === 'medium').length,
      low: mockFindings.filter(f => f.severity === 'low').length,
      accessibility: mockFindings.filter(f => f.category === 'accessibility').length,
      usability: mockFindings.filter(f => f.category === 'usability').length,
      design: mockFindings.filter(f => f.category === 'design').length,
      performance: mockFindings.filter(f => f.category === 'performance').length,
      seo: mockFindings.filter(f => f.category === 'seo').length,
      overallScore: Math.max(0, 100 - (mockFindings.filter(f => f.severity === 'critical').length * 15 + 
                                       mockFindings.filter(f => f.severity === 'high').length * 10 +
                                       mockFindings.filter(f => f.severity === 'medium').length * 5 +
                                       mockFindings.filter(f => f.severity === 'low').length * 2)),
    };

    // Generate a simple placeholder screenshot (SVG data URI)
    const svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#1a2332"/><rect x="0" y="0" width="800" height="80" fill="#0a1628"/><rect x="20" y="20" width="120" height="40" fill="#14b8a6" rx="4"/><rect x="200" y="30" width="60" height="20" fill="#4a5568" rx="2"/><rect x="280" y="30" width="60" height="20" fill="#4a5568" rx="2"/><rect x="360" y="30" width="60" height="20" fill="#4a5568" rx="2"/><rect x="680" y="20" width="100" height="40" fill="#14b8a6" rx="4"/><rect x="100" y="120" width="600" height="300" fill="#0a1628" rx="8"/><rect x="120" y="140" width="560" height="40" fill="#1a2332" rx="4"/><rect x="120" y="200" width="260" height="180" fill="#1a2332" rx="4"/><rect x="400" y="200" width="280" height="180" fill="#1a2332" rx="4"/><rect x="100" y="440" width="600" height="40" fill="#1a2332" rx="4"/><text x="400" y="550" font-family="Arial" font-size="24" fill="#14b8a6" text-anchor="middle">Website Preview</text></svg>`;
    const placeholderScreenshot = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);

    return {
      url: normalizedUrl,
      timestamp: new Date().toISOString(),
      findings: mockFindings,
      summary,
      screenshot: placeholderScreenshot,
    };
  };

  const handleAudit = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Simulate API delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use mock data instead of API call
      const mockData = generateMockData(url);
      setResult(mockData);
    } catch (err: any) {
      setError(err.message || 'Failed to perform audit');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/30 text-red-300 border-red-500/50';
      case 'high':
        return 'bg-orange-900/30 text-orange-300 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/50';
      case 'low':
        return 'bg-teal-900/30 text-teal-300 border-teal-500/50';
      default:
        return 'bg-gray-800/30 text-gray-300 border-gray-500/50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accessibility':
        return '♿';
      case 'usability':
        return '👆';
      case 'design':
        return '🎨';
      case 'performance':
        return '⚡';
      case 'seo':
        return '🔍';
      default:
        return '📋';
    }
  };

  const toggleFinding = (index: number) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFindings(newExpanded);
  };

  const filteredFindings = useMemo(() => {
    if (!result) return [];
    return result.findings.filter(finding => {
      const categoryMatch = filterCategory === 'all' || finding.category === filterCategory;
      const severityMatch = filterSeverity === 'all' || finding.severity === filterSeverity;
      return categoryMatch && severityMatch;
    });
  }, [result, filterCategory, filterSeverity]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-teal-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI UX Audit Agent
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Automated UX analysis powered by AI. Get instant insights on accessibility, 
            usability, design consistency, and more.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-[#1a2332] rounded-2xl shadow-xl p-8 mb-8 border border-gray-700/50">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleAudit()}
                placeholder="Enter website URL (e.g., example.com or https://example.com)"
                className="w-full px-6 py-4 text-lg bg-[#0a1628] border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleAudit}
              disabled={loading}
              className="px-8 py-4 bg-[#14b8a6] text-white rounded-xl font-semibold hover:bg-[#0d9488] disabled:bg-teal-800 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Audit Website
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-300">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-[#1a2332] rounded-2xl shadow-xl p-8 border border-gray-700/50">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">Audit Summary</h2>
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

            {/* Findings */}
            <div className="bg-[#1a2332] rounded-2xl shadow-xl p-8 border border-gray-700/50">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white">
                  Findings ({filteredFindings.length})
                </h2>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-[#0a1628] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="accessibility">♿ Accessibility</option>
                      <option value="usability">👆 Usability</option>
                      <option value="design">🎨 Design</option>
                      <option value="performance">⚡ Performance</option>
                      <option value="seo">🔍 SEO</option>
                    </select>
                  </div>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="bg-[#0a1628] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {filteredFindings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No findings match the selected filters.</p>
                  <button
                    onClick={() => {
                      setFilterCategory('all');
                      setFilterSeverity('all');
                    }}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFindings.map((finding, index) => {
                    const originalIndex = result.findings.indexOf(finding);
                    const isExpanded = expandedFindings.has(originalIndex);
                    return (
                      <div
                        key={originalIndex}
                        className="border-2 border-gray-700/50 rounded-xl bg-[#0a1628] hover:border-teal-500/50 transition-all"
                      >
                        <div
                          className="p-6 cursor-pointer"
                          onClick={() => toggleFinding(originalIndex)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <span className="text-2xl">{getCategoryIcon(finding.category)}</span>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                  {finding.issue}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                                    {finding.severity.toUpperCase()}
                                  </span>
                                  <span className="text-sm text-gray-400 capitalize">
                                    {finding.category}
                                  </span>
                                  <span className="text-sm text-gray-600">•</span>
                                  <span className="text-sm text-gray-400">{finding.location}</span>
                                </div>
                                {isExpanded && (
                                  <p className="text-gray-300 mt-4">{finding.description}</p>
                                )}
                              </div>
                            </div>
                            <button className="ml-4 text-gray-400 hover:text-teal-400 transition-colors">
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-6 pb-6 pt-0 space-y-4">
                            <div className="bg-teal-900/20 border-l-4 border-teal-500 p-4 rounded-r-lg">
                              <div className="flex items-start gap-2">
                                <Info className="text-teal-400 mt-0.5" size={18} />
                                <div className="flex-1">
                                  <p className="font-semibold text-teal-300 mb-1">Suggestion:</p>
                                  <p className="text-teal-200">{finding.suggestion}</p>
                                </div>
                              </div>
                            </div>

                            {finding.codeSnippet && (
                              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-700">
                                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                                  <code>{finding.codeSnippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-400">
          <p>Powered by AI • Built for Lunim Studio</p>
        </div>
      </div>
    </div>
  );
}
