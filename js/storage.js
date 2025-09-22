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
        
        try {
            // Clear cache to ensure fresh data
            this.cache.clear();
            
            // Clear any browser cache for index files
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            
            // Load master index first
            this.masterIndex = await this.loadJSON('data/index/master.json');
            
            // Force reload of resources index
            
            // Load core indexes
            await this.loadIndexes();
            
            this.isInitialized = true;
            const loadTime = performance.now() - startTime;
            
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
                    
                    // Debug resources index
                    if (name === 'resources') {
                        const hasNewResources = ['Claim', 'Invoice', 'EnrollmentRequest'].some(r => 
                            this.indexes[name].bySpec['fhir-r4']?.includes(r)
                        );
                    }
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
            // Add cache busting for index files to ensure fresh data
            const cacheBuster = path.includes('index/') ? `?t=${Date.now()}&r=${Math.random()}` : '';
            const response = await fetch(`./${path}${cacheBuster}`);
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
        
        const resource = await this.loadJSON(`data/${resourceInfo.file}`);
        
        // Check if this is a raw StructureDefinition that needs processing
        if (resource.resourceType === 'StructureDefinition' && !resource.elements) {
            const processedResource = this.processStructureDefinition(resource);
            return processedResource;
        }
        
        return resource;
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

    // Process raw StructureDefinition JSON into application format
    processStructureDefinition(structureDefinition) {
        const elements = [];
        
        // Use differential elements if available, otherwise use snapshot
        const sourceElements = structureDefinition.differential?.element || 
                              structureDefinition.snapshot?.element || [];
        
        
        sourceElements.forEach((element, index) => {
            // Skip the root element (usually just the resource type itself)
            if (element.path && !element.path.includes('.')) {
                return;
            }
            
            const processedElement = {
                path: element.path || '',
                name: this.extractElementName(element.path),
                cardinality: this.formatCardinality(element.min, element.max),
                type: this.extractElementType(element),
                description: element.short || element.definition || '',
                mustSupport: element.mustSupport || false,
                binding: element.binding ? {
                    strength: element.binding.strength,
                    valueSet: element.binding.valueSet
                } : null,
                constraints: element.constraint || [],
                slicing: element.slicing || null,
                isExtension: element.path?.includes('extension'),
                level: this.calculateElementLevel(element.path)
            };
            
            elements.push(processedElement);
        });
        
        // Create the processed resource in application format
        // Determine if this is a profile by checking the URL or baseDefinition
        const isUSCoreProfile = structureDefinition.url?.includes('/us/core/') || 
                               structureDefinition.baseDefinition?.includes('/us/core/') ||
                               structureDefinition.name?.includes('USCore') ||
                               structureDefinition.id?.includes('us-core');
        
        return {
            name: structureDefinition.name || structureDefinition.id,
            title: structureDefinition.title || structureDefinition.name,
            description: structureDefinition.description,
            type: isUSCoreProfile ? 'profile' : (structureDefinition.kind === 'resource' ? 'resource' : 'profile'),
            baseDefinition: structureDefinition.baseDefinition,
            elements: elements,
            mustSupportCount: elements.filter(el => el.mustSupport).length,
            fhirVersion: structureDefinition.fhirVersion,
            url: structureDefinition.url
        };
    }

    extractElementName(path) {
        if (!path) return '';
        const parts = path.split('.');
        return parts[parts.length - 1];
    }

    formatCardinality(min, max) {
        if (min === undefined && max === undefined) return '';
        const minStr = min !== undefined ? min.toString() : '0';
        const maxStr = max === '*' ? '*' : (max !== undefined ? max.toString() : '1');
        return `${minStr}..${maxStr}`;
    }

    extractElementType(element) {
        if (!element.type || element.type.length === 0) return '';
        
        // Handle multiple types
        if (element.type.length === 1) {
            const type = element.type[0];
            return type.code + (type.profile ? ` (${type.profile.split('/').pop()})` : '');
        } else {
            return element.type.map(t => t.code).join(' | ');
        }
    }

    calculateElementLevel(path) {
        if (!path) return 0;
        return path.split('.').length - 1;
    }

    // Cache Management
    clearCache() {
        this.cache.clear();
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
    }
}

// Export for use in other modules
window.FHIRStorage = FHIRStorage;