// Test Bundle inheritance fix
function isDomainResource(resourceName, elements) {
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

// Mock Bundle elements (Resource-only inheritance)
const bundleElements = [
    { name: 'id', type: 'id', cardinality: '0..1', description: 'Logical id' },
    { name: 'meta', type: 'Meta', cardinality: '0..1', description: 'Metadata' },
    { name: 'implicitRules', type: 'uri', cardinality: '0..1', description: 'A set of rules' },
    { name: 'language', type: 'code', cardinality: '0..1', description: 'Language of resource' },
    { name: 'identifier', type: 'Identifier', cardinality: '0..1', description: 'Persistent identifier' },
    { name: 'type', type: 'code', cardinality: '1..1', description: 'document | message | transaction' },
    { name: 'timestamp', type: 'instant', cardinality: '0..1', description: 'When the bundle was assembled' }
];

// Mock Patient elements (DomainResource inheritance)  
const patientElements = [
    { name: 'id', type: 'id', cardinality: '0..1', description: 'Logical id' },
    { name: 'meta', type: 'Meta', cardinality: '0..1', description: 'Metadata' },
    { name: 'extension', type: 'Extension', cardinality: '0..*', description: 'Additional content' },
    { name: 'modifierExtension', type: 'Extension', cardinality: '0..*', description: 'Modifier extensions' },
    { name: 'text', type: 'Narrative', cardinality: '0..1', description: 'Text summary' },
    { name: 'contained', type: 'Resource', cardinality: '0..*', description: 'Contained resources' },
    { name: 'active', type: 'boolean', cardinality: '0..1', description: 'Whether patient is active' }
];

function testInheritance(resourceName, elements) {
    const isDataType = false; // These are resources, not data types
    
    // Different inheritance fields for different base types
    const domainResourceFields = new Set([
        'id', 'meta', 'implicitRules', 'language', 'text', 'contained', 'extension', 'modifierExtension'
    ]);
    
    const resourceFields = new Set([
        'id', 'meta', 'implicitRules', 'language'
    ]);
    
    // Determine the base type and inherited fields
    let inheritedFields, baseType;
    if (isDataType) {
        inheritedFields = new Set(['id', 'extension']);
        baseType = 'Element';
    } else {
        // Check if this resource inherits from Resource directly (like Bundle, Binary)
        const isDomainResourceResult = isDomainResource(resourceName, elements);
        if (isDomainResourceResult) {
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
        if (inheritedFields.has(element.name)) {
            inheritedElements.push(element);
        } else {
            businessElements.push(element);
        }
    });
    
    return {
        baseType,
        inheritedElements: inheritedElements.map(e => e.name),
        businessElements: businessElements.map(e => e.name),
        description: `Common fields inherited from ${baseType}`
    };
}

console.log('Bundle Inheritance Test:');
const bundleResult = testInheritance('Bundle', bundleElements);
console.log('Base Type:', bundleResult.baseType);
console.log('Description:', bundleResult.description);
console.log('Inherited:', bundleResult.inheritedElements.join(', '));
console.log('Business:', bundleResult.businessElements.join(', '));

console.log('\nPatient Inheritance Test (for comparison):');
const patientResult = testInheritance('Patient', patientElements);
console.log('Base Type:', patientResult.baseType);
console.log('Description:', patientResult.description);
console.log('Inherited:', patientResult.inheritedElements.join(', '));
console.log('Business:', patientResult.businessElements.join(', '));