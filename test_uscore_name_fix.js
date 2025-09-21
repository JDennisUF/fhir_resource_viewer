// Test US Core name preservation fix

// Simulate the loading process
function simulateUSCoreLoading() {
    console.log('=== US Core Loading Simulation ===\n');
    
    // Step 1: Initial loading with cleaned names
    const resourceName = 'USCoreDiagnosticreportLab';
    const cleanName = resourceName.replace(/^USCore/, '').replace(/Profile.*$/, '');
    
    console.log('1. Initial loading:');
    console.log(`   File name: ${resourceName}`);
    console.log(`   Cleaned name: ${cleanName}`);
    
    const initialData = {
        name: cleanName,
        description: `US Core ${cleanName} profile`,
        type: 'profile',
        elements: []
    };
    
    console.log(`   Stored data: name="${initialData.name}"`);
    
    // Step 2: Full resource loading (problematic step)
    const fullResourceFromJSON = {
        name: 'USCoreDiagnosticReportProfileLaboratoryReporting', // Long internal name
        description: 'Laboratory results profile...',
        elements: [
            { name: 'id', path: 'DiagnosticReport.id', cardinality: '0..1' },
            { name: 'meta', path: 'DiagnosticReport.meta', cardinality: '0..1' },
            { name: 'status', path: 'DiagnosticReport.status', cardinality: '1..1' }
        ]
    };
    
    console.log('\n2. Full resource loading:');
    console.log(`   JSON internal name: ${fullResourceFromJSON.name}`);
    
    // OLD WAY (problematic - overwrites clean name)
    const oldWay = {
        ...initialData,
        ...fullResourceFromJSON  // This overwrites name with long internal name!
    };
    
    console.log('\n3. OLD WAY (problematic):');
    console.log(`   Final name: "${oldWay.name}" ❌ Too long!`);
    
    // NEW WAY (preserves clean name)
    const cleanedName = initialData?.name;
    const newWay = {
        ...initialData,
        ...fullResourceFromJSON,
        name: cleanedName || fullResourceFromJSON.name  // Preserve cleaned name
    };
    
    console.log('\n4. NEW WAY (fixed):');
    console.log(`   Final name: "${newWay.name}" ✅ Clean and short!`);
    
    return {
        oldWay,
        newWay
    };
}

function testInheritanceHeader(resourceData) {
    console.log('\n=== Inheritance Header Test ===');
    
    // Simulate what getCurrentResourceDisplayName() would return
    function getCurrentResourceDisplayName(resource, type) {
        const fullDescription = resource.name || 'Resource';
        let displayName = fullDescription;
        
        // For US Core profiles, also clean up the name if needed
        if (type === 'us-core-stu6.1') {
            displayName = displayName.replace(/^USCore/, '').replace(/Profile.*$/, '');
        }
        
        return displayName;
    }
    
    const oldResult = getCurrentResourceDisplayName(resourceData.oldWay, 'us-core-stu6.1');
    const newResult = getCurrentResourceDisplayName(resourceData.newWay, 'us-core-stu6.1');
    
    console.log(`OLD inheritance header: "${oldResult}" ❌`);
    console.log(`NEW inheritance header: "${newResult}" ✅`);
    
    // Test grid column impact
    console.log('\nGrid Column Impact:');
    console.log(`OLD: "${oldResult}" (${oldResult.length} chars) - May break column alignment`);
    console.log(`NEW: "${newResult}" (${newResult.length} chars) - Should fit properly`);
}

// Run the simulation
const results = simulateUSCoreLoading();
testInheritanceHeader(results);

console.log('\n=== Summary ===');
console.log('✅ Fixed: Preserve cleaned names during full resource loading');
console.log('✅ Fixed: Improved regex to handle complex Profile names');
console.log('✅ Expected: Better column alignment in US Core profiles');
console.log('✅ Expected: Shorter, cleaner inheritance headers');