// Examples Loader and Management
class ExamplesLoader {
    constructor(app) {
        this.app = app;
        this.examplesIndex = null;
        this.cachedExamples = new Map();
        this.currentActiveTab = 'definition';
    }

    async initialize() {
        try {
            const response = await fetch('data/examples/index.json');
            if (!response.ok) {
                throw new Error(`Failed to load examples index: ${response.status}`);
            }
            this.examplesIndex = await response.json();
            this.setupTabEventListeners();
        } catch (error) {
            console.error('Error loading examples index:', error);
            this.examplesIndex = null;
        }
    }

    setupTabEventListeners() {
        const definitionTab = document.getElementById('definitionTab');
        const examplesTab = document.getElementById('examplesTab');

        if (definitionTab) {
            definitionTab.addEventListener('click', () => this.switchTab('definition'));
        }

        if (examplesTab) {
            examplesTab.addEventListener('click', () => this.switchTab('examples'));
        }
    }

    switchTab(tabName) {
        const definitionTab = document.getElementById('definitionTab');
        const examplesTab = document.getElementById('examplesTab');
        const resourceContent = document.getElementById('resourceContent');
        const examplesContent = document.getElementById('examplesContent');

        // Update tab states
        if (tabName === 'definition') {
            definitionTab.classList.add('active');
            examplesTab.classList.remove('active');
            resourceContent.style.display = 'block';
            examplesContent.style.display = 'none';
        } else if (tabName === 'examples') {
            definitionTab.classList.remove('active');
            examplesTab.classList.add('active');
            resourceContent.style.display = 'none';
            examplesContent.style.display = 'block';
            
            // Load examples for current resource
            if (this.app.currentResource) {
                this.loadExamplesForResource(this.app.currentResource.name);
            }
        }
        
        this.currentActiveTab = tabName;
    }

    updateExamplesCount(resourceType, count) {
        const examplesCount = document.getElementById('examplesCount');
        const tabNavigation = document.getElementById('tabNavigation');
        
        if (count === 0) {
            // Hide the examples tab if no valid examples
            tabNavigation.style.display = 'none';
        } else {
            examplesCount.textContent = count;
            examplesCount.style.display = 'inline-block';
        }
    }

    showTabsForResource(resourceName) {
        const tabNavigation = document.getElementById('tabNavigation');
        const examplesCount = document.getElementById('examplesCount');
        
        if (!this.examplesIndex) {
            tabNavigation.style.display = 'none';
            return;
        }

        // Check if we have examples for this resource type
        const examples = this.getExamplesForResourceType(resourceName);
        if (examples && examples.length > 0) {
            tabNavigation.style.display = 'flex';
            examplesCount.textContent = examples.length;
            examplesCount.style.display = 'inline-block';
        } else {
            tabNavigation.style.display = 'none';
        }

        // Reset to definition tab when switching resources
        this.switchTab('definition');
    }

    hideTabsForWelcome() {
        const tabNavigation = document.getElementById('tabNavigation');
        tabNavigation.style.display = 'none';
        
        // Ensure we're on definition tab
        this.switchTab('definition');
    }

    getExamplesForResourceType(resourceType) {
        if (!this.examplesIndex || !this.examplesIndex.examplesByResourceType) {
            return [];
        }
        return this.examplesIndex.examplesByResourceType[resourceType] || [];
    }

    async loadExamplesForResource(resourceType) {
        const examplesContent = document.getElementById('examplesContent');
        
        try {
            examplesContent.innerHTML = '<div class="examples-loading">Loading examples...</div>';
            
            const examples = this.getExamplesForResourceType(resourceType);
            
            if (!examples || examples.length === 0) {
                examplesContent.innerHTML = this.renderNoExamples(resourceType);
                return;
            }

            // Load the actual example files
            const loadedExamples = await Promise.all(
                examples.map(example => this.loadExampleFile(example))
            );

            // Filter out any examples that failed to load
            const validExamples = loadedExamples.filter(example => example !== null);
            
            // If no examples loaded successfully, update the tab count
            if (validExamples.length === 0) {
                this.updateExamplesCount(resourceType, 0);
            }
            
            if (validExamples.length === 0) {
                examplesContent.innerHTML = this.renderNoExamples(resourceType);
                return;
            }

            examplesContent.innerHTML = this.renderExamples(validExamples, resourceType);
            
            // Apply Prism.js syntax highlighting
            if (window.Prism) {
                window.Prism.highlightAll();
            }
            
            // Set up event delegation for copy buttons
            this.setupCopyButtonHandlers();
            
        } catch (error) {
            examplesContent.innerHTML = this.renderExampleError(error);
        }
    }

    async loadExampleFile(exampleMeta) {
        const cacheKey = exampleMeta.file;
        
        // Check cache first
        if (this.cachedExamples.has(cacheKey)) {
            return { ...exampleMeta, data: this.cachedExamples.get(cacheKey) };
        }

        try {
            const response = await fetch(`data/examples/${exampleMeta.file}`);
            if (!response.ok) {
                throw new Error(`Failed to load example: ${response.status}`);
            }
            
            const data = await response.json();
            this.cachedExamples.set(cacheKey, data);
            
            return { ...exampleMeta, data };
        } catch (error) {
            return null;
        }
    }

    renderExamples(examples, resourceType) {
        const header = `
            <div class="examples-header">
                <h3>Examples for ${resourceType}</h3>
                <p>Real-world examples from the US Core Implementation Guide</p>
            </div>
        `;

        const examplesGrid = `
            <div class="examples-grid">
                ${examples.map(example => this.renderExampleCard(example)).join('')}
            </div>
        `;

        return header + examplesGrid;
    }

    cleanExampleForDisplay(data) {
        // Create a deep copy to avoid modifying the original
        const cleaned = JSON.parse(JSON.stringify(data));
        
        // Remove the text.div field which contains lengthy HTML
        if (cleaned.text && cleaned.text.div) {
            // Keep the status but remove the div
            cleaned.text = {
                status: cleaned.text.status,
                "div": "[HTML content hidden for readability - view full example to see narrative text]"
            };
        }
        
        return cleaned;
    }

    renderExampleCard(example) {
        // Create a cleaned version without the text.div for better readability
        const cleanedData = this.cleanExampleForDisplay(example.data);
        const jsonString = JSON.stringify(cleanedData, null, 2);

        return `
            <div class="example-card">
                <div class="example-header">
                    <h4 class="example-title">${this.escapeHtml(example.title)}</h4>
                    <p class="example-description">${this.escapeHtml(example.description)}</p>
                </div>
                
                <div class="example-content">
                    <pre class="example-json"><code class="language-json">${this.escapeHtml(jsonString)}</code></pre>
                    ${cleanedData.text && cleanedData.text.div && cleanedData.text.div.includes('[HTML content hidden') ? 
                        '<p class="narrative-note"><small>💡 <strong>Note:</strong> This example contains a <code>text.div</code> field with HTML narrative content (hidden for readability). The narrative provides a human-readable summary of the resource data.</small></p>' : ''}
                </div>
                
                <div class="example-actions">
                    <button class="example-button primary" data-example-id="${example.id}" data-action="copy">
                        📋 Copy JSON
                    </button>
                </div>
            </div>
        `;
    }

    renderNoExamples(resourceType) {
        return `
            <div class="no-examples">
                <h3>No Examples Available</h3>
                <p>There are currently no examples available for <strong>${resourceType}</strong> resources.</p>
                <p>Examples help you understand how to use this resource type in real-world scenarios.</p>
            </div>
        `;
    }

    renderExampleError(error) {
        return `
            <div class="no-examples">
                <h3>Error Loading Examples</h3>
                <p>There was an error loading examples: ${this.escapeHtml(error.message)}</p>
                <p>Please try again later or check the browser console for more details.</p>
            </div>
        `;
    }

    async copyToClipboard(exampleId) {
        try {
            // Find the example in our loaded data
            const example = this.findExampleById(exampleId);
            if (!example) {
                console.error('Example not found for ID:', exampleId);
                console.error('Available examples:', Array.from(this.cachedExamples.keys()));
                throw new Error(`Example not found: ${exampleId}`);
            }

            const jsonString = JSON.stringify(example.data, null, 2);
            
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(jsonString);
            } else {
                // Fallback for older browsers or non-HTTPS
                this.fallbackCopyToClipboard(jsonString);
            }
            
            // Show success feedback
            this.showCopyFeedback(exampleId, true);
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            this.showCopyFeedback(exampleId, false);
        }
    }

    fallbackCopyToClipboard(text) {
        // Create a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('Fallback copy failed');
            }
        } finally {
            document.body.removeChild(textArea);
        }
    }

    setupCopyButtonHandlers() {
        const examplesContent = document.getElementById('examplesContent');
        if (!examplesContent) return;
        
        // Remove any existing listeners to prevent duplicates
        examplesContent.removeEventListener('click', this.handleCopyButtonClick);
        
        // Add event delegation for copy buttons
        this.handleCopyButtonClick = (event) => {
            const button = event.target.closest('[data-action="copy"]');
            if (button) {
                event.preventDefault();
                const exampleId = button.getAttribute('data-example-id');
                if (exampleId) {
                    this.copyToClipboard(exampleId);
                }
            }
        };
        
        examplesContent.addEventListener('click', this.handleCopyButtonClick);
    }

    findExampleById(exampleId) {
        // First, try to find it by directly looking through all resource types in the index
        if (this.examplesIndex && this.examplesIndex.examplesByResourceType) {
            for (const [resourceType, examples] of Object.entries(this.examplesIndex.examplesByResourceType)) {
                const exampleMeta = examples.find(e => e.id === exampleId);
                if (exampleMeta) {
                    // Get the cached data for this example
                    const cachedData = this.cachedExamples.get(exampleMeta.file);
                    if (cachedData) {
                        return { ...exampleMeta, data: cachedData };
                    }
                }
            }
        }
        
        // Fallback: Search through cached examples (old method)
        for (const [key, data] of this.cachedExamples) {
            // Get the resource type from the filename
            const resourceType = key.split('-')[0];
            const examples = this.getExamplesForResourceType(resourceType);
            const exampleMeta = examples.find(e => e.id === exampleId);
            
            if (exampleMeta) {
                return { ...exampleMeta, data };
            }
        }
        
        console.error('Could not find example with ID:', exampleId);
        return null;
    }

    showCopyFeedback(exampleId, success) {
        // Find the copy button and show feedback
        const button = document.querySelector(`[data-example-id="${exampleId}"][data-action="copy"]`);
        if (button && button.textContent.includes('Copy')) {
            const originalText = button.textContent;
            button.textContent = success ? '✅ Copied!' : '❌ Failed';
            button.disabled = true;
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }
    }


    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make it available globally for onclick handlers
window.fhirViewer = window.fhirViewer || {};