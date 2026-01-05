<!-- bb005a0f-c285-4a91-a39b-cabeb0e5b162 19f01aad-72c5-47e5-8229-772c48cf467e -->
# Align AI UX Audit Agent with Lighthouse Metrics

## Problem Analysis

The current AI audit relies on subjective AI analysis without measuring actual performance metrics. Lighthouse uses real measurements:

- **Performance**: FCP, LCP, TTI, TBT, CLS, Speed Index
- **Accessibility**: WCAG compliance checks via accessibility tree
- **SEO**: Meta tags, structured data, semantic HTML validation
- **Best Practices**: Security headers, modern web standards

## Solution Overview

Collect real metrics using Puppeteer's Performance API and accessibility tree, then feed these to the AI with a calibrated scoring prompt that matches Lighthouse's methodology.

## Implementation Plan

### 1. Add Performance Metrics Collection (`app/api/audit/route.ts`)

**Add Core Web Vitals measurement:**

- Use Puppeteer's `page.metrics()` and Performance API
- Measure: FCP, LCP, TTI, TBT, CLS, Speed Index
- Calculate performance score using Lighthouse's weighted formula:
                                - FCP: 10%, LCP: 25%, TTI: 10%, TBT: 30%, CLS: 15%, Speed Index: 10%

**Code location**: After `page.goto()` and before `page.evaluate()`, add:

```typescript
// Enable Performance API
await page.evaluate(() => {
  performance.mark('audit-start');
});

// Wait for page to stabilize
await page.waitForTimeout(2000);

// Collect performance metrics
const performanceMetrics = await page.evaluate(() => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
  
  // Calculate LCP (simplified - would need more sophisticated tracking)
  // Calculate CLS using LayoutShift API
  // Calculate TBT from long tasks
  
  return {
    fcp,
    lcp: 0, // Will be calculated
    tti: navigation.domInteractive - navigation.fetchStart,
    tbt: 0, // Will be calculated from long tasks
    cls: 0, // Will be calculated from layout shifts
    speedIndex: 0, // Will be calculated
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
  };
});

// Calculate Lighthouse-style performance score
const calculatePerformanceScore = (metrics: any) => {
  // Lighthouse scoring thresholds and weights
  const scores = {
    fcp: scoreMetric(metrics.fcp, [1800, 3000], 0.10),
    lcp: scoreMetric(metrics.lcp, [2500, 4000], 0.25),
    tti: scoreMetric(metrics.tti, [3800, 7300], 0.10),
    tbt: scoreMetric(metrics.tbt, [200, 600], 0.30),
    cls: scoreMetric(metrics.cls, [0.1, 0.25], 0.15),
    speedIndex: scoreMetric(metrics.speedIndex, [3400, 5800], 0.10),
  };
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
};
```

### 2. Add Accessibility Tree Analysis (`app/api/audit/route.ts`)

**Use Puppeteer's accessibility API:**

- Call `page.accessibility.snapshot()` to get accessibility tree
- Check for: missing labels, ARIA issues, color contrast, keyboard navigation
- Count violations by severity

**Code location**: After performance metrics, add:

```typescript
// Get accessibility snapshot
const accessibilitySnapshot = await page.accessibility.snapshot();
const accessibilityIssues = analyzeAccessibilityTree(accessibilitySnapshot);

// Calculate accessibility score (0-100, similar to Lighthouse)
const accessibilityScore = calculateAccessibilityScore(accessibilityIssues);
```

### 3. Add SEO Validation (`app/api/audit/route.ts`)

**Check SEO elements:**

- Meta description, title tags
- Structured data (JSON-LD, microdata)
- Semantic HTML (header, nav, main, article, etc.)
- Alt text coverage
- Canonical URLs
- Open Graph tags

**Code location**: Enhance existing `pageData` extraction:

```typescript
const seoData = {
  hasMetaDescription: !!pageData.metaDescription,
  titleLength: pageData.title.length,
  hasStructuredData: checkStructuredData(pageData.html),
  semanticHTML: checkSemanticHTML(pageData.html),
  altTextCoverage: pageData.images.filter(i => i.hasAlt).length / pageData.images.length,
  hasCanonical: !!document.querySelector('link[rel="canonical"]'),
  hasOpenGraph: !!document.querySelector('meta[property^="og:"]'),
};

const seoScore = calculateSEOScore(seoData);
```

### 4. Update AI Prompt with Real Metrics (`app/api/audit/route.ts`)

**Modify the `analysisPrompt` to include:**

- Real performance metrics (FCP, LCP, CLS, etc.)
- Accessibility violation counts
- SEO element validation results
- Instructions to calibrate scores to match Lighthouse methodology

**Code location**: Update `analysisPrompt` around line 243:

```typescript
const analysisPrompt = `Act as a Senior UX & SEO Auditor. Analyze the provided website using REAL METRICS and Lighthouse-calibrated scoring.

### REAL PERFORMANCE METRICS (Lighthouse-style):
- FCP: ${performanceMetrics.fcp}ms (thresholds: good <1800ms, needs-improvement <3000ms)
- LCP: ${performanceMetrics.lcp}ms (thresholds: good <2500ms, needs-improvement <4000ms)
- TTI: ${performanceMetrics.tti}ms (thresholds: good <3800ms, needs-improvement <7300ms)
- TBT: ${performanceMetrics.tbt}ms (thresholds: good <200ms, needs-improvement <600ms)
- CLS: ${performanceMetrics.cls} (thresholds: good <0.1, needs-improvement <0.25)
- Speed Index: ${performanceMetrics.speedIndex}ms (thresholds: good <3400ms, needs-improvement <5800ms)

### REAL ACCESSIBILITY VIOLATIONS:
${JSON.stringify(accessibilityIssues, null, 2)}

### REAL SEO VALIDATION:
${JSON.stringify(seoData, null, 2)}

### SCORING CALIBRATION (Match Lighthouse):
1. **Performance Score**: Use the measured metrics above. Calculate using Lighthouse's weighted formula:
   - Score each metric: 0-100 based on thresholds (good=100, needs-improvement=50, poor=0)
   - Weighted average: FCP(10%) + LCP(25%) + TTI(10%) + TBT(30%) + CLS(15%) + SpeedIndex(10%)

2. **Accessibility Score**: Start at 100, deduct points based on violation severity:
   - Critical: -10 points each
   - High: -5 points each
   - Medium: -2 points each
   - Low: -1 point each

3. **SEO Score**: Based on real validation:
   - Meta description: +10 if present and 50-160 chars
   - Title: +10 if 30-60 chars
   - Structured data: +15 if present
   - Alt text coverage: +10 if >80%
   - Semantic HTML: +10 if proper structure
   - Canonical: +5 if present
   - Open Graph: +10 if present
   - Max: 100

4. **Design Score**: Keep current AI analysis but calibrate to match typical Lighthouse "Best Practices" scoring

### OUTPUT FORMAT:
Return JSON with scores calibrated to match Lighthouse methodology:
{
  "scores": {
    "performance": [0-100, calculated from real metrics],
    "accessibility": [0-100, calculated from violations],
    "design": [0-100, AI analysis calibrated],
    "seo": [0-100, calculated from validation]
  },
  "overall_ux_score": (Performance*0.3 + Accessibility*0.3 + Design*0.25 + SEO*0.15),
  "real_metrics": {
    "fcp": ${performanceMetrics.fcp},
    "lcp": ${performanceMetrics.lcp},
    "cls": ${performanceMetrics.cls},
    // ... other metrics
  },
  // ... rest of format
}`;
```

### 5. Update Response Parsing (`app/api/audit/route.ts`)

**Enhance response parsing to include:**

- Real metrics in the response
- Performance score from calculated metrics
- Calibrated scores matching Lighthouse methodology

**Code location**: Update parsing logic around line 400 to include `real_metrics` field.

### 6. Add Helper Functions (`app/api/audit/route.ts`)

**Add utility functions:**

- `scoreMetric(value, thresholds, weight)`: Score individual metrics
- `analyzeAccessibilityTree(snapshot)`: Parse accessibility violations
- `calculateAccessibilityScore(issues)`: Calculate accessibility score
- `checkStructuredData(html)`: Detect JSON-LD, microdata
- `checkSemanticHTML(html)`: Validate semantic elements
- `calculateSEOScore(seoData)`: Calculate SEO score

**Code location**: Add before the `POST` function handler.

## Files to Modify

1. **[ux-audit-agent/app/api/audit/route.ts](ux-audit-agent/app/api/audit/route.ts)**

                                                - Add performance metrics collection
                                                - Add accessibility tree analysis
                                                - Enhance SEO validation
                                                - Update AI prompt with real metrics
                                                - Add helper functions for scoring
                                                - Update response parsing

## Expected Outcomes

- Performance scores align with Lighthouse (within ±5 points)
- Accessibility scores match Lighthouse methodology
- SEO scores based on real validation, not AI estimation
- Overall UX score calibrated to match Lighthouse's weighted approach
- Real metrics (FCP, LCP, CLS, etc.) included in audit response

## Testing Strategy

1. Test with `https://tabb.cc/` and compare scores with Lighthouse
2. Verify performance metrics match browser DevTools
3. Validate accessibility score against Lighthouse accessibility audit
4. Confirm SEO score matches Lighthouse SEO audit
5. Iterate on calibration if scores differ by >10 points

## Notes

- No UI/UX code changes - all modifications are in the API route
- Backend/infrastructure only
- Maintains existing error handling and browser launch logic
- Adds real metric collection without breaking existing functionality

### To-dos

- [ ] Update globals.css with dark blue background theme
- [ ] Update page.tsx with dark blue/teal color scheme
- [ ] Update buttons and accents to teal color
- [ ] Update cards and components to match dark theme
- [ ] Add Core Web Vitals collection using Puppeteer Performance API (FCP, LCP, TTI, TBT, CLS, Speed Index) and calculate Lighthouse-style performance score
- [ ] Implement accessibility tree analysis using page.accessibility.snapshot() and calculate accessibility score based on violations
- [ ] Add comprehensive SEO validation (structured data, semantic HTML, meta tags, alt text coverage) and calculate SEO score
- [ ] Create helper functions: scoreMetric(), analyzeAccessibilityTree(), calculateAccessibilityScore(), checkStructuredData(), checkSemanticHTML(), calculateSEOScore()
- [ ] Update AI prompt to include real metrics and Lighthouse-calibrated scoring instructions, ensuring scores match Lighthouse methodology
- [ ] Enhance response parsing to include real_metrics field and ensure calibrated scores are properly extracted
- [ ] Test with https://tabb.cc/ and compare scores with Lighthouse, calibrate if differences >10 points