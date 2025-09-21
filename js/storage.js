// FHIR Local Storage System
class FHIRStorage {
    constructor() {
        this.cache = new Map();
        this.indexes = {};
        this.isInitialized = false;
        this.loadingPromises = new Map();
        
        // Performance metrics
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            loadTimes: [],
            queryTimes: []
        };
    }

    async initialize() {
        if (this.isInitialized) return;
        
        const startTime = performance.now();
        console.log('Initializing FHIR Storage System...');
        
        try {
            // Load master index first
            this.masterIndex = await this.loadJSON('data/index/master.json');
            console.log('Master index loaded:', this.masterIndex);
            
            // Load core indexes
            await this.loadIndexes();
            
            this.isInitialized = true;
            const loadTime = performance.now() - startTime;
            console.log(`Storage system initialized in ${loadTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error('Failed to initialize storage system:', error);
            throw error;
        }
    }

    async loadIndexes() {
        const indexPromises = Object.entries(this.masterIndex.indexes).map(
            async ([name, path]) => {
                try {
                    this.indexes[name] = await this.loadJSON(`data/${path}`);
                    console.log(`Index '${name}' loaded`);
                } catch (error) {
                    console.warn(`Failed to load index '${name}':`, error);
                    this.indexes[name] = {};
                }
            }
        );
        
        await Promise.all(indexPromises);
    }

    async loadJSON(path) {
        // Check cache first
        if (this.cache.has(path)) {
            this.metrics.cacheHits++;
            return this.cache.get(path);
        }
        
        // Check if already loading
        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path);
        }
        
        // Start loading
        const loadPromise = this._fetchJSON(path);
        this.loadingPromises.set(path, loadPromise);
        
        try {
            const data = await loadPromise;
            this.cache.set(path, data);
            this.metrics.cacheMisses++;
            return data;
        } finally {
            this.loadingPromises.delete(path);
        }
    }

    async _fetchJSON(path) {
        const startTime = performance.now();
        
        try {
            const response = await fetch(`./${path}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const loadTime = performance.now() - startTime;
            this.metrics.loadTimes.push(loadTime);
            
            return data;
        } catch (error) {
            console.error(`Failed to load ${path}:`, error);
            throw error;
        }
    }

    // Resource Operations
    async getResource(name, spec = null) {
        await this.initialize();
        
        const resourceInfo = this.findResourceInfo(name, spec);
        if (!resourceInfo) {
            throw new Error(`Resource '${name}' not found`);
        }
        
        return await this.loadJSON(`data/${resourceInfo.file}`);
    }

    async getResourceList(spec = null) {
        await this.initialize();
        
        if (!this.indexes.resources) {
            return [];
        }
        
        if (spec) {
            return this.indexes.resources.bySpec[spec] || [];
        }
        
        return Object.keys(this.indexes.resources.byName);
    }

    findResourceInfo(name, spec = null) {
        if (!this.indexes.resources || !this.indexes.resources.byName[name]) {
            return null;
        }
        
        const resource = this.indexes.resources.byName[name];
        
        // If spec specified, verify it matches
        if (spec && resource.spec !== spec) {
            return null;
        }
        
        return resource;
    }

    // Search Operations
    async searchResources(query, options = {}) {
        const startTime = performance.now();
        await this.initialize();
        
        const {
            spec = null,
            type = null,
            mustSupport = false,
            limit = 50
        } = options;
        
        let results = [];
        
        if (!this.indexes.elements) {
            return results;
        }
        
        const queryLower = query.toLowerCase();
        
        // Search in resource names
        Object.entries(this.indexes.resources.byName).forEach(([name, info]) => {
            if (name.toLowerCase().includes(queryLower)) {
                if (!spec || info.spec === spec) {
                    if (!type || info.type === type) {
                        results.push({
                            name,
                            spec: info.spec,
                            type: info.type,
                            score: this.calculateSearchScore(name, query, info),
                            info
                        });
                    }
                }
            }
        });
        
        // Search in elements
        if (this.indexes.elements.searchTerms) {
            Object.entries(this.indexes.elements.searchTerms).forEach(([term, resources]) => {
                if (term.includes(queryLower)) {
                    resources.forEach(resourceName => {
                        const info = this.indexes.resources.byName[resourceName];
                        if (info && (!spec || info.spec === spec)) {
                            const existing = results.find(r => r.name === resourceName);
                            if (!existing) {
                                results.push({
                                    name: resourceName,
                                    spec: info.spec,
                                    type: info.type,
                                    score: this.calculateSearchScore(term, query, info),
                                    info
                                });
                            } else {
                                existing.score += 10; // Boost for multiple matches
                            }
                        }
                    });
                }
            });
        }
        
        // Sort by score and apply limit
        results.sort((a, b) => b.score - a.score);
        results = results.slice(0, limit);
        
        const queryTime = performance.now() - startTime;
        this.metrics.queryTimes.push(queryTime);
        
        return results;
    }

    calculateSearchScore(text, query, resourceInfo) {
        let score = 0;
        const textLower = text.toLowerCase();
        const queryLower = query.toLowerCase();
        
        // Exact match
        if (textLower === queryLower) score += 100;
        
        // Starts with query
        else if (textLower.startsWith(queryLower)) score += 75;
        
        // Contains query
        else if (textLower.includes(queryLower)) score += 50;
        
        // Boost for certain types
        if (resourceInfo.type === 'profile') score *= 1.2;
        if (resourceInfo.mustSupportCount > 0) score *= 1.1;
        
        return score;
    }

    // Element Operations
    async getElementsForResource(resourceName, spec = null) {
        await this.initialize();
        
        const resource = await this.getResource(resourceName, spec);
        return resource.elements || [];
    }

    async findElementsByName(elementName) {
        await this.initialize();
        
        if (!this.indexes.elements || !this.indexes.elements.byName[elementName]) {
            return [];
        }
        
        return this.indexes.elements.byName[elementName];
    }

    // Profile Comparison
    async compareProfiles(profileName, baseResourceName) {
        await this.initialize();
        
        const [profile, baseResource] = await Promise.all([
            this.getResource(profileName),
            this.getResource(baseResourceName)
        ]);
        
        const comparison = {
            profile: profileName,
            baseResource: baseResourceName,
            addedElements: [],
            modifiedElements: [],
            mustSupportElements: [],
            constraints: []
        };
        
        const baseElements = new Map();
        (baseResource.elements || []).forEach(element => {
            baseElements.set(element.path, element);
        });
        
        (profile.elements || []).forEach(profileElement => {
            const baseElement = baseElements.get(profileElement.path);
            
            if (!baseElement) {
                comparison.addedElements.push(profileElement);
            } else {
                // Check for modifications
                const modifications = this.findElementModifications(baseElement, profileElement);
                if (modifications.length > 0) {
                    comparison.modifiedElements.push({
                        element: profileElement,
                        modifications
                    });
                }
            }
            
            // Check for must support
            if (profileElement.mustSupport) {
                comparison.mustSupportElements.push(profileElement);
            }
        });
        
        return comparison;
    }

    findElementModifications(baseElement, profileElement) {
        const modifications = [];
        
        if (baseElement.cardinality !== profileElement.cardinality) {
            modifications.push({
                type: 'cardinality',
                base: baseElement.cardinality,
                profile: profileElement.cardinality
            });
        }
        
        if (baseElement.type !== profileElement.type) {
            modifications.push({
                type: 'dataType',
                base: baseElement.type,
                profile: profileElement.type
            });
        }
        
        if (profileElement.mustSupport && !baseElement.mustSupport) {
            modifications.push({
                type: 'mustSupport',
                added: true
            });
        }
        
        return modifications;
    }

    // Cache Management
    clearCache() {
        this.cache.clear();
        console.log('Storage cache cleared');
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses),
            avgLoadTime: this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length,
            avgQueryTime: this.metrics.queryTimes.reduce((a, b) => a + b, 0) / this.metrics.queryTimes.length
        };
    }

    // Preload frequently used resources
    async preloadFrequentResources() {
        const frequentResources = [
            'Patient', 'Observation', 'Practitioner', 'Organization',
            'USCorePatient', 'USCoreObservation', 'USCorePractitioner'
        ];
        
        const preloadPromises = frequentResources.map(name => 
            this.getResource(name).catch(error => 
                console.warn(`Failed to preload ${name}:`, error)
            )
        );
        
        await Promise.all(preloadPromises);
        console.log('Frequent resources preloaded');
    }

    // Utility Methods
    getSpecifications() {
        return this.masterIndex?.specifications || {};
    }

    getSpecificationInfo(spec) {
        return this.masterIndex?.specifications[spec] || null;
    }

    async getResourcesByType(type, spec = null) {
        await this.initialize();
        
        if (!this.indexes.resources || !this.indexes.resources.byType[type]) {
            return [];
        }
        
        let resources = this.indexes.resources.byType[type];
        
        if (spec) {
            resources = resources.filter(name => {
                const info = this.indexes.resources.byName[name];
                return info && info.spec === spec;
            });
        }
        
        return resources;
    }

    // Export/Import for backup
    async exportCache() {
        const exportData = {
            timestamp: new Date().toISOString(),
            cache: Object.fromEntries(this.cache),
            metrics: this.metrics
        };
        
        return JSON.stringify(exportData);
    }

    async importCache(data) {
        const importData = JSON.parse(data);
        
        Object.entries(importData.cache).forEach(([key, value]) => {
            this.cache.set(key, value);
        });
        
        this.metrics = importData.metrics || this.metrics;
        console.log(`Cache imported from ${importData.timestamp}`);
    }
}

// Export for use in other modules
window.FHIRStorage = FHIRStorage;