// Test the breadcrumb fix
function getCurrentResourceDisplayName(currentResource, currentResourceData, fhirData) {
    if (!currentResource) return 'Resource';
    
    const { name, type } = currentResource;
    
    // Check if this is a data type (stored separately)
    let resource;
    if (currentResourceData) {
        resource = currentResourceData;
    } else {
        resource = fhirData[type][name];
    }
    
    if (!resource) return name;
    
    // Return the cleaned resource name
    let displayName = resource.name || name;
    // For US Core profiles, also clean up the name if needed
    if (type === 'us-core-stu6.1') {
        displayName = displayName.replace(/^USCore/, '').replace(/Profile$/, '');
    }
    
    return displayName;
}

// Mock scenario: User clicks on USCoreGoalProfile
const mockCurrentResource = { name: 'USCoreGoalProfile', type: 'us-core-stu6.1' };
const mockFhirData = {
    'us-core-stu6.1': {
        'USCoreGoalProfile': {
            name: 'Goal', // This was cleaned during loading
            description: 'US Core Goal profile'
        }
    }
};

// Simulate the breadcrumb generation
const cleanDisplayName = getCurrentResourceDisplayName(mockCurrentResource, null, mockFhirData);
const type = mockCurrentResource.type;

console.log('Original resource name:', mockCurrentResource.name);
console.log('Cleaned display name:', cleanDisplayName);

const breadcrumbHTML = `
    <a href="#" onclick="app.clearSelection()">Home</a> > 
    <a href="#" onclick="app.showTypeResources('${type}')">${type === 'fhir-r4' ? 'FHIR R4' : type === 'us-core-stu6.1' ? 'US Core' : type}</a> > 
    ${cleanDisplayName}
`;

console.log('Breadcrumb HTML:');
console.log(breadcrumbHTML.trim());