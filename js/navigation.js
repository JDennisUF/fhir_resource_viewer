// Navigation and Tree Management
class NavigationManager {
    constructor(app) {
        this.app = app;
        this.expandedNodes = new Set();
        this.selectedNode = null;
        this.breadcrumbHistory = [];
        this.listenersSetup = false;
        
        this.setupKeyboardNavigation();
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    handleKeyboardNavigation(e) {
        // Don't interfere with form inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.navigateUp();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateDown();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.collapseNode();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.expandNode();
                break;
            case 'Enter':
                e.preventDefault();
                this.selectCurrentNode();
                break;
            case 'Home':
                e.preventDefault();
                this.navigateToFirst();
                break;
            case 'End':
                e.preventDefault();
                this.navigateToLast();
                break;
        }
    }

    renderNavigationTree(data) {
        const treeContainer = document.getElementById('resourceTree');
        treeContainer.innerHTML = '';
        
        if (!data) {
            treeContainer.innerHTML = '<div class="loading">No data available</div>';
            return;
        }
        
        const tree = this.createTreeStructure(data);
        treeContainer.appendChild(tree);
        
        // Restore expanded state
        this.restoreExpandedState();
        
        // Set up tree item event listeners
        this.setupTreeEventListeners();
    }

    createTreeStructure(data) {
        const container = document.createElement('div');
        container.className = 'navigation-tree';
        
        Object.keys(data).forEach(specType => {
            const specNode = this.createSpecNode(specType, data[specType]);
            container.appendChild(specNode);
        });
        
        // Add data types section if we have FHIR R4 data or if filtering for data types
        if (data['fhir-r4'] || Object.keys(data).length === 0) {
            this.createDataTypesSection().then(dataTypesNode => {
                container.appendChild(dataTypesNode);
            });
        }
        
        return container;
    }

    createSpecNode(specType, resources) {
        const specNode = document.createElement('div');
        specNode.className = 'tree-node spec-node';
        specNode.dataset.type = 'spec';
        specNode.dataset.spec = specType;
        
        const header = document.createElement('div');
        header.className = 'tree-item tree-header';
        header.setAttribute('tabindex', '0');
        header.innerHTML = `
            <span class="tree-toggle" data-toggle="${specType}">▶</span>
            <span class="tree-icon">${this.getSpecIcon(specType)}</span>
            <span class="tree-label">${this.getSpecDisplayName(specType)}</span>
            <span class="tree-count">(${Object.keys(resources).length})</span>
        `;
        
        const children = document.createElement('div');
        children.className = 'tree-children';
        children.id = `children-${specType}`;
        
        // Add resource nodes with hierarchical organization for US Core
        if (specType === 'us-core-stu6.1') {
            this.createUSCoreHierarchy(resources, children, specType);
        } else {
            Object.keys(resources).sort().forEach(resourceName => {
                const resourceNode = this.createResourceNode(resourceName, resources[resourceName], specType);
                children.appendChild(resourceNode);
            });
        }
        
        specNode.appendChild(header);
        specNode.appendChild(children);
        
        return specNode;
    }

    async createDataTypesSection() {
        // Create a separate section for FHIR data types
        const specNode = document.createElement('div');
        specNode.className = 'tree-node spec-node';
        specNode.dataset.type = 'spec';
        specNode.dataset.spec = 'fhir-datatypes';
        
        const header = document.createElement('div');
        header.className = 'tree-item tree-header';
        header.setAttribute('tabindex', '0');
        header.innerHTML = `
            <span class="tree-toggle" data-toggle="fhir-datatypes">▶</span>
            <span class="tree-icon">🧩</span>
            <span class="tree-label">FHIR Data Types</span>
            <span class="tree-count">(16)</span>
        `;
        
        const children = document.createElement('div');
        children.className = 'tree-children';
        children.id = 'children-fhir-datatypes';
        
        // Load data types from storage
        try {
            const dataTypes = await this.app.storage.getResourcesByType('datatype', 'fhir-r4');
            dataTypes.sort().forEach(dataTypeName => {
                const resourceInfo = this.app.storage.findResourceInfo(dataTypeName, 'fhir-r4');
                if (resourceInfo) {
                    const dataTypeData = {
                        name: dataTypeName,
                        type: 'datatype',
                        elementCount: resourceInfo.elementCount
                    };
                    const resourceNode = this.createResourceNode(dataTypeName, dataTypeData, 'fhir-r4');
                    resourceNode.classList.add('datatype-item');
                    children.appendChild(resourceNode);
                }
            });
        } catch (error) {
            console.warn('Failed to load data types:', error);
        }
        
        specNode.appendChild(header);
        specNode.appendChild(children);
        
        return specNode;
    }

    createUSCoreHierarchy(resources, container, specType) {
        // Organize US Core resources with vital signs hierarchy
        const vitalSignsChildren = [];
        const regularResources = {};
        
        // Separate vital signs children from regular resources
        Object.keys(resources).forEach(resourceName => {
            const resource = resources[resourceName];
            if (resource.baseDefinition === 'us-core-vital-signs') {
                vitalSignsChildren.push(resourceName);
            } else {
                regularResources[resourceName] = resource;
            }
        });
        
        // Add regular resources first (including USCoreVitalSigns)
        Object.keys(regularResources).sort().forEach(resourceName => {
            if (resourceName === 'USCoreVitalSigns') {
                // Create vital signs node with children
                const vitalSignsNode = this.createVitalSignsNode(resourceName, regularResources[resourceName], vitalSignsChildren, resources, specType);
                container.appendChild(vitalSignsNode);
            } else {
                const resourceNode = this.createResourceNode(resourceName, regularResources[resourceName], specType);
                container.appendChild(resourceNode);
            }
        });
    }

    createVitalSignsNode(resourceName, resourceData, childrenNames, allResources, specType) {
        const resourceNode = document.createElement('div');
        resourceNode.className = 'tree-node resource-node vital-signs-parent';
        resourceNode.dataset.type = 'resource';
        resourceNode.dataset.spec = specType;
        resourceNode.dataset.resource = resourceName;
        
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.setAttribute('tabindex', '0');
        item.innerHTML = `
            <span class="tree-toggle" data-toggle="${resourceName}">▶</span>
            <span class="tree-icon">${this.getResourceIcon(resourceData.type, resourceName)}</span>
            <span class="tree-label">${resourceData.name || resourceName}</span>
            <span class="tree-count">(${childrenNames.length} vital signs)</span>
        `;
        
        const children = document.createElement('div');
        children.className = 'tree-children';
        children.id = `children-${resourceName}`;
        
        // Add vital signs children
        childrenNames.sort().forEach(childName => {
            const childResource = allResources[childName];
            const childNode = this.createResourceNode(childName, childResource, specType);
            childNode.classList.add('vital-signs-child');
            children.appendChild(childNode);
        });
        
        resourceNode.appendChild(item);
        resourceNode.appendChild(children);
        
        return resourceNode;
    }

    createResourceNode(resourceName, resourceData, specType) {
        const resourceNode = document.createElement('div');
        resourceNode.className = 'tree-node resource-node';
        resourceNode.dataset.type = 'resource';
        resourceNode.dataset.spec = specType;
        resourceNode.dataset.resource = resourceName;
        
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.setAttribute('tabindex', '0');
        item.innerHTML = `
            <span class="tree-icon">${this.getResourceIcon(resourceData.type, resourceName)}</span>
            <span class="tree-label">${resourceData.name || resourceName}</span>
            ${resourceData.elementCount ? `<span class="tree-count">(${resourceData.elementCount})</span>` : ''}
        `;
        
        resourceNode.appendChild(item);
        return resourceNode;
    }

    getSpecIcon(specType) {
        const icons = {
            'fhir-r4': '🔗',
            'us-core': '🇺🇸',
            'us-core-stu6.1': '🇺🇸'
        };
        return icons[specType] || '📋';
    }

    getSpecDisplayName(specType) {
        const names = {
            'fhir-r4': 'FHIR R4 Resources',
            'us-core': 'US Core Profiles',
            'us-core-stu6.1': 'US Core Profiles'
        };
        return names[specType] || specType;
    }

    getResourceIcon(type, resourceName = '') {
        // Special icons for vital signs
        if (resourceName.includes('VitalSigns')) return '🩺';
        if (resourceName.includes('BloodPressure')) return '🫀';
        if (resourceName.includes('Height')) return '📏';
        if (resourceName.includes('Weight')) return '⚖️';
        if (resourceName.includes('Temperature')) return '🌡️';
        if (resourceName.includes('HeartRate')) return '💓';
        if (resourceName.includes('RespiratoryRate')) return '🫁';
        
        // Special icons for data types
        if (type === 'datatype') {
            if (resourceName === 'Extension') return '🔗';
            if (resourceName === 'Meta') return 'ℹ️';
            if (resourceName === 'Identifier') return '🆔';
            if (resourceName === 'Coding') return '🏷️';
            if (resourceName === 'CodeableConcept') return '💭';
            if (resourceName === 'Period') return '⏱️';
            if (resourceName === 'Reference') return '👉';
            if (resourceName === 'HumanName') return '👤';
            if (resourceName === 'Address') return '🏠';
            if (resourceName === 'ContactPoint') return '📞';
            if (resourceName === 'Quantity') return '📊';
            if (resourceName === 'Range') return '📏';
            if (resourceName === 'Ratio') return '⚖️';
            if (resourceName === 'Attachment') return '📎';
            if (resourceName === 'Annotation') return '📝';
            if (resourceName === 'Element') return '🔧';
            return '🧩'; // Default data type icon
        }
        
        const icons = {
            'resource': '📄',
            'profile': '⚙️',
            'extension': '🔌',
            'valueset': '📚',
            'datatype': '🧩'
        };
        return icons[type] || '📄';
    }

    setupTreeEventListeners() {
        // Only setup listeners once to avoid duplicates
        if (this.listenersSetup) return;
        
        const treeContainer = document.getElementById('resourceTree');
        if (!treeContainer) return;
        
        this.listenersSetup = true;
        
        // Use event delegation for click handlers
        treeContainer.addEventListener('click', (e) => {
            // Handle toggle clicks
            if (e.target.classList.contains('tree-toggle')) {
                e.stopPropagation();
                const nodeId = e.target.dataset.toggle;
                this.toggleNode(nodeId);
                return;
            }
            
            // Handle tree item clicks
            const treeItem = e.target.closest('.tree-item');
            if (treeItem) {
                // Set currentTarget for handleTreeItemClick
                Object.defineProperty(e, 'currentTarget', {
                    value: treeItem,
                    writable: false
                });
                this.handleTreeItemClick(e);
                return;
            }
        });
        
        // Use event delegation for double-click to expand/collapse
        treeContainer.addEventListener('dblclick', (e) => {
            const header = e.target.closest('.tree-header');
            if (header) {
                const toggle = header.querySelector('.tree-toggle');
                if (toggle) {
                    this.toggleNode(toggle.dataset.toggle);
                }
            }
        });
        
        // Use event delegation for focus events
        treeContainer.addEventListener('focus', (e) => {
            if (e.target.classList.contains('tree-item')) {
                this.handleTreeItemFocus(e);
            }
        }, true);
    }

    handleTreeItemClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const item = e.currentTarget;
        if (!item) return;
        
        const node = item.closest('.tree-node');
        if (!node) return;
        
        // Remove active class from all items
        document.querySelectorAll('.tree-item').forEach(el => {
            el.classList.remove('active');
        });
        
        // Add active class to clicked item
        item.classList.add('active');
        this.selectedNode = node;
        
        // Handle selection based on node type
        if (node.dataset.type === 'resource') {
            this.selectResource(node.dataset.resource, node.dataset.spec);
        } else if (node.dataset.type === 'spec') {
            this.selectSpec(node.dataset.spec);
        }
    }

    handleTreeItemFocus(e) {
        const item = e.currentTarget;
        item.scrollIntoView({ block: 'nearest' });
    }

    selectResource(resourceName, specType) {
        this.app.selectResource(resourceName, specType);
        this.updateBreadcrumb(specType, resourceName);
    }

    selectSpec(specType) {
        this.app.showSpecOverview(specType);
        this.updateBreadcrumb(specType);
    }

    toggleNode(nodeId) {
        const children = document.getElementById(`children-${nodeId}`);
        const toggle = document.querySelector(`[data-toggle="${nodeId}"]`);
        
        if (!children || !toggle) return;
        
        const isExpanded = this.expandedNodes.has(nodeId);
        
        if (isExpanded) {
            children.classList.add('collapsed');
            toggle.textContent = '▶';
            toggle.classList.remove('expanded');
            this.expandedNodes.delete(nodeId);
        } else {
            children.classList.remove('collapsed');
            toggle.textContent = '▼';
            toggle.classList.add('expanded');
            this.expandedNodes.add(nodeId);
        }
        
        // Save expanded state
        this.saveExpandedState();
    }

    expandNode() {
        if (!this.selectedNode) return;
        
        const toggle = this.selectedNode.querySelector('.tree-toggle');
        if (toggle && !toggle.classList.contains('expanded')) {
            this.toggleNode(toggle.dataset.toggle);
        }
    }

    collapseNode() {
        if (!this.selectedNode) return;
        
        const toggle = this.selectedNode.querySelector('.tree-toggle');
        if (toggle && toggle.classList.contains('expanded')) {
            this.toggleNode(toggle.dataset.toggle);
        }
    }

    navigateUp() {
        const current = document.querySelector('.tree-item.active') || document.querySelector('.tree-item[tabindex="0"]');
        if (!current) return;
        
        const allItems = Array.from(document.querySelectorAll('.tree-item:not(.collapsed .tree-item)'));
        const currentIndex = allItems.indexOf(current);
        
        if (currentIndex > 0) {
            this.focusTreeItem(allItems[currentIndex - 1]);
        }
    }

    navigateDown() {
        const current = document.querySelector('.tree-item.active') || document.querySelector('.tree-item[tabindex="0"]');
        if (!current) return;
        
        const allItems = Array.from(document.querySelectorAll('.tree-item:not(.collapsed .tree-item)'));
        const currentIndex = allItems.indexOf(current);
        
        if (currentIndex < allItems.length - 1) {
            this.focusTreeItem(allItems[currentIndex + 1]);
        }
    }

    navigateToFirst() {
        const firstItem = document.querySelector('.tree-item');
        if (firstItem) {
            this.focusTreeItem(firstItem);
        }
    }

    navigateToLast() {
        const items = document.querySelectorAll('.tree-item:not(.collapsed .tree-item)');
        const lastItem = items[items.length - 1];
        if (lastItem) {
            this.focusTreeItem(lastItem);
        }
    }

    selectCurrentNode() {
        const current = document.querySelector('.tree-item:focus');
        if (current) {
            current.click();
        }
    }

    focusTreeItem(item) {
        // Remove focus from current item
        document.querySelectorAll('.tree-item').forEach(el => {
            el.setAttribute('tabindex', '-1');
        });
        
        // Focus new item
        item.setAttribute('tabindex', '0');
        item.focus();
    }

    updateBreadcrumb(specType, resourceName = null) {
        const breadcrumb = document.getElementById('breadcrumb');
        const parts = ['<a href="#" onclick="app.clearSelection()">Home</a>'];
        
        if (specType) {
            const specName = this.getSpecDisplayName(specType);
            parts.push(`<a href="#" onclick="app.navigationManager.selectSpec('${specType}')">${specName}</a>`);
        }
        
        if (resourceName) {
            parts.push(`<span>${resourceName}</span>`);
        }
        
        breadcrumb.innerHTML = parts.join(' > ');
    }

    saveExpandedState() {
        localStorage.setItem('expandedNodes', JSON.stringify([...this.expandedNodes]));
    }

    restoreExpandedState() {
        const saved = localStorage.getItem('expandedNodes');
        if (saved) {
            try {
                const expandedList = JSON.parse(saved);
                expandedList.forEach(nodeId => {
                    this.expandedNodes.add(nodeId);
                    const children = document.getElementById(`children-${nodeId}`);
                    const toggle = document.querySelector(`[data-toggle="${nodeId}"]`);
                    
                    if (children && toggle) {
                        children.classList.remove('collapsed');
                        toggle.textContent = '▼';
                        toggle.classList.add('expanded');
                    }
                });
            } catch (e) {
                console.warn('Failed to restore expanded state:', e);
            }
        }
    }

    expandAll() {
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            if (!toggle.classList.contains('expanded')) {
                this.toggleNode(toggle.dataset.toggle);
            }
        });
    }

    collapseAll() {
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            if (toggle.classList.contains('expanded')) {
                this.toggleNode(toggle.dataset.toggle);
            }
        });
    }

    findNode(resourceName, specType) {
        return document.querySelector(`[data-resource="${resourceName}"][data-spec="${specType}"]`);
    }

    highlightNode(resourceName, specType) {
        // Clear previous highlights
        document.querySelectorAll('.tree-item.highlighted').forEach(item => {
            item.classList.remove('highlighted');
        });
        
        const node = this.findNode(resourceName, specType);
        if (node) {
            const item = node.querySelector('.tree-item');
            item.classList.add('highlighted');
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Remove highlight after a delay
            setTimeout(() => {
                item.classList.remove('highlighted');
            }, 3000);
        }
    }

    getVisibleTreeItems() {
        return document.querySelectorAll('.tree-item:not(.collapsed .tree-item)');
    }

    getCurrentSelection() {
        const activeItem = document.querySelector('.tree-item.active');
        if (!activeItem) return null;
        
        const node = activeItem.closest('.tree-node');
        return {
            type: node.dataset.type,
            spec: node.dataset.spec,
            resource: node.dataset.resource
        };
    }
}

// Export for use in other modules
window.NavigationManager = NavigationManager;