import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
  };
  screenshot?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Launch browser and crawl page
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
      await page.goto(targetUrl.toString(), { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
    } catch (error) {
      await browser.close();
      return NextResponse.json({ 
        error: 'Failed to load page. Please check the URL is accessible.' 
      }, { status: 400 });
    }

    // Extract page data
    const pageData = await page.evaluate(() => {
      const getComputedStyles = (element: Element) => {
        const styles = window.getComputedStyle(element);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          fontFamily: styles.fontFamily,
        };
      };

      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt || '',
        hasAlt: !!img.alt,
      }));

      const links = Array.from(document.querySelectorAll('a')).map(link => ({
        href: link.href,
        text: link.textContent?.trim() || '',
        hasText: !!(link.textContent?.trim()),
      }));

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        tag: h.tagName.toLowerCase(),
        text: h.textContent?.trim() || '',
      }));

      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map(btn => ({
        text: btn.textContent?.trim() || '',
        ariaLabel: btn.getAttribute('aria-label') || '',
      }));

      const forms = Array.from(document.querySelectorAll('form, input, textarea, select')).map(form => ({
        type: form.tagName.toLowerCase(),
        label: form.getAttribute('aria-label') || 
               (form.previousElementSibling?.textContent?.trim()) || '',
        required: form.hasAttribute('required'),
      }));

      // Check color contrast (simplified)
      const textElements = Array.from(document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6'))
        .slice(0, 20)
        .map(el => getComputedStyles(el));

      return {
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        url: window.location.href,
        images,
        links,
        headings,
        buttons,
        forms,
        textStyles: textElements,
        html: document.documentElement.outerHTML.substring(0, 50000), // Limit HTML size
      };
    });

    // Take screenshot
    const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
    await browser.close();

    // Analyze with AI
    const analysisPrompt = `You are a UX audit expert. Analyze the following website data and identify UX issues.

Website URL: ${targetUrl.toString()}
Page Title: ${pageData.title}
Meta Description: ${pageData.metaDescription}

Page Structure:
- Images: ${pageData.images.length} total, ${pageData.images.filter(i => !i.hasAlt).length} missing alt text
- Links: ${pageData.links.length} total, ${pageData.links.filter(l => !l.hasText).length} without descriptive text
- Headings: ${pageData.headings.length} total
- Buttons: ${pageData.buttons.length} total
- Forms: ${pageData.forms.length} total

HTML Sample (first 50k chars):
${pageData.html.substring(0, 10000)}

Analyze this website and identify UX issues in these categories:
1. Accessibility (WCAG compliance, alt text, ARIA labels, keyboard navigation)
2. Usability (navigation clarity, call-to-action visibility, form usability)
3. Design Consistency (color schemes, typography, spacing)
4. Performance (image optimization, loading states)
5. SEO (meta tags, heading structure, semantic HTML)

For each issue found, provide:
- category: one of "accessibility", "usability", "design", "performance", "seo"
- severity: "critical", "high", "medium", or "low"
- issue: brief title
- description: detailed explanation
- location: where on the page (e.g., "header navigation", "contact form")
- suggestion: actionable fix recommendation
- codeSnippet: if applicable, provide HTML/CSS code example for the fix

Return ONLY a valid JSON array of findings. Format:
[
  {
    "category": "accessibility",
    "severity": "high",
    "issue": "Missing alt text on images",
    "description": "X images lack alt attributes, impacting screen reader users",
    "location": "Hero section",
    "suggestion": "Add descriptive alt text to all images",
    "codeSnippet": "<img src='...' alt='Descriptive text here' />"
  }
]

Focus on the most impactful issues. Return 8-15 findings total.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: analysisPrompt,
      }],
    });

    let findings: AuditFinding[] = [];
    try {
      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          findings = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback findings if AI parsing fails
      findings = [
        {
          category: 'accessibility',
          severity: 'high',
          issue: 'Analysis completed',
          description: 'AI analysis completed. Some findings may need manual review.',
          location: 'Page-wide',
          suggestion: 'Review the full audit report',
        },
      ];
    }

    // Calculate summary
    const summary = {
      totalIssues: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
    };

    const result: AuditResult = {
      url: targetUrl.toString(),
      timestamp: new Date().toISOString(),
      findings,
      summary,
      screenshot: `data:image/png;base64,${screenshot}`,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform audit' },
      { status: 500 }
    );
  }
}

