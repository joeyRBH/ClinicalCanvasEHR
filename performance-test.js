// ClinicalCanvas Performance Testing Script
// Run this in browser console to test performance improvements

console.log('🚀 ClinicalCanvas Performance Testing');

// Performance Test Suite
class PerformanceTester {
    constructor() {
        this.results = {};
        this.startTime = performance.now();
    }

    // Test 1: Page Load Performance
    testPageLoad() {
        console.log('\n📊 Test 1: Page Load Performance');
        
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
            const metrics = {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
            };
            
            console.log('✅ Page Load Metrics:', metrics);
            this.results.pageLoad = metrics;
            
            // Performance scoring
            const score = this.calculatePageLoadScore(metrics);
            console.log(`📈 Page Load Score: ${score}/100`);
            
            return score;
        } else {
            console.log('❌ No navigation timing data available');
            return 0;
        }
    }

    // Test 2: JavaScript Performance
    testJavaScriptPerformance() {
        console.log('\n⚡ Test 2: JavaScript Performance');
        
        const startTime = performance.now();
        
        // Test DOM operations
        const testElement = document.createElement('div');
        testElement.innerHTML = '<span>Test</span>';
        document.body.appendChild(testElement);
        document.body.removeChild(testElement);
        
        const domTime = performance.now() - startTime;
        
        // Test array operations
        const arrayStart = performance.now();
        const testArray = Array.from({length: 1000}, (_, i) => i);
        const filtered = testArray.filter(x => x % 2 === 0);
        const mapped = filtered.map(x => x * 2);
        const arrayTime = performance.now() - arrayStart;
        
        const metrics = {
            domOperations: domTime,
            arrayOperations: arrayTime,
            total: domTime + arrayTime
        };
        
        console.log('✅ JavaScript Performance:', metrics);
        this.results.javaScript = metrics;
        
        const score = this.calculateJavaScriptScore(metrics);
        console.log(`📈 JavaScript Score: ${score}/100`);
        
        return score;
    }

    // Test 3: Memory Usage
    testMemoryUsage() {
        console.log('\n🧠 Test 3: Memory Usage');
        
        if ('memory' in performance) {
            const memory = performance.memory;
            const metrics = {
                usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
                totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
                jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
            };
            
            console.log('✅ Memory Usage:', metrics);
            this.results.memory = metrics;
            
            const score = this.calculateMemoryScore(metrics);
            console.log(`📈 Memory Score: ${score}/100`);
            
            return score;
        } else {
            console.log('❌ Memory API not available');
            return 0;
        }
    }

    // Test 4: Service Worker Performance
    testServiceWorker() {
        console.log('\n🔧 Test 4: Service Worker Performance');
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration()
                .then(registration => {
                    if (registration) {
                        console.log('✅ Service Worker is registered');
                        console.log('✅ Service Worker state:', registration.active?.state);
                        this.results.serviceWorker = { registered: true, state: registration.active?.state };
                        return 100;
                    } else {
                        console.log('❌ Service Worker not registered');
                        this.results.serviceWorker = { registered: false };
                        return 0;
                    }
                })
                .catch(error => {
                    console.log('❌ Service Worker error:', error);
                    this.results.serviceWorker = { error: error.message };
                    return 0;
                });
        } else {
            console.log('❌ Service Worker not supported');
            this.results.serviceWorker = { supported: false };
            return 0;
        }
    }

    // Test 5: Network Performance
    testNetworkPerformance() {
        console.log('\n🌐 Test 5: Network Performance');
        
        const startTime = performance.now();
        
        // Test API response time
        fetch('/api/health')
            .then(response => {
                const networkTime = performance.now() - startTime;
                const metrics = {
                    apiResponseTime: networkTime,
                    status: response.status,
                    ok: response.ok
                };
                
                console.log('✅ Network Performance:', metrics);
                this.results.network = metrics;
                
                const score = this.calculateNetworkScore(metrics);
                console.log(`📈 Network Score: ${score}/100`);
                
                return score;
            })
            .catch(error => {
                console.log('❌ Network test failed:', error);
                this.results.network = { error: error.message };
                return 0;
            });
    }

    // Test 6: User Interaction Performance
    testUserInteraction() {
        console.log('\n👆 Test 6: User Interaction Performance');
        
        const startTime = performance.now();
        
        // Test button click performance
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Button';
        testButton.onclick = () => {
            const clickTime = performance.now() - startTime;
            console.log('✅ Button click response time:', clickTime + 'ms');
            
            const score = this.calculateInteractionScore(clickTime);
            console.log(`📈 Interaction Score: ${score}/100`);
            
            this.results.interaction = { clickTime };
            document.body.removeChild(testButton);
            
            return score;
        };
        
        document.body.appendChild(testButton);
        console.log('Click the test button to measure interaction performance');
    }

    // Calculate performance scores
    calculatePageLoadScore(metrics) {
        let score = 100;
        
        if (metrics.domContentLoaded > 1000) score -= 20;
        if (metrics.loadComplete > 2000) score -= 20;
        if (metrics.firstPaint > 500) score -= 15;
        if (metrics.firstContentfulPaint > 1000) score -= 15;
        
        return Math.max(0, score);
    }

    calculateJavaScriptScore(metrics) {
        let score = 100;
        
        if (metrics.domOperations > 10) score -= 20;
        if (metrics.arrayOperations > 5) score -= 20;
        if (metrics.total > 15) score -= 10;
        
        return Math.max(0, score);
    }

    calculateMemoryScore(metrics) {
        let score = 100;
        
        if (metrics.usedJSHeapSize > 50) score -= 20;
        if (metrics.usedJSHeapSize > 100) score -= 30;
        if (metrics.usedJSHeapSize > 200) score -= 30;
        
        return Math.max(0, score);
    }

    calculateNetworkScore(metrics) {
        let score = 100;
        
        if (metrics.apiResponseTime > 500) score -= 20;
        if (metrics.apiResponseTime > 1000) score -= 30;
        if (metrics.apiResponseTime > 2000) score -= 30;
        if (!metrics.ok) score -= 20;
        
        return Math.max(0, score);
    }

    calculateInteractionScore(clickTime) {
        let score = 100;
        
        if (clickTime > 100) score -= 20;
        if (clickTime > 200) score -= 30;
        if (clickTime > 500) score -= 30;
        
        return Math.max(0, score);
    }

    // Run all tests
    async runAllTests() {
        console.log('🧪 Running all performance tests...\n');
        
        const pageLoadScore = this.testPageLoad();
        const jsScore = this.testJavaScriptPerformance();
        const memoryScore = this.testMemoryUsage();
        const swScore = await this.testServiceWorker();
        this.testNetworkPerformance();
        this.testUserInteraction();
        
        // Calculate overall score
        const overallScore = Math.round((pageLoadScore + jsScore + memoryScore + swScore) / 4);
        
        console.log('\n📊 Overall Performance Results:');
        console.log('================================');
        console.log(`Page Load: ${pageLoadScore}/100`);
        console.log(`JavaScript: ${jsScore}/100`);
        console.log(`Memory: ${memoryScore}/100`);
        console.log(`Service Worker: ${swScore}/100`);
        console.log(`Overall Score: ${overallScore}/100`);
        
        // Performance recommendations
        this.generateRecommendations(overallScore);
        
        return {
            overallScore,
            results: this.results
        };
    }

    generateRecommendations(score) {
        console.log('\n💡 Performance Recommendations:');
        console.log('================================');
        
        if (score >= 90) {
            console.log('🎉 Excellent performance! Your site is optimized.');
        } else if (score >= 70) {
            console.log('✅ Good performance with room for improvement.');
            console.log('💡 Consider: Code splitting, image optimization, caching');
        } else if (score >= 50) {
            console.log('⚠️ Moderate performance issues detected.');
            console.log('💡 Consider: Service worker, lazy loading, minification');
        } else {
            console.log('❌ Significant performance issues detected.');
            console.log('💡 Consider: Complete performance audit and optimization');
        }
    }
}

// Auto-run performance tests
const tester = new PerformanceTester();
tester.runAllTests();

// Export for manual testing
window.performanceTester = tester;

console.log('\n💡 Manual testing available via window.performanceTester object');

