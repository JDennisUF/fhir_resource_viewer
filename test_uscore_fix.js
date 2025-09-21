// Mock the logic from the fix
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

// Test with USCoreGoal
const mockCurrentResource = { name: 'USCoreGoal', type: 'us-core-stu6.1' };
const mockFhirData = {
    'us-core-stu6.1': {
        'USCoreGoal': {
            name: 'Goal', // This was cleaned during loading
            description: 'US Core Goal profile'
        }
    }
};

const result = getCurrentResourceDisplayName(mockCurrentResource, null, mockFhirData);
console.log('Original name: USCoreGoal');
console.log('Cleaned name for Elements header:', result);

// Test with regular R4 resource
const mockR4Resource = { name: 'Patient', type: 'fhir-r4' };
const mockR4Data = {
    'fhir-r4': {
        'Patient': {
            name: 'Patient',
            description: 'Patient resource'
        }
    }
};

const r4Result = getCurrentResourceDisplayName(mockR4Resource, null, mockR4Data);
console.log('R4 Resource name:', r4Result);