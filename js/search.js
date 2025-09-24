// Search and Filter Functionality
class SearchManager {
    constructor(app) {
        this.app = app;
        this.searchIndex = new Map();
        this.searchHistory = [];
        this.currentQuery = '';
        this.filters = {
            spec: 'all',
            type: 'all',
            mustSupport: false
        };
        
        this.setupSearch();
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearButton = document.getElementById('clearSearch');
        
        if (!searchInput || !clearButton) {
            console.error('Search elements not found');
            return;
        }
        
        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
                this.toggleClearButton(e.target.value);
            }, 300);
        });
        
        // Search on enter
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(e.target.value);
            }
            
            // Clear search on escape
            if (e.key === 'Escape') {
                this.clearSearch();
            }
            
            // Search history navigation
            if (e.key === 'ArrowUp' && e.ctrlKey) {
                e.preventDefault();
                this.navigateSearchHistory(-1);
            }
            if (e.key === 'ArrowDown' && e.ctrlKey) {
                e.preventDefault();
                this.navigateSearchHistory(1);
            }
        });
        
        // Clear button
        clearButton.addEventListener('click', () => {
            this.clearSearch();
        });
        
        // Spec filter removed - no longer needed
        
        // Initialize clear button visibility
        this.toggleClearButton('');
    }

    buildSearchIndex(data) {
        this.searchIndex.clear();
        
        Object.keys(data).forEach(specType => {
            Object.keys(data[specType]).forEach(resourceName => {
                const resource = data[specType][resourceName];
                const searchableContent = this.extractSearchableContent(resource, resourceName, specType);
                
                this.searchIndex.set(`${specType}:${resourceName}`, {
                    resource: resourceName,
                    spec: specType,
                    data: resource,
                    searchableContent: searchableContent.toLowerCase(),
                    keywords: this.extractKeywords(searchableContent)
                });
            });
        });
    }

    extractSearchableContent(resource, resourceName, specType) {
        let content = [
            resourceName,
            resource.name || '',
            resource.description || '',
            resource.type || '',
            specType
        ];
        
        // Add element names and descriptions
        if (resource.elements) {
            resource.elements.forEach(element => {
                content.push(element.name || '');
                content.push(element.description || '');
                content.push(element.type || '');
                content.push(element.path || '');
            });
        }
        
        // Add profile-specific content
        if (resource.baseResource) {
            content.push(resource.baseResource);
        }
        
        return content.join(' ').replace(/\s+/g, ' ').trim();
    }

    extractKeywords(content) {
        // Extract meaningful keywords from content
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2) // Filter out very short words
            .filter(word => !this.isStopWord(word));
        
        // Return unique keywords
        return [...new Set(words)];
    }

    isStopWord(word) {
        const stopWords = new Set([
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
        ]);
        return stopWords.has(word);
    }

    performSearch(query) {
        this.currentQuery = query.trim();
        
        if (!this.currentQuery) {
            this.clearSearchResults();
            return;
        }
        
        // Add to search history
        if (!this.searchHistory.includes(this.currentQuery)) {
            this.searchHistory.unshift(this.currentQuery);
            if (this.searchHistory.length > 10) {
                this.searchHistory.pop();
            }
        }
        
        const results = this.search(this.currentQuery);
        this.displaySearchResults(results);
    }

    search(query) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        const results = [];
        
        this.searchIndex.forEach((item, key) => {
            const score = this.calculateRelevanceScore(item, searchTerms);
            if (score > 0) {
                results.push({
                    ...item,
                    score: score,
                    key: key
                });
            }
        });
        
        // Sort by relevance score (highest first)
        results.sort((a, b) => b.score - a.score);
        
        // Apply filters
        return this.applyFilters(results);
    }

    calculateRelevanceScore(item, searchTerms) {
        let score = 0;
        const content = item.searchableContent;
        const keywords = item.keywords;
        
        searchTerms.forEach(term => {
            // Exact matches in resource name (highest priority)
            if (item.resource.toLowerCase().includes(term)) {
                score += 100;
            }
            
            // Matches in keywords (high priority)
            if (keywords.some(keyword => keyword.includes(term))) {
                score += 50;
            }
            
            // Partial matches in content (medium priority)
            if (content.includes(term)) {
                score += 25;
            }
            
            // Fuzzy matches (low priority)
            if (this.fuzzyMatch(term, content)) {
                score += 10;
            }
        });
        
        // Boost scores for certain types
        if (item.data.type === 'profile') {
            score *= 1.2; // Boost US Core profiles
        }
        
        if (item.data.mustSupport) {
            score *= 1.1; // Boost must-support elements
        }
        
        return score;
    }

    fuzzyMatch(term, content, threshold = 0.8) {
        const words = content.split(/\s+/);
        return words.some(word => {
            if (word.length < 3) return false;
            const similarity = this.calculateSimilarity(term, word);
            return similarity >= threshold;
        });
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    applyFilters(results) {
        return results.filter(result => {
            // Spec filter
            if (this.filters.spec !== 'all' && result.spec !== this.filters.spec) {
                return false;
            }
            
            // Type filter
            if (this.filters.type !== 'all' && result.data.type !== this.filters.type) {
                return false;
            }
            
            // Must support filter
            if (this.filters.mustSupport && !result.data.mustSupport) {
                return false;
            }
            
            return true;
        });
    }

    displaySearchResults(results) {
        // Update tree to show only matching results
        const filteredData = this.createFilteredDataFromResults(results);
        this.app.updateFilteredData(filteredData);
        
        // Show search results summary
        this.showSearchSummary(results.length);
        
        // Highlight search terms after navigation tree is rendered
        setTimeout(() => {
            this.highlightSearchTerms(this.currentQuery);
        }, 200);
        
        // Auto-select first result if only one match
        if (results.length === 1) {
            const result = results[0];
            setTimeout(() => {
                this.app.selectResource(result.resource, result.spec);
                this.app.navigationManager.highlightNode(result.resource, result.spec);
            }, 300);
        }
    }

    createFilteredDataFromResults(results) {
        const filtered = {};
        
        results.forEach(result => {
            // All results stay in their original spec section
            const targetSpec = result.spec;
            
            if (!filtered[targetSpec]) {
                filtered[targetSpec] = {};
            }
            filtered[targetSpec][result.resource] = result.data;
        });
        
        return filtered;
    }

    showSearchSummary(count) {
        // Remove existing search summary
        const existingSummary = document.querySelector('.search-summary');
        if (existingSummary) {
            existingSummary.remove();
        }
        
        if (count === 0 && this.currentQuery) {
            // Show no results message
            const summary = document.createElement('div');
            summary.className = 'search-summary no-results';
            summary.innerHTML = `
                <p>No results found for "${this.currentQuery}"</p>
                <p>Try a different search term or check your spelling.</p>
            `;
            
            document.getElementById('resourceTree').prepend(summary);
        } else if (this.currentQuery) {
            // Show results count
            const summary = document.createElement('div');
            summary.className = 'search-summary';
            summary.innerHTML = `
                <div class="search-results-header">
                    <span class="search-results-text">Found ${count} result${count !== 1 ? 's' : ''} for "${this.currentQuery}"</span>
                    <button onclick="app.searchManager.clearSearch()" class="clear-search-circular" title="Clear Search">⊗</button>
                </div>
            `;
            
            document.getElementById('resourceTree').prepend(summary);
        }
    }

    highlightSearchTerms(query) {
        if (!query) return;
        
        const terms = query.toLowerCase().split(/\s+/);
        const treeItems = document.querySelectorAll('.tree-label');
        
        treeItems.forEach(label => {
            const originalText = label.textContent;
            let highlightedText = originalText;
            
            terms.forEach(term => {
                const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
                highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
            });
            
            if (highlightedText !== originalText) {
                label.innerHTML = highlightedText;
            }
        });
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    toggleClearButton(query) {
        const clearButton = document.getElementById('clearSearch');
        if (query && query.trim()) {
            clearButton.classList.add('visible');
        } else {
            clearButton.classList.remove('visible');
        }
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.currentQuery = '';
        this.toggleClearButton('');
        this.clearSearchResults();
    }

    clearSearchResults() {
        // Remove search summary
        const summary = document.querySelector('.search-summary');
        if (summary) {
            summary.remove();
        }
        
        // Clear highlights
        document.querySelectorAll('.tree-label mark').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
        
        // Restore full data
        this.app.updateFilteredData(this.app.fhirData);
    }

    updateFilter(filterType, value) {
        this.filters[filterType] = value;
        
        if (this.currentQuery) {
            this.performSearch(this.currentQuery);
        } else {
            // Apply filters to current view
            const filteredData = this.applyFiltersToData(this.app.fhirData);
            this.app.updateFilteredData(filteredData);
        }
    }

    applyFiltersToData(data) {
        const filtered = {};
        
        Object.keys(data).forEach(spec => {
            // Spec filter
            if (this.filters.spec !== 'all' && spec !== this.filters.spec) {
                return;
            }
            
            const specData = {};
            Object.keys(data[spec]).forEach(resourceName => {
                const resource = data[spec][resourceName];
                
                if (this.filters.type !== 'all' && resource.type !== this.filters.type) {
                    return;
                }
                
                if (this.filters.mustSupport && !resource.mustSupport) {
                    return;
                }
                
                specData[resourceName] = resource;
            });
            
            if (Object.keys(specData).length > 0) {
                filtered[spec] = specData;
            }
        });
        
        return filtered;
    }

    navigateSearchHistory(direction) {
        const input = document.getElementById('searchInput');
        
        if (this.searchHistory.length === 0) return;
        
        const currentIndex = this.searchHistory.indexOf(input.value);
        let newIndex;
        
        if (direction === -1) { // Up arrow
            newIndex = currentIndex > 0 ? currentIndex - 1 : this.searchHistory.length - 1;
        } else { // Down arrow
            newIndex = currentIndex < this.searchHistory.length - 1 ? currentIndex + 1 : 0;
        }
        
        input.value = this.searchHistory[newIndex];
        this.performSearch(input.value);
    }

    getSearchSuggestions(query) {
        const suggestions = new Set();
        const queryLower = query.toLowerCase();
        
        this.searchIndex.forEach(item => {
            // Add matching keywords
            item.keywords.forEach(keyword => {
                if (keyword.startsWith(queryLower) && keyword !== queryLower) {
                    suggestions.add(keyword);
                }
            });
            
            // Add matching resource names
            if (item.resource.toLowerCase().includes(queryLower)) {
                suggestions.add(item.resource);
            }
        });
        
        return Array.from(suggestions).slice(0, 5); // Limit to 5 suggestions
    }

    exportSearchResults(results) {
        const exportData = results.map(result => ({
            resource: result.resource,
            spec: result.spec,
            type: result.data.type,
            description: result.data.description,
            score: result.score
        }));
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fhir-search-results-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// Export for use in other modules
window.SearchManager = SearchManager;