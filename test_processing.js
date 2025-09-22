// Test script to verify StructureDefinition processing
const fs = require('fs');

// Mock the storage class methods we need
class TestStorage {
    processStructureDefinition(structureDefinition) {
        const elements = [];
        
        // Use differential elements if available, otherwise use snapshot
        const sourceElements = structureDefinition.differential?.element || 
                              structureDefinition.snapshot?.element || [];
        
        console.log(`Processing ${sourceElements.length} elements from StructureDefinition`);
        
        sourceElements.forEach((element, index) => {
            // Skip the root element (usually just the resource type itself)
            if (element.path && !element.path.includes('.')) {
                return;
            }
            
            const processedElement = {
                path: element.path || '',
                name: this.extractElementName(element.path),
                cardinality: this.formatCardinality(element.min, element.max),
                type: this.extractElementType(element),
                description: element.short || element.definition || '',
                mustSupport: element.mustSupport || false,
                binding: element.binding ? {
                    strength: element.binding.strength,
                    valueSet: element.binding.valueSet
                } : null,
                constraints: element.constraint || [],
                slicing: element.slicing || null,
                isExtension: element.path?.includes('extension'),
                level: this.calculateElementLevel(element.path)
            };
            
            elements.push(processedElement);
        });
        
        // Create the processed resource in application format
        // Determine if this is a profile by checking the URL or baseDefinition
        const isUSCoreProfile = structureDefinition.url?.includes('/us/core/') || 
                               structureDefinition.baseDefinition?.includes('/us/core/') ||
                               structureDefinition.name?.includes('USCore') ||
                               structureDefinition.id?.includes('us-core');
        
        return {
            name: structureDefinition.name || structureDefinition.id,
            title: structureDefinition.title || structureDefinition.name,
            description: structureDefinition.description,
            type: isUSCoreProfile ? 'profile' : (structureDefinition.kind === 'resource' ? 'resource' : 'profile'),
            baseDefinition: structureDefinition.baseDefinition,
            elements: elements,
            mustSupportCount: elements.filter(el => el.mustSupport).length,
            fhirVersion: structureDefinition.fhirVersion,
            url: structureDefinition.url
        };
    }

    extractElementName(path) {
        if (!path) return '';
        const parts = path.split('.');
        return parts[parts.length - 1];
    }

    formatCardinality(min, max) {
        if (min === undefined && max === undefined) return '';
        const minStr = min !== undefined ? min.toString() : '0';
        const maxStr = max === '*' ? '*' : (max !== undefined ? max.toString() : '1');
        return `${minStr}..${maxStr}`;
    }

    extractElementType(element) {
        if (!element.type || element.type.length === 0) return '';
        
        // Handle multiple types
        if (element.type.length === 1) {
            const type = element.type[0];
            return type.code + (type.profile ? ` (${type.profile.split('/').pop()})` : '');
        } else {
            return element.type.map(t => t.code).join(' | ');
        }
    }

    calculateElementLevel(path) {
        if (!path) return 0;
        return path.split('.').length - 1;
    }
}

// Test with actual files
const testProfiles = [
    'USCoreBMI',
    'USCorePulseOximetry',
    'USCoreHeadCircumference'
];

const storage = new TestStorage();

testProfiles.forEach(profileName => {
    try {
        const filePath = `data/us-core-stu6.1/profiles/${profileName}.json`;
        const rawData = fs.readFileSync(filePath, 'utf8');
        const structureDefinition = JSON.parse(rawData);
        
        console.log(`\n=== Testing ${profileName} ===`);
        console.log(`ResourceType: ${structureDefinition.resourceType}`);
        
        if (structureDefinition.resourceType === 'StructureDefinition') {
            const processed = storage.processStructureDefinition(structureDefinition);
            console.log(`✅ Processed successfully!`);
            console.log(`   - Name: ${processed.name}`);
            console.log(`   - Type: ${processed.type}`);
            console.log(`   - Kind: ${structureDefinition.kind}`);
            console.log(`   - Elements: ${processed.elements.length}`);
            console.log(`   - Must Support: ${processed.mustSupportCount}`);
            console.log(`   - First 3 elements:`);
            processed.elements.slice(0, 3).forEach(el => {
                const mustFlag = el.mustSupport ? ' [S]' : '';
                console.log(`     ${el.path}: ${el.type}${mustFlag}`);
            });
        } else {
            console.log(`❌ Not a StructureDefinition: ${structureDefinition.resourceType}`);
        }
        
    } catch (error) {
        console.log(`❌ Error processing ${profileName}: ${error.message}`);
    }
});

console.log('\n🎯 Test complete!');