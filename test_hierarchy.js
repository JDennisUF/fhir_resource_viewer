const fs = require('fs');

// Load CarePlan data
const carePlanData = JSON.parse(fs.readFileSync('./data/fhir-r4/resources/CarePlan.json', 'utf8'));

// Simulate the buildElementHierarchy logic
function buildElementHierarchy(elements) {
    const hierarchy = [];
    const elementMap = new Map();
    const addedToHierarchy = new Set();
    
    // Skip inherited fields processing for this test
    const businessElements = elements.filter(element => {
        const inheritedFields = new Set(['id', 'meta', 'implicitRules', 'language', 'text', 'contained', 'extension', 'modifierExtension']);
        const path = element.path || element.name;
        const pathParts = path.split('.');
        const isTopLevel = pathParts.length <= 2;
        return !(isTopLevel && inheritedFields.has(element.name));
    });

    // First pass: create map of all elements by their path
    businessElements.forEach(element => {
        const path = element.path || element.name;
        elementMap.set(path, {
            ...element,
            children: [],
            fullPath: path
        });
    });

    // Second pass: build hierarchy
    businessElements.forEach(element => {
        const path = element.path || element.name;
        const pathParts = path.split('.');
        
        if (pathParts.length <= 2) {
            // Top-level element
            const elementNode = elementMap.get(path);
            if (elementNode && !addedToHierarchy.has(path)) {
                hierarchy.push(elementNode);
                addedToHierarchy.add(path);
            }
        } else {
            // Child element
            const parentPath = pathParts.slice(0, -1).join('.');
            const parent = elementMap.get(parentPath);
            if (parent) {
                const childNode = elementMap.get(path);
                if (childNode) {
                    parent.children.push(childNode);
                    addedToHierarchy.add(path);
                }
            } else {
                console.log('Missing parent for:', path, 'expected:', parentPath);
                // If parent not found, treat as top-level (fallback)
                const elementNode = elementMap.get(path);
                if (elementNode && !addedToHierarchy.has(path)) {
                    hierarchy.push(elementNode);
                    addedToHierarchy.add(path);
                }
            }
        }
    });

    return hierarchy;
}

// Test with CarePlan elements
const hierarchy = buildElementHierarchy(carePlanData.elements);
console.log('Built hierarchy with', hierarchy.length, 'top-level elements');

// Find activity element
const activityElement = hierarchy.find(h => h.name === 'activity');
if (activityElement) {
    console.log('\nActivity element found with', activityElement.children?.length, 'children');
    console.log('Activity children:', activityElement.children?.map(c => c.name));
    
    // Find detail element
    const detailElement = activityElement.children?.find(c => c.name === 'detail');
    if (detailElement) {
        console.log('\nDetail element found with', detailElement.children?.length, 'children');
        console.log('Detail children:', detailElement.children?.map(c => c.name));
    } else {
        console.log('\nDetail element NOT found in activity children');
        // Check if detail exists as top-level
        const topLevelDetail = hierarchy.find(h => h.name === 'detail');
        if (topLevelDetail) {
            console.log('Detail found as top-level element with', topLevelDetail.children?.length, 'children');
        }
    }
} else {
    console.log('\nActivity element NOT found in hierarchy');
}