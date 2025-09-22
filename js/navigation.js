// Navigation and Tree Management
class NavigationManager {
    constructor(app) {
        this.app = app;
        this.expandedNodes = new Set();
        this.selectedNode = null;
        this.breadcrumbHistory = [];
        this.listenersSetup = false;
        this.usCoreLinks = new USCoreLinks();
        this.fhirR4Links = new FHIRR4Links();
        
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
        
        // Data types are now included in the FHIR R4 section, no separate section needed
        
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


    createUSCoreHierarchy(resources, container, specType) {
        // Organize US Core resources with vital signs hierarchy
        const vitalSignsChildren = [];
        const regularResources = {};
        
        // Separate vital signs children from regular resources
        Object.keys(resources).forEach(resourceName => {
            const resource = resources[resourceName];
            if (resource.baseDefinition === 'us-core-vital-signs' || 
                resource.baseDefinition === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-vital-signs') {
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
        
        // Add documentation link icon for both FHIR R4 and US Core
        let docLink = '';
        const cleanName = resourceData.name || resourceName;
        
        if (specType === 'us-core-stu6.1') {
            // Check for US Core profile link
            if (this.usCoreLinks.hasProfileLink(cleanName)) {
                const linkUrl = this.usCoreLinks.getProfileLink(cleanName);
                docLink = `<a href="${linkUrl}" target="_blank" class="doc-link" title="View ${cleanName} official US Core documentation" onclick="event.stopPropagation();">🔥</a>`;
            }
        } else if (specType === 'fhir-r4') {
            // Different icons and links for resources vs data types
            if (resourceData.type === 'datatype') {
                // Data type icon
                if (this.fhirR4Links.hasResourceLink(cleanName, 'datatype')) {
                    const linkUrl = this.fhirR4Links.getResourceLink(cleanName, 'datatype');
                    docLink = `<a href="${linkUrl}" target="_blank" class="doc-link datatype-link" title="View ${cleanName} official FHIR R4 data type documentation" onclick="event.stopPropagation();">🔡</a>`;
                }
            } else {
                // Fire icon for resources
                if (this.fhirR4Links.hasResourceLink(cleanName, 'resource')) {
                    const linkUrl = this.fhirR4Links.getResourceLink(cleanName, 'resource');
                    docLink = `<a href="${linkUrl}" target="_blank" class="doc-link" title="View ${cleanName} official FHIR R4 documentation" onclick="event.stopPropagation();">🔥</a>`;
                }
            }
        }
        
        item.innerHTML = `
            <span class="tree-icon">${this.getResourceIcon(resourceData.type, resourceName)}</span>
            <span class="tree-label">${resourceData.name || resourceName}</span>
            ${resourceData.elementCount ? `<span class="tree-count">(${resourceData.elementCount})</span>` : ''}
            ${docLink}
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
        // Healthcare-specific FHIR resources with meaningful icons
        if (resourceName.includes('Patient')) return '🤒';
        if (resourceName.includes('PractitionerRole')) return '🎓';
        if (resourceName.includes('Practitioner')) return '🧑‍⚕️';
        if (resourceName.includes('Organization')) return '🏥';
        if (resourceName.includes('Location')) return '📍';
        if (resourceName.includes('Encounter')) return '🤝';
        if (resourceName.includes('Observation')) return '🔬';
        if (resourceName.includes('Condition')) return '🩹';
        if (resourceName.includes('Procedure')) return '🔬';
        if (resourceName.includes('MedicationAdministration')) return '💉';
        if (resourceName.includes('MedicationDispense')) return '📦';
        if (resourceName.includes('MedicationRequest')) return '📝';
        if (resourceName.includes('MedicationStatement')) return '🗒️';
        if (resourceName.includes('Medication')) return '💊';
        if (resourceName.includes('Immunization')) return '💉';
        if (resourceName.includes('AllergyIntolerance') || resourceName.includes('Allergyintolerance')) return '🤧';
        if (resourceName.includes('DiagnosticReport') || resourceName.includes('Diagnosticreport')) return '📋';
        if (resourceName.includes('DocumentReference') || resourceName.includes('Documentreference')) return '📄';
        if (resourceName.includes('Goal')) return '🎯';
        if (resourceName.includes('CarePlan') || resourceName.includes('Careplan')) return '📅';
        if (resourceName.includes('CareTeam') || resourceName.includes('Careteam')) return '👥';
        if (resourceName.includes('Coverage')) return '🛡️';
        if (resourceName.includes('Device') || resourceName.includes('ImplantableDevice')) return '🔧';
        if (resourceName.includes('Specimen')) return '🧪';
        if (resourceName.includes('Provenance')) return '📜';
        if (resourceName.includes('RelatedPerson')) return '👨‍👩‍👧‍👦';
        
        // Common workflow and communication resources
        if (resourceName.includes('Appointment') && !resourceName.includes('Response')) return '📅';
        if (resourceName.includes('AppointmentResponse')) return '✉️';
        if (resourceName.includes('Communication') && !resourceName.includes('Request')) return '💬';
        if (resourceName.includes('CommunicationRequest')) return '📞';
        if (resourceName.includes('Task')) return '✅';
        if (resourceName.includes('List')) return '📄';
        if (resourceName.includes('Questionnaire') && !resourceName.includes('Response')) return '❓';
        if (resourceName.includes('QuestionnaireResponse')) return '✅';
        
        // Financial and administrative resources
        if (resourceName.includes('Account')) return '💳';
        if (resourceName.includes('Claim') && !resourceName.includes('Response')) return '🫴';
        if (resourceName.includes('ClaimResponse')) return '⚖️';
        if (resourceName.includes('EnrollmentRequest')) return '📝';
        if (resourceName.includes('EnrollmentResponse')) return '📬';
        if (resourceName.includes('Invoice')) return '🧾';
        if (resourceName.includes('PaymentNotice')) return '💰';
        if (resourceName.includes('PaymentReconciliation')) return '🔄';
        if (resourceName.includes('ChargeItem') && !resourceName.includes('Definition')) return '💰';
        if (resourceName.includes('ChargeItemDefinition')) return '💲';
        
        // Core clinical resources
        if (resourceName.includes('AdverseEvent')) return '⚠️';
        if (resourceName.includes('ClinicalImpression')) return '🩺';
        if (resourceName.includes('DetectedIssue')) return '🚨';
        if (resourceName.includes('AuditEvent')) return '📋';
        if (resourceName.includes('ActivityDefinition')) return '📋';
        if (resourceName.includes('BiologicallyDerivedProduct')) return '🧬';
        if (resourceName.includes('BodyStructure')) return '🦴';
        if (resourceName.includes('CatalogEntry')) return '📇';
        if (resourceName.includes('Composition')) return '📄';
        if (resourceName.includes('Consent')) return '👍';
        if (resourceName.includes('Contract')) return '📝';
        if (resourceName.includes('CoverageEligibilityRequest')) return '📋';
        if (resourceName.includes('CoverageEligibilityResponse')) return '📬';
        if (resourceName.includes('ExplanationOfBenefit')) return '📄';
        if (resourceName.includes('InsurancePlan')) return '🛡️';
        if (resourceName.includes('FamilyMemberHistory')) return '👨‍👩‍👧‍👦';
        if (resourceName.includes('ImagingStudy')) return '🖼️';
        if (resourceName.includes('DeviceRequest')) return '🔧';
        if (resourceName.includes('EpisodeOfCare')) return '📖';
        if (resourceName.includes('Flag')) return '🚩';
        if (resourceName.includes('Schedule')) return '📅';
        if (resourceName.includes('Slot')) return '🕐';
        if (resourceName.includes('Group')) return '👥';
        if (resourceName.includes('HealthcareService')) return '🏥';
        if (resourceName.includes('Endpoint')) return '🔌';
        if (resourceName.includes('RiskAssessment')) return '⚠️';
        if (resourceName.includes('Media')) return '🖼️';
        if (resourceName.includes('MolecularSequence')) return '🧬';
        if (resourceName.includes('VisionPrescription')) return '👓';
        if (resourceName.includes('DeviceUseStatement')) return '📱';
        if (resourceName.includes('SupplyRequest')) return '📦';
        if (resourceName.includes('SupplyDelivery')) return '🚚';
        if (resourceName.includes('RequestGroup')) return '📋';
        if (resourceName.includes('Library')) return '📚';
        if (resourceName.includes('Measure') && !resourceName.includes('Report')) return '📊';
        if (resourceName.includes('MeasureReport')) return '📈';
        if (resourceName.includes('GuidanceResponse')) return '💡';
        if (resourceName.includes('Person')) return '👤';
        if (resourceName.includes('PlanDefinition')) return '📋';
        if (resourceName.includes('Substance')) return '🧪';
        if (resourceName.includes('EventDefinition')) return '⚡';
        if (resourceName.includes('Parameters')) return '⚙️';
        if (resourceName.includes('TestScript')) return '🧪';
        if (resourceName.includes('TestReport')) return '📊';
        if (resourceName.includes('ResearchStudy')) return '🔬';
        if (resourceName.includes('ResearchSubject')) return '👤';
        
        // Special icons for vital signs
        if (resourceName.includes('VitalSigns')) return '🩺';
        if (resourceName.includes('BloodPressure')) return '🫀';
        if (resourceName.includes('Height')) return '📏';
        if (resourceName.includes('Weight')) return '⚖️';
        if (resourceName.includes('Temperature')) return '🌡️';
        if (resourceName.includes('HeartRate')) return '💓';
        if (resourceName.includes('RespiratoryRate')) return '🫁';
        if (resourceName.includes('BMI')) return '📊';
        if (resourceName.includes('HeadCircumference')) return '📐';
        if (resourceName.includes('PulseOximetry')) return '🫁';
        if (resourceName.includes('Pediatric')) return '👶';
        
        // Administrative and infrastructure resources
        if (resourceName.includes('Bundle')) return '📦';
        if (resourceName.includes('Basic')) return '📋';
        if (resourceName.includes('Binary')) return '💾';
        if (resourceName.includes('Linkage')) return '🔗';
        if (resourceName.includes('Resource')) return '📄';
        
        // Terminology and knowledge resources
        if (resourceName.includes('CodeSystem')) return '📚';
        if (resourceName.includes('ValueSet')) return '📖';
        if (resourceName.includes('ConceptMap')) return '🗺️';
        if (resourceName.includes('NamingSystem')) return '🏷️';
        
        // Technical and conformance resources
        if (resourceName.includes('CapabilityStatement')) return '💪';
        if (resourceName.includes('StructureDefinition')) return '🏗️';
        if (resourceName.includes('ImplementationGuide')) return '📘';
        if (resourceName.includes('SearchParameter')) return '🔍';
        if (resourceName.includes('OperationDefinition')) return '⚙️';
        if (resourceName.includes('MessageDefinition')) return '📨';
        if (resourceName.includes('CompartmentDefinition')) return '🏠';
        if (resourceName.includes('StructureMap')) return '🗺️';
        if (resourceName.includes('GraphDefinition')) return '📊';
        if (resourceName.includes('ExampleScenario')) return '📝';
        if (resourceName.includes('TerminologyCapabilities')) return '🎛️';
        
        // Special icons for data types (keep existing good ones)
        if (type === 'datatype') {
            if (resourceName === 'Extension') return '🔌';
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
        
        // Default fallback icons by type
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