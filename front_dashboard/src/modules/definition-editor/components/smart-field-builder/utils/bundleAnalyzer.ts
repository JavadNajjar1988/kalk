/**
 * Bundle Analyzer and Optimization Utility
 * Analyzes bundle sizes and provides optimization recommendations
 */

interface BundleInfo {
  name: string;
  size: number;
  gzipSize: number;
  modules: string[];
  loadTime: number;
  lastModified: number;
}

interface OptimizationRecommendation {
  type: 'split' | 'lazy' | 'tree-shake' | 'compress' | 'preload';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
  implementation: string;
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class BundleAnalyzer {
  private bundles: Map<string, BundleInfo> = new Map();
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  };

  constructor() {
    this.initializePerformanceMonitoring();
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }

  // Process performance entries
  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
        break;

      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
        break;

      case 'largest-contentful-paint':
        this.metrics.lcp = entry.startTime;
        break;

      case 'first-input':
        const fidEntry = entry as PerformanceEventTiming;
        this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        break;

      case 'layout-shift':
        const clsEntry = entry as any; // CLS entries don't have proper TypeScript types
        if (!clsEntry.hadRecentInput) {
          this.metrics.cls += clsEntry.value;
        }
        break;
    }
  }

  // Analyze bundle size and performance
  analyzeBundle(name: string, moduleList: string[] = []): BundleInfo {
    const startTime = performance.now();
    
    // Estimate bundle size (simplified calculation)
    const estimatedSize = this.estimateBundleSize(moduleList);
    const gzipSize = Math.round(estimatedSize * 0.3); // Rough gzip compression ratio
    
    const bundleInfo: BundleInfo = {
      name,
      size: estimatedSize,
      gzipSize,
      modules: moduleList,
      loadTime: performance.now() - startTime,
      lastModified: Date.now()
    };

    this.bundles.set(name, bundleInfo);
    return bundleInfo;
  }

  // Estimate bundle size based on modules
  private estimateBundleSize(modules: string[]): number {
    // This is a simplified estimation - in real scenarios you'd use webpack-bundle-analyzer
    const baseSizes: Record<string, number> = {
      'react': 45000, // 45KB
      'react-dom': 130000, // 130KB
      '@mui/material': 200000, // 200KB
      'lodash': 70000, // 70KB
      'axios': 15000, // 15KB
      'moment': 67000, // 67KB
    };

    let totalSize = 0;
    
    modules.forEach(module => {
      // Check if it's a known large library
      const knownSize = Object.entries(baseSizes).find(([lib]) => module.includes(lib));
      if (knownSize) {
        totalSize += knownSize[1];
      } else {
        // Estimate based on module name/path
        totalSize += this.estimateModuleSize(module);
      }
    });

    return totalSize;
  }

  // Estimate individual module size
  private estimateModuleSize(modulePath: string): number {
    // Simple heuristic based on path depth and file type
    const pathDepth = modulePath.split('/').length;
    const isComponent = modulePath.includes('component') || modulePath.includes('Component');
    const isUtil = modulePath.includes('util') || modulePath.includes('helper');
    const isHook = modulePath.includes('hook') || modulePath.includes('use');

    let baseSize = 2000; // 2KB base

    if (isComponent) baseSize *= 3;
    if (isUtil) baseSize *= 1.5;
    if (isHook) baseSize *= 2;
    if (pathDepth > 5) baseSize *= 1.2;

    return Math.round(baseSize * (0.8 + Math.random() * 0.4)); // Add some randomness
  }

  // Generate optimization recommendations
  generateRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const totalSize = Array.from(this.bundles.values()).reduce((sum, bundle) => sum + bundle.size, 0);

    // Check for large bundles that should be split
    for (const bundle of this.bundles.values()) {
      if (bundle.size > 100000) { // > 100KB
        recommendations.push({
          type: 'split',
          priority: 'high',
          description: `Bundle "${bundle.name}" (${Math.round(bundle.size / 1024)}KB) باید تقسیم شود`,
          estimatedSavings: bundle.size * 0.3,
          implementation: `استفاده از dynamic import() برای تقسیم bundle "${bundle.name}"`
        });
      }
    }

    // Check performance metrics
    if (this.metrics.fcp > 2000) { // FCP > 2s
      recommendations.push({
        type: 'preload',
        priority: 'high',
        description: 'First Contentful Paint بیش از 2 ثانیه است',
        estimatedSavings: 1000,
        implementation: 'استفاده از resource hints و preloading برای منابع مهم'
      });
    }

    if (this.metrics.lcp > 2500) { // LCP > 2.5s
      recommendations.push({
        type: 'lazy',
        priority: 'high',
        description: 'Largest Contentful Paint بیش از 2.5 ثانیه است',
        estimatedSavings: 1500,
        implementation: 'lazy loading برای تصاویر و کامپوننت‌های غیرضروری'
      });
    }

    if (this.metrics.fid > 100) { // FID > 100ms
      recommendations.push({
        type: 'compress',
        priority: 'medium',
        description: 'First Input Delay بیش از 100ms است',
        estimatedSavings: 50,
        implementation: 'بهینه‌سازی JavaScript execution و کاهش main thread blocking'
      });
    }

    if (this.metrics.cls > 0.1) { // CLS > 0.1
      recommendations.push({
        type: 'lazy',
        priority: 'medium',
        description: 'Cumulative Layout Shift زیاد است',
        estimatedSavings: 0,
        implementation: 'اضافه کردن dimensions صریح برای تصاویر و عناصر dynamic'
      });
    }

    if (totalSize > 500000) { // Total > 500KB
      recommendations.push({
        type: 'tree-shake',
        priority: 'medium',
        description: `حجم کل bundle‌ها (${Math.round(totalSize / 1024)}KB) زیاد است`,
        estimatedSavings: totalSize * 0.2,
        implementation: 'Tree shaking و حذف کدهای استفاده نشده'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Get current performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get Web Vitals score
  getWebVitalsScore(): { score: number; grade: string; details: Record<string, any> } {
    const scores = {
      fcp: this.metrics.fcp <= 1800 ? 100 : this.metrics.fcp <= 3000 ? 50 : 0,
      lcp: this.metrics.lcp <= 2500 ? 100 : this.metrics.lcp <= 4000 ? 50 : 0,
      fid: this.metrics.fid <= 100 ? 100 : this.metrics.fid <= 300 ? 50 : 0,
      cls: this.metrics.cls <= 0.1 ? 100 : this.metrics.cls <= 0.25 ? 50 : 0
    };

    const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 4;
    
    let grade = 'F';
    if (averageScore >= 90) grade = 'A';
    else if (averageScore >= 80) grade = 'B';
    else if (averageScore >= 70) grade = 'C';
    else if (averageScore >= 60) grade = 'D';

    return {
      score: Math.round(averageScore),
      grade,
      details: {
        fcp: { value: this.metrics.fcp, score: scores.fcp, unit: 'ms' },
        lcp: { value: this.metrics.lcp, score: scores.lcp, unit: 'ms' },
        fid: { value: this.metrics.fid, score: scores.fid, unit: 'ms' },
        cls: { value: this.metrics.cls, score: scores.cls, unit: '' }
      }
    };
  }

  // Generate bundle size report
  getBundleReport(): {
    totalSize: number;
    totalGzipSize: number;
    bundles: BundleInfo[];
    largestBundles: BundleInfo[];
    recommendations: OptimizationRecommendation[];
  } {
    const bundles = Array.from(this.bundles.values());
    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    const totalGzipSize = bundles.reduce((sum, bundle) => sum + bundle.gzipSize, 0);
    const largestBundles = bundles
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    return {
      totalSize,
      totalGzipSize,
      bundles,
      largestBundles,
      recommendations: this.generateRecommendations()
    };
  }

  // Clean up
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// React hook for bundle analysis
export const useBundleAnalyzer = () => {
  const [report, setReport] = React.useState(() => bundleAnalyzer.getBundleReport());
  const [webVitals, setWebVitals] = React.useState(() => bundleAnalyzer.getWebVitalsScore());

  React.useEffect(() => {
    const updateReport = () => {
      setReport(bundleAnalyzer.getBundleReport());
      setWebVitals(bundleAnalyzer.getWebVitalsScore());
    };

    const interval = setInterval(updateReport, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const analyzeBundle = React.useCallback((name: string, modules: string[]) => {
    return bundleAnalyzer.analyzeBundle(name, modules);
  }, []);

  return {
    report,
    webVitals,
    analyzeBundle,
    getMetrics: () => bundleAnalyzer.getPerformanceMetrics()
  };
};

export default BundleAnalyzer;