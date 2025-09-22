// Main Application Controller
class FHIRViewer {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.currentFontSize = localStorage.getItem('fontSize') || 'normal';
        this.fhirData = null;
        this.filteredData = null;
        this.currentResource = null;
        this.storage = new FHIRStorage();
        this.usCoreLinks = new USCoreLinks();
        
        this.init();
    }

    async init() {
        console.log('Initializing FHIR Viewer...');
        this.setupTheme();
        this.setupEventListeners();
        this.showLoading();
        
        // Initialize managers first
        try {
            console.log('Creating navigation and search managers...');
            this.navigationManager = new NavigationManager(this);
            this.searchManager = new SearchManager(this);
            console.log('Managers created successfully');
        } catch (error) {
            console.error('Error creating managers:', error);
            this.hideLoading();
            this.showError('Failed to initialize managers: ' + error.message);
            return;
        }
        
        try {
            console.log('Initializing storage system...');
            
            // Force clear browser cache for fresh data
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
            
            await this.storage.initialize();
            
            console.log('Loading FHIR data using new storage system...');
            await this.loadFHIRDataFromStorage();
            console.log('FHIR data loaded:', this.fhirData);
            this.hideLoading();
            
            // Show welcome message
            this.showWelcomeMessage();
            
            // Initialize search index after data is loaded
            console.log('Building search index...');
            this.searchManager.buildSearchIndex(this.fhirData);
            
            console.log('Rendering resource tree...');
            this.renderResourceTree();
            console.log('Initialization complete!');
        } catch (error) {
            console.error('Error during initialization:', error);
            this.hideLoading();
            this.showError('Failed to load FHIR data: ' + error.message);
        }
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.documentElement.setAttribute('data-font-size', this.currentFontSize);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('toggleTheme');
        themeToggle.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('toggleTheme').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Spec filter
        document.getElementById('specFilter').addEventListener('change', (e) => {
            this.handleSpecFilter(e.target.value);
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.hideError();
        });

        // Click outside modal to close
        document.getElementById('errorModal').addEventListener('click', (e) => {
            if (e.target.id === 'errorModal') {
                this.hideError();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Managers will be initialized in init() method
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'blue', 'high-contrast'];
        const currentIndex = themes.indexOf(this.currentTheme);
        this.currentTheme = themes[(currentIndex + 1) % themes.length];
        
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // Update button icon
        const themeToggle = document.getElementById('toggleTheme');
        themeToggle.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }

    async loadFHIRDataFromStorage() {
        // Load all available resource files directly since the index is incomplete
        this.fhirData = {
            'fhir-r4': {},
            'us-core-stu6.1': {}
        };
        
        try {
            // Load all FHIR R4 resource files
            const resourceFiles = [
                'Account', 'ActivityDefinition', 'AdverseEvent', 'AllergyIntolerance', 'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BiologicallyDerivedProduct', 'BodyStructure', 'Bundle', 'CapabilityStatement', 
                'CarePlan', 'CareTeam', 'CatalogEntry', 'ChargeItem', 'ChargeItemDefinition', 'Claim', 'ClaimResponse', 'ClinicalImpression', 'CodeSystem', 'Communication', 'CommunicationRequest', 'CompartmentDefinition', 'Composition', 'ConceptMap', 'Consent', 'Contract',
                'Condition', 'Coverage', 'CoverageEligibilityRequest', 'CoverageEligibilityResponse', 'DetectedIssue', 'Device', 'DeviceRequest', 'DeviceUseStatement', 'DiagnosticReport', 'DocumentReference',
                'Encounter', 'Endpoint', 'EnrollmentRequest', 'EnrollmentResponse', 'EpisodeOfCare', 'EventDefinition', 'ExampleScenario', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal', 'GraphDefinition', 'Group', 'GuidanceResponse', 'HealthcareService', 'ImagingStudy', 'Immunization', 'InsurancePlan',
                'ImplementationGuide', 'Invoice', 'Library', 'Linkage', 'List', 'Location', 'Measure', 'MeasureReport', 'Media', 'Medication', 'MedicationAdministration',
                'MedicationDispense', 'MedicationRequest', 'MedicationStatement', 'MessageDefinition', 'MolecularSequence',
                'NamingSystem', 'Observation', 'OperationDefinition', 'Organization', 'Parameters', 'Patient', 'Person',
                'PaymentNotice', 'PaymentReconciliation', 'PlanDefinition', 'Practitioner', 'PractitionerRole', 'Procedure', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'RelatedPerson', 'RequestGroup', 'ResearchStudy', 'ResearchSubject', 'RiskAssessment',
                'Resource', 'Schedule', 'SearchParameter', 'ServiceRequest', 'Slot', 'Specimen', 'StructureDefinition', 'Substance', 'SupplyDelivery', 'SupplyRequest',
                'StructureMap', 'Task', 'TerminologyCapabilities', 'TestReport', 'TestScript', 'ValueSet', 'VisionPrescription'
            ];
            
            console.log(`Loading ${resourceFiles.length} FHIR R4 resources directly from files`);
            
            for (const resourceName of resourceFiles) {
                try {
                    // Try to load the resource file
                    const resourceData = await this.storage.loadJSON(`data/fhir-r4/resources/${resourceName}.json`);
                    this.fhirData['fhir-r4'][resourceName] = {
                        name: resourceName,
                        description: resourceData.description || `FHIR R4 ${resourceName} resource`,
                        type: 'resource',
                        elementCount: resourceData.elements?.length || 0,
                        // Will be loaded on demand
                        elements: []
                    };
                    console.log(`  Added ${resourceName} (${resourceData.elements?.length || 0} elements)`);
                } catch (error) {
                    console.warn(`  Failed to load ${resourceName}: ${error.message}`);
                }
            }
            
            // Load US Core profiles using existing index
            const usCoreResources = await this.storage.getResourceList('us-core-stu6.1');
            console.log(`Loading ${usCoreResources.length} US Core profiles from index:`, usCoreResources);
            
            for (const resourceName of usCoreResources) {
                const resourceInfo = this.storage.findResourceInfo(resourceName, 'us-core-stu6.1');
                // Clean up US Core names: remove "USCore" prefix and "Profile" suffix
                let cleanName = resourceName.replace(/^USCore/, '').replace(/Profile.*$/, '');
                this.fhirData['us-core-stu6.1'][resourceName] = {
                    name: cleanName,
                    description: `US Core ${cleanName} profile`,
                    type: 'profile',
                    elementCount: resourceInfo?.elementCount || 0,
                    mustSupportCount: resourceInfo?.mustSupportCount || 0,
                    mustSupport: true,
                    baseDefinition: resourceInfo?.baseDefinition || '',
                    // Will be loaded on demand
                    elements: []
                };
            }
            
            // Load FHIR R4 data types for search functionality
            const dataTypeNames = await this.storage.getResourcesByType('datatype', 'fhir-r4');
            console.log(`Loading ${dataTypeNames.length} FHIR R4 data types for search`);
            
            for (const dataTypeName of dataTypeNames) {
                try {
                    const dataTypeData = await this.storage.loadJSON(`data/fhir-r4/datatypes/${dataTypeName}.json`);
                    this.fhirData['fhir-r4'][dataTypeName] = {
                        name: dataTypeName,
                        description: dataTypeData.description || `FHIR R4 ${dataTypeName} data type`,
                        type: 'datatype',
                        elementCount: dataTypeData.elements?.length || 0,
                        kind: dataTypeData.kind || 'complex-type',
                        // Will be loaded on demand
                        elements: []
                    };
                    console.log(`  Added data type ${dataTypeName} (${dataTypeData.elements?.length || 0} elements)`);
                } catch (error) {
                    console.warn(`  Failed to load data type ${dataTypeName}: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.error('Failed to load FHIR data:', error);
        }
        
        this.filteredData = this.fhirData;
        const r4Count = Object.keys(this.fhirData['fhir-r4']).length;
        const usCoreCount = Object.keys(this.fhirData['us-core-stu6.1']).length;
        console.log(`Total loaded: ${r4Count} R4 resources/datatypes, ${usCoreCount} US Core profiles`);
    }




    renderResourceTree() {
        if (this.navigationManager) {
            this.navigationManager.renderNavigationTree(this.filteredData);
        }
    }

    createTreeSection(title, resources, type) {
        const section = document.createElement('div');
        section.className = 'tree-section';
        
        const header = document.createElement('div');
        header.className = 'tree-item tree-header';
        header.innerHTML = `
            <span class="tree-toggle expanded">▶</span>
            <span class="tree-label">${title}</span>
        `;
        
        const children = document.createElement('div');
        children.className = 'tree-children';
        
        // Add resources
        Object.keys(resources).forEach(resourceName => {
            const resourceItem = document.createElement('div');
            resourceItem.className = 'tree-item';
            resourceItem.innerHTML = `<span class="tree-label">${resourceName}</span>`;
            resourceItem.addEventListener('click', () => {
                this.selectResource(resourceName, type);
            });
            children.appendChild(resourceItem);
        });
        
        header.addEventListener('click', () => {
            this.toggleTreeSection(header, children);
        });
        
        section.appendChild(header);
        section.appendChild(children);
        
        return section;
    }

    toggleTreeSection(header, children) {
        const toggle = header.querySelector('.tree-toggle');
        const isExpanded = toggle.classList.contains('expanded');
        
        if (isExpanded) {
            toggle.classList.remove('expanded');
            children.classList.add('collapsed');
        } else {
            toggle.classList.add('expanded');
            children.classList.remove('collapsed');
        }
    }

    async selectResource(resourceName, type) {
        // Remove active class from all items
        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected item
        if (event && event.target) {
            event.target.closest('.tree-item').classList.add('active');
        }
        
        // Load full resource content on demand
        this.currentResource = { name: resourceName, type: type };
        await this.loadFullResourceContent(resourceName, type);
        this.renderResourceContent();
    }

    async loadFullResourceContent(resourceName, spec) {
        try {
            console.log(`Loading full content for ${resourceName} from ${spec}`);
            
            // Handle data types specially - they're not in fhirData structure
            const resourceInfo = this.storage.findResourceInfo(resourceName, spec);
            console.log(`Resource info for ${resourceName}:`, resourceInfo);
            
            if (resourceInfo?.type === 'datatype') {
                // Load data type directly from storage
                const fullResource = await this.storage.getResource(resourceName, spec);
                // Store it temporarily for rendering
                this.currentResourceData = fullResource;
                console.log(`Loaded data type ${resourceName} with ${fullResource.elements?.length || 0} elements`);
                return;
            }
            
            // Check if we already have full content for regular resources
            const currentResource = this.fhirData[spec][resourceName];
            console.log(`Current resource in fhirData[${spec}][${resourceName}]:`, currentResource);
            
            if (currentResource && currentResource.elements && currentResource.elements.length > 0) {
                console.log('Full content already loaded');
                return;
            }
            
            // Load full resource data directly from file for FHIR R4 resources
            let fullResource;
            if (spec === 'fhir-r4') {
                try {
                    fullResource = await this.storage.loadJSON(`data/fhir-r4/resources/${resourceName}.json`);
                } catch (error) {
                    console.warn(`Failed to load ${resourceName} from file, trying storage system...`);
                    fullResource = await this.storage.getResource(resourceName, spec);
                }
            } else {
                // Use storage system for US Core and other specs
                console.log(`Loading ${resourceName} from storage system...`);
                fullResource = await this.storage.getResource(resourceName, spec);
                console.log(`Storage returned resource with ${fullResource?.elements?.length || 0} elements:`, fullResource);
            }
            
            // Update the resource in our data structure, preserving cleaned name
            const cleanedName = this.fhirData[spec][resourceName]?.name;
            this.fhirData[spec][resourceName] = {
                ...this.fhirData[spec][resourceName],
                ...fullResource,
                // Preserve the cleaned name if we had one
                name: cleanedName || fullResource.name
            };
            
            console.log(`Loaded ${fullResource.elements?.length || 0} elements for ${resourceName}`);
            
        } catch (error) {
            console.error(`Failed to load full content for ${resourceName}:`, error);
            // Fallback to existing data
        }
    }

    getCurrentResourceDisplayName() {
        if (!this.currentResource) return 'Resource';
        
        const { name, type } = this.currentResource;
        
        // Check if this is a data type (stored separately)
        let resource;
        if (this.currentResourceData) {
            resource = this.currentResourceData;
        } else {
            resource = this.fhirData[type][name];
        }
        
        if (!resource) return name;
        
        // Return the cleaned resource name
        let displayName = resource.name || name;
        // For US Core profiles, also clean up the name if needed
        if (type === 'us-core-stu6.1') {
            displayName = displayName.replace(/^USCore/, '').replace(/Profile.*$/, '');
        }
        
        return displayName;
    }

    truncateToTwoRows(text, maxCharsPerRow = 70) {
        if (!text || text.length === 0) return text;
        
        // Estimate characters that fit in 2 rows (accounting for word boundaries)
        // Set to 60 chars per row to prevent 3-line wrapping
        const maxChars = maxCharsPerRow * 2;
        
        if (text.length <= maxChars) {
            return text;
        }
        
        // Find a good breaking point near the limit (prefer word boundaries)
        let truncateAt = maxChars;
        
        // Look for the last space before the limit to avoid breaking words
        const spaceIndex = text.lastIndexOf(' ', maxChars - 3); // -3 for "..."
        if (spaceIndex > maxChars * 0.7) { // Don't go too far back
            truncateAt = spaceIndex;
        }
        
        return text.substring(0, truncateAt) + '...';
    }

    renderElementDescription(element) {
        const fullDescription = element.description || element.short || '';
        
        if (!fullDescription) return '';
        
        const truncatedDescription = this.truncateToTwoRows(fullDescription);
        
        // If we truncated the description, add a tooltip with the full text
        if (truncatedDescription !== fullDescription) {
            const escapedDescription = fullDescription.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            return `<span title="${escapedDescription}" class="truncated-description">${truncatedDescription}</span>`;
        }
        
        return fullDescription;
    }

    isDomainResource(resourceName, elements) {
        // Resources that inherit directly from Resource (not DomainResource)
        const resourceOnlyTypes = new Set(['Bundle', 'Binary']);
        
        if (resourceOnlyTypes.has(resourceName)) {
            return false;
        }
        
        // Check if the resource has DomainResource-specific fields
        const domainResourceSpecificFields = new Set(['text', 'contained', 'extension', 'modifierExtension']);
        const hasAnyDomainResourceField = elements.some(element => 
            domainResourceSpecificFields.has(element.name)
        );
        
        return hasAnyDomainResourceField;
    }

    renderResourceContent() {
        if (!this.currentResource) return;
        
        const { name, type } = this.currentResource;
        
        // Check if this is a data type (stored separately)
        let resource;
        if (this.currentResourceData) {
            resource = this.currentResourceData;
            this.currentResourceData = null; // Clear after use
        } else {
            resource = this.fhirData[type][name];
        }
        
        if (!resource) return;
        
        // Update header with cleaned name
        let displayTitle = resource.name || name;
        // For US Core profiles, also clean up the title if needed
        if (type === 'us-core-stu6.1') {
            displayTitle = displayTitle.replace(/^USCore/, '').replace(/Profile$/, '');
        }
        document.getElementById('resourceTitle').textContent = displayTitle;
        
        // Create appropriate breadcrumb using cleaned display name
        const cleanDisplayName = this.getCurrentResourceDisplayName();
        let breadcrumbHTML;
        const resourceInfo = this.storage.findResourceInfo(name, type);
        if (resourceInfo?.type === 'datatype') {
            breadcrumbHTML = `
                <a href="#" onclick="app.clearSelection()">Home</a> > 
                <span>FHIR Data Types</span> > 
                ${cleanDisplayName}
            `;
        } else {
            const specDisplayName = type === 'fhir-r4' ? 'FHIR R4' : type === 'us-core-stu6.1' ? 'US Core' : type;
            let resourceBreadcrumb = cleanDisplayName;
            
            // For US Core profiles, create a link to the local documentation
            if (type === 'us-core-stu6.1' && this.usCoreLinks.hasProfileLink(cleanDisplayName)) {
                resourceBreadcrumb = this.usCoreLinks.createProfileLink(cleanDisplayName);
            }
            
            breadcrumbHTML = `
                <a href="#" onclick="app.clearSelection()">Home</a> > 
                <a href="#" onclick="app.showTypeResources('${type}')">${specDisplayName}</a> > 
                ${resourceBreadcrumb}
            `;
        }
        
        document.getElementById('breadcrumb').innerHTML = breadcrumbHTML;
        
        // Render content
        const contentContainer = document.getElementById('resourceContent');
        contentContainer.innerHTML = this.generateResourceHTML(resource);
        
        // Sync element toggle states after rendering
        this.syncElementToggles();
    }

    createTypeLinks(typeString) {
        if (!typeString) return '';
        
        // List of data types we have available
        const availableDataTypes = [
            'Extension', 'Meta', 'Identifier', 'Coding', 'CodeableConcept', 'Period', 'Reference',
            'HumanName', 'Address', 'ContactPoint', 'Quantity', 'Range', 'Ratio', 'Attachment', 'Annotation', 'Element'
        ];
        
        // List of FHIR R4 resources that should link to the spec (all loaded resources)
        const fhirResources = [
            'AllergyIntolerance', 'Basic', 'Binary', 'Bundle', 'CapabilityStatement', 
            'CarePlan', 'CareTeam', 'CodeSystem', 'CompartmentDefinition', 'ConceptMap',
            'Condition', 'Coverage', 'Device', 'DiagnosticReport', 'DocumentReference',
            'Encounter', 'ExampleScenario', 'Goal', 'GraphDefinition', 'Immunization',
            'ImplementationGuide', 'Linkage', 'Location', 'Medication', 'MedicationAdministration',
            'MedicationDispense', 'MedicationRequest', 'MedicationStatement', 'MessageDefinition',
            'NamingSystem', 'Observation', 'OperationDefinition', 'Organization', 'Patient',
            'Practitioner', 'PractitionerRole', 'Procedure', 'Provenance', 'RelatedPerson',
            'Resource', 'SearchParameter', 'ServiceRequest', 'Specimen', 'StructureDefinition',
            'StructureMap', 'TerminologyCapabilities', 'ValueSet', 'Narrative'
        ];
        
        // Handle complex type strings with multiple types separated by |
        const types = typeString.split(' | ');
        const linkedTypes = types.map(type => {
            const trimmedType = type.trim();
            
            // Check if this is a URL (should be handled before other processing)
            if (this.isUrl(trimmedType)) {
                // Handle FHIRPath system types specially
                if (trimmedType.startsWith('http://hl7.org/fhirpath/System.')) {
                    const systemType = trimmedType.replace('http://hl7.org/fhirpath/System.', '');
                    return `<span class="system-type" title="FHIRPath system type: ${trimmedType}">${systemType}</span>`;
                }
                return `<a href="${trimmedType}" target="_blank" class="url-link" title="Open ${trimmedType} in new tab">${trimmedType}</a>`;
            }
            
            // Clean up the type (remove Reference(...) wrappers, etc.)
            const cleanType = this.extractCleanTypeName(trimmedType);
            
            // Check if this is a FHIR resource that should link to R4 spec
            if (fhirResources.includes(cleanType)) {
                const fhirUrl = `https://hl7.org/fhir/R4/${cleanType.toLowerCase()}.html`;
                return `<a href="${fhirUrl}" target="_blank" class="fhir-resource-link" title="View ${cleanType} in FHIR R4 specification">${trimmedType}</a>`;
            }
            
            // Check if this is a data type we have
            if (availableDataTypes.includes(cleanType)) {
                return `<a href="#" onclick="app.selectDataType('${cleanType}')" class="datatype-link" title="View ${cleanType} definition">${trimmedType}</a>`;
            }
            
            return trimmedType;
        });
        
        return linkedTypes.join(' | ');
    }
    
    isUrl(str) {
        try {
            const url = new URL(str);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }
    
    extractCleanTypeName(type) {
        // Handle Reference(ResourceType) pattern - extract the resource type
        if (type.startsWith('Reference(')) {
            const match = type.match(/Reference\(([^)]+)\)/);
            if (match) {
                // Handle multiple resource types like Reference(Patient | Group)
                const referencedTypes = match[1].split(' | ');
                // Return the first referenced type for linking purposes
                return referencedTypes[0].trim();
            }
            return 'Reference';
        }
        
        // Handle choice types [x]
        if (type.includes('[x]')) {
            return type.replace('[x]', '');
        }
        
        // Handle array indicators
        return type.replace(/\[\]$/, '');
    }
    
    async selectDataType(dataTypeName) {
        // Clear any active selections
        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Set current resource info for data type
        this.currentResource = { name: dataTypeName, type: 'fhir-r4' };
        
        // Load full resource content
        await this.loadFullResourceContent(dataTypeName, 'fhir-r4');
        
        // Render the content
        this.renderResourceContent();
        
        // Update breadcrumb to show we came from a link
        document.getElementById('breadcrumb').innerHTML = `
            <a href="#" onclick="app.clearSelection()">Home</a> > 
            <span>FHIR Data Types</span> > 
            ${dataTypeName}
        `;
        
        // Find and highlight the data type in the navigation if possible
        const dataTypeNode = document.querySelector(`[data-resource="${dataTypeName}"][data-spec="fhir-r4"]`);
        if (dataTypeNode) {
            const treeItem = dataTypeNode.querySelector('.tree-item');
            if (treeItem) {
                treeItem.classList.add('active');
                treeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    generateResourceHTML(resource) {
        let html = `
            <div class="resource-section">
                <h3>Description</h3>
                <p>${resource.description}</p>
            </div>
        `;
        
        if (resource.baseResource) {
            html += `
                <div class="resource-section">
                    <h3>Base Resource</h3>
                    <p>This profile is based on the <strong>${resource.baseResource}</strong> resource.</p>
                </div>
            `;
        }
        
        if (resource.elements && resource.elements.length > 0) {
            const hierarchicalElements = this.buildElementHierarchy(resource.elements);
            const isProfile = resource.type === 'profile';
            html += `
                <div class="resource-section">
                    <h3>Elements</h3>
                    <div class="element-hierarchy">
                        <div class="element-header${isProfile ? ' has-must-support' : ''}">
                            <div class="element-cell element-name-header">Element</div>
                            <div class="element-cell element-type-header">Type</div>
                            <div class="element-cell element-cardinality-header">Cardinality</div>
                            <div class="element-cell element-description-header">Description</div>
                            ${isProfile ? '<div class="element-cell element-must-support-header">S?</div>' : ''}
                        </div>
                        ${this.renderElementHierarchy(hierarchicalElements, isProfile)}
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    buildElementHierarchy(elements) {
        const hierarchy = [];
        const elementMap = new Map();
        const addedToHierarchy = new Set();
        
        // Check if this is a data type by looking at the current resource type
        const resourceInfo = this.storage?.findResourceInfo(this.currentResource?.name, this.currentResource?.type);
        const isDataType = resourceInfo?.type === 'datatype' || this.currentResourceData?.kind === 'complex-type';
        const resourceName = this.currentResource?.name || 'Resource';
        
        // Special case: Element data type should not have collapsible grouping
        if (resourceName === 'Element') {
            // Just return all elements as flat hierarchy
            elements.forEach(element => {
                elementMap.set(element.path || element.name, {
                    ...element,
                    children: [],
                    fullPath: element.path || element.name
                });
                hierarchy.push(elementMap.get(element.path || element.name));
            });
            return hierarchy;
        }
        
        // Different inheritance fields for different base types
        const domainResourceFields = new Set([
            'id', 'meta', 'implicitRules', 'language', 'text', 'contained', 'extension', 'modifierExtension'
        ]);
        
        const resourceFields = new Set([
            'id', 'meta', 'implicitRules', 'language'
        ]);
        
        const elementFields = new Set([
            'id', 'extension'
        ]);
        
        // Determine the base type and inherited fields
        let inheritedFields, baseType;
        if (isDataType) {
            inheritedFields = elementFields;
            baseType = 'Element';
        } else {
            // Check if this resource inherits from Resource directly (like Bundle, Binary)
            const isDomainResource = this.isDomainResource(resourceName, elements);
            if (isDomainResource) {
                inheritedFields = domainResourceFields;
                baseType = 'DomainResource';
            } else {
                inheritedFields = resourceFields;
                baseType = 'Resource';
            }
        }
        const inheritedElements = [];
        const businessElements = [];
        
        elements.forEach(element => {
            // Only consider top-level fields for inheritance (not nested like Bundle.entry.id)
            const path = element.path || element.name;
            const pathParts = path.split('.');
            const isTopLevel = pathParts.length <= 2; // e.g., "Bundle.id" but not "Bundle.entry.id"
            
            if (isTopLevel && inheritedFields.has(element.name)) {
                inheritedElements.push(element);
            } else {
                businessElements.push(element);
            }
        });
        
        // Create a synthetic parent for inherited fields using the cleaned resource name
        if (inheritedElements.length > 0) {
            // Use the cleaned resource name from the resource data, not the original currentResource name
            const cleanResourceName = this.getCurrentResourceDisplayName();
            const inheritanceParent = {
                name: cleanResourceName,
                fullPath: cleanResourceName,
                type: baseType,
                cardinality: '',
                description: `Common fields inherited from ${baseType}`,
                children: inheritedElements.map(element => ({
                    ...element,
                    children: [],
                    fullPath: element.path || element.name
                }))
            };
            hierarchy.push(inheritanceParent);
        }
        
        // Process business elements normally
        const filteredElements = businessElements.filter(element => {
            const elementName = element.name;
            // Always show required elements and mustSupport elements
            if (this.isRequiredElement(element.cardinality)) return true;
            if (element.mustSupport) return true;
            // Show all business elements (non-domain resource fields)
            return true;
        });
        
        // First pass: create map of all elements by their path
        filteredElements.forEach(element => {
            const path = element.path || element.name;
            elementMap.set(path, {
                ...element,
                children: [],
                fullPath: path
            });
        });
        
        // Second pass: build hierarchy
        filteredElements.forEach(element => {
            const path = element.path || element.name;
            const pathParts = path.split('.');
            
            if (pathParts.length <= 2) {
                // Top-level element (e.g., "Encounter.id", "Encounter.status")
                const elementNode = elementMap.get(path);
                if (elementNode && !addedToHierarchy.has(path)) {
                    hierarchy.push(elementNode);
                    addedToHierarchy.add(path);
                }
            } else {
                // Child element (e.g., "Encounter.participant.type")
                const parentPath = pathParts.slice(0, -1).join('.');
                const parent = elementMap.get(parentPath);
                if (parent) {
                    const childNode = elementMap.get(path);
                    if (childNode) {
                        parent.children.push(childNode);
                        addedToHierarchy.add(path);
                    }
                } else {
                    // If parent not found, treat as top-level (fallback)
                    const elementNode = elementMap.get(path);
                    if (elementNode && !addedToHierarchy.has(path)) {
                        hierarchy.push(elementNode);
                        addedToHierarchy.add(path);
                    }
                }
            }
        });
        
        // Debug logging
        console.log('Built hierarchy with', hierarchy.length, 'top-level elements');
        hierarchy.forEach(element => {
            console.log(`- ${element.name} (${element.fullPath}) has ${element.children.length} children`);
        });
        
        return hierarchy;
    }
    
    renderElementHierarchy(elements, showMustSupport) {
        return elements.map(element => this.renderElementNode(element, showMustSupport, 0)).join('');
    }
    
    renderElementNode(element, showMustSupport, depth) {
        const isRequired = this.isRequiredElement(element.cardinality);
        const elementNameClass = isRequired ? 'required-element' : '';
        const cardinalityClass = isRequired ? 'required-cardinality' : '';
        const indentClass = depth > 0 ? `element-depth-${Math.min(depth, 3)}` : '';
        const hasChildren = element.children && element.children.length > 0;
        const elementId = `element-${element.fullPath || element.path || element.name}`.replace(/[.\[\]]/g, '-');
        
        // For child elements, show context if the name is ambiguous
        let displayName = element.name;
        if (depth > 0 && element.fullPath) {
            const pathParts = element.fullPath.split('.');
            if (pathParts.length > 2) {
                // Show parent context for deeply nested elements
                const parentName = pathParts[pathParts.length - 2];
                displayName = `${element.name}`;
            }
        }
        
        const mustSupportClass = showMustSupport ? ' has-must-support' : '';
        let html = `
            <div class="element-row ${indentClass}${mustSupportClass}" title="${element.fullPath || element.path || ''}">
                <div class="element-cell element-name">
                    ${hasChildren ? `<span class="element-toggle collapsed" onclick="app.toggleElementChildren('${elementId}')">▶</span>` : '<span class="element-spacer"></span>'}
                    <strong class="${elementNameClass}">${displayName}</strong>
                    ${hasChildren ? `<span class="child-count">(${element.children.length})</span>` : ''}
                </div>
                <div class="element-cell element-type">
                    <code>${this.createTypeLinks(element.type)}</code>
                </div>
                <div class="element-cell element-cardinality">
                    <span class="${cardinalityClass}">${element.cardinality}</span>
                </div>
                <div class="element-cell element-description">
                    ${this.renderElementDescription(element)}
                </div>
                ${showMustSupport ? `<div class="element-cell element-must-support${element.mustSupport ? ' has-support' : ''}">${element.mustSupport ? 'S' : ''}</div>` : ''}
            </div>
        `;
        
        // Render children in a collapsible container (collapsed by default)
        if (hasChildren) {
            html += `<div class="element-children collapsed" id="${elementId}">`;
            html += element.children.map(child => 
                this.renderElementNode(child, showMustSupport, depth + 1)
            ).join('');
            html += '</div>';
        }
        
        return html;
    }

    // Ensure element toggles are properly synchronized with their children state
    syncElementToggles() {
        // Find all element toggles and sync them with their children containers
        document.querySelectorAll('.element-toggle').forEach(toggle => {
            const onclickAttr = toggle.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/toggleElementChildren\('([^']+)'\)/);
                if (match) {
                    const elementId = match[1];
                    const childrenContainer = document.getElementById(elementId);
                    
                    if (childrenContainer) {
                        const isChildrenCollapsed = childrenContainer.classList.contains('collapsed');
                        
                        if (isChildrenCollapsed) {
                            // Children are collapsed, toggle should show ▶
                            toggle.classList.remove('expanded');
                            toggle.classList.add('collapsed');
                            toggle.textContent = '▶';
                        } else {
                            // Children are visible, toggle should show ▼
                            toggle.classList.remove('collapsed');
                            toggle.classList.add('expanded');
                            toggle.textContent = '▼';
                        }
                    }
                }
            }
        });
    }

    toggleElementChildren(elementId) {
        const childrenContainer = document.getElementById(elementId);
        const toggle = document.querySelector(`[onclick="app.toggleElementChildren('${elementId}')"]`);
        
        if (childrenContainer && toggle) {
            const isCurrentlyCollapsed = childrenContainer.classList.contains('collapsed');
            
            if (isCurrentlyCollapsed) {
                // Expand: remove collapsed from children, set toggle to expanded
                childrenContainer.classList.remove('collapsed');
                toggle.classList.remove('collapsed');
                toggle.classList.add('expanded');
                toggle.textContent = '▼';
            } else {
                // Collapse: add collapsed to children, set toggle to collapsed
                childrenContainer.classList.add('collapsed');
                toggle.classList.remove('expanded');
                toggle.classList.add('collapsed');
                toggle.textContent = '▶';
            }
        }
    }

    isRequiredElement(cardinality) {
        if (!cardinality) return false;
        // Check if cardinality starts with 1 (like 1..1, 1..*, 1..n)
        return cardinality.trim().startsWith('1');
    }

    handleSearch(query) {
        if (this.searchManager) {
            this.searchManager.performSearch(query);
        }
    }

    filterData(data, query) {
        const filtered = {};
        
        Object.keys(data).forEach(spec => {
            const specData = {};
            Object.keys(data[spec]).forEach(resourceName => {
                const resource = data[spec][resourceName];
                if (this.matchesQuery(resource, resourceName, query)) {
                    specData[resourceName] = resource;
                }
            });
            if (Object.keys(specData).length > 0) {
                filtered[spec] = specData;
            }
        });
        
        return filtered;
    }

    matchesQuery(resource, resourceName, query) {
        // Search in resource name
        if (resourceName.toLowerCase().includes(query)) return true;
        
        // Search in description
        if (resource.description && resource.description.toLowerCase().includes(query)) return true;
        
        // Search in elements
        if (resource.elements) {
            return resource.elements.some(element => 
                element.name.toLowerCase().includes(query) ||
                element.description.toLowerCase().includes(query) ||
                element.type.toLowerCase().includes(query)
            );
        }
        
        return false;
    }

    handleSpecFilter(spec) {
        if (spec === 'all') {
            this.filteredData = this.fhirData;
        } else if (spec === 'fhir-datatypes') {
            // Special handling for data types filter - show empty data but navigation will handle data types
            this.filteredData = {};
        } else {
            this.filteredData = { [spec]: this.fhirData[spec] };
        }
        this.renderResourceTree();
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            document.getElementById('searchInput').value = '';
            this.handleSearch('');
        }
        
        // Ctrl/Cmd + T for theme toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.toggleTheme();
        }
    }

    clearSelection() {
        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('active');
        });
        this.currentResource = null;
        this.showWelcomeMessage();
    }

    updateFilteredData(data) {
        this.filteredData = data;
        this.renderResourceTree();
    }

    showWelcomeMessage() {
        document.getElementById('resourceTitle').textContent = '';
        document.getElementById('breadcrumb').innerHTML = '';
        document.getElementById('resourceContent').innerHTML = `
            <div class="welcome-message">
                <h3>Welcome to the Greenway FHIR Viewer</h3>
                <p>Select a resource from the sidebar to view its details, elements, and US Core modifications.</p>
                

                <div class="spec-panels">
                    <div class="spec-panel fhir-panel">
                        <div class="panel-header">
                            <h4>🔗 FHIR R4 Base Specification</h4>
                            <span class="panel-version">v4.0.1</span>
                        </div>
                        <div class="panel-content">
                            <p>The foundational FHIR R4 specification defines core resource structures, data types, and implementation guidance for healthcare interoperability.</p>
                            <div class="panel-features">
                                <span class="feature">✓ Core Resources</span>
                                <span class="feature">✓ Data Types</span>
                                <span class="feature">✓ Implementation Guide</span>
                            </div>
                        </div>
                        <div class="panel-footer">
                            <a href="https://hl7.org/fhir/R4/" target="_blank" class="spec-link primary">
                                View Official Specification 🔥
                            </a>
                        </div>
                    </div>

                    <div class="spec-panel uscore-panel">
                        <div class="panel-header">
                            <h4>🇺🇸 US Core Implementation Guide</h4>
                            <span class="panel-version">STU6.1</span>
                        </div>
                        <div class="panel-content">
                            <p>US Core profiles constrain FHIR R4 resources for use in the United States, defining must-support elements and implementation requirements.</p>
                            <div class="panel-features">
                                <span class="feature">✓ US Core Profiles</span>
                                <span class="feature">✓ Must Support Elements</span>
                                <span class="feature">✓ USCDI Compliance</span>
                            </div>
                        </div>
                        <div class="panel-footer">
                            <a href="https://hl7.org/fhir/us/core/STU6.1/" target="_blank" class="spec-link primary">
                                View Official Implementation Guide 🔥
                            </a>
                        </div>
                    </div>
                </div>

                <div class="getting-started">
                    <h4>Getting Started</h4>
                    <p>Navigate through the resource tree on the left to explore FHIR R4 base resources and US Core profiles. Each resource shows its elements, data types, cardinality constraints, and US Core must-support requirements.</p>
                </div>
            </div>
        `;
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        console.log('showLoading - overlay element:', overlay);
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        console.log('hideLoading - overlay element:', overlay);
        if (overlay) {
            overlay.classList.add('hidden');
            console.log('Loading overlay hidden');
        } else {
            console.error('Loading overlay element not found!');
        }
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorModal').classList.add('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FHIRViewer();
});