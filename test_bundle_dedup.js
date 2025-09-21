// Test Bundle deduplication fix
const mockBundleElements = [
    { name: 'id', path: 'Bundle.id', cardinality: '0..1', description: 'Logical id of this artifact' },
    { name: 'meta', path: 'Bundle.meta', cardinality: '0..1', description: 'Metadata about the resource' },
    { name: 'implicitRules', path: 'Bundle.implicitRules', cardinality: '0..1', description: 'A set of rules' },
    { name: 'language', path: 'Bundle.language', cardinality: '0..1', description: 'Language of resource' },
    { name: 'identifier', path: 'Bundle.identifier', cardinality: '0..1', description: 'Persistent identifier' },
    { name: 'type', path: 'Bundle.type', cardinality: '1..1', description: 'document | message | transaction' },
    { name: 'timestamp', path: 'Bundle.timestamp', cardinality: '0..1', description: 'When the bundle was assembled' },
    { name: 'total', path: 'Bundle.total', cardinality: '0..1', description: 'If search, the total number' },
    { name: 'link', path: 'Bundle.link', cardinality: '0..*', description: 'Links related to this Bundle' },
    { name: 'id', path: 'Bundle.link.id', cardinality: '0..1', description: 'Unique id for inter-element referencing' },
    { name: 'relation', path: 'Bundle.link.relation', cardinality: '1..1', description: 'See http://www.iana.org/assignments/link-relations/link-relations.xhtml#link-relations-1' },
    { name: 'entry', path: 'Bundle.entry', cardinality: '0..*', description: 'Entry in the bundle - will have a resource or information' },
    { name: 'id', path: 'Bundle.entry.id', cardinality: '0..1', description: 'Unique id for inter-element referencing' },
    { name: 'search', path: 'Bundle.entry.search', cardinality: '0..1', description: 'Search related information' },
    { name: 'id', path: 'Bundle.entry.search.id', cardinality: '0..1', description: 'Unique id for inter-element referencing' },
    { name: 'request', path: 'Bundle.entry.request', cardinality: '0..1', description: 'Additional execution information' },
    { name: 'id', path: 'Bundle.entry.request.id', cardinality: '0..1', description: 'Unique id for inter-element referencing' },
    { name: 'response', path: 'Bundle.entry.response', cardinality: '0..1', description: 'Results of execution' },
    { name: 'id', path: 'Bundle.entry.response.id', cardinality: '0..1', description: 'Unique id for inter-element referencing' }
];

function testBundleGrouping(elements) {
    // Resource inheritance fields
    const resourceFields = new Set(['id', 'meta', 'implicitRules', 'language']);
    
    const inheritedElements = [];
    const businessElements = [];
    
    elements.forEach(element => {
        // Only consider top-level fields for inheritance (not nested like Bundle.entry.id)
        const path = element.path || element.name;
        const pathParts = path.split('.');
        const isTopLevel = pathParts.length <= 2; // e.g., "Bundle.id" but not "Bundle.entry.id"
        
        if (isTopLevel && resourceFields.has(element.name)) {
            inheritedElements.push(element);
        } else {
            businessElements.push(element);
        }
    });
    
    return {
        inheritedElements: inheritedElements.map(e => `${e.name} (${e.path})`),
        businessElements: businessElements.map(e => `${e.name} (${e.path})`),
        inheritedCount: inheritedElements.length,
        businessCount: businessElements.length
    };
}

console.log('Bundle Deduplication Test:');
const result = testBundleGrouping(mockBundleElements);

console.log(`\nInherited Elements (${result.inheritedCount}):`);
result.inheritedElements.forEach((element, index) => {
    console.log(`  ${index + 1}. ${element}`);
});

console.log(`\nBusiness Elements (${result.businessCount}):`);
result.businessElements.forEach((element, index) => {
    console.log(`  ${index + 1}. ${element}`);
});

console.log('\n✅ Should show only ONE "id" element in inherited (Bundle.id)');
console.log('✅ Other nested "id" elements should be in business elements');