// Test two-row description truncation logic

function truncateToTwoRows(text, maxCharsPerRow = 80) {
    if (!text || text.length === 0) return text;
    
    // Estimate characters that fit in 2 rows (accounting for word boundaries)
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

function renderElementDescription(element) {
    const fullDescription = element.description || element.short || '';
    
    if (!fullDescription) return '';
    
    const truncatedDescription = truncateToTwoRows(fullDescription);
    
    // If we truncated the description, add a tooltip with the full text
    if (truncatedDescription !== fullDescription) {
        const escapedDescription = fullDescription.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `<span title="${escapedDescription}" class="truncated-description">${truncatedDescription}</span>`;
    }
    
    return fullDescription;
}

// Test cases with various description lengths
const testElements = [
    {
        name: 'active',
        description: 'Whether this patient record is in active use'
    },
    {
        name: 'name',
        description: 'A name associated with the individual patient or contact person'
    },
    {
        name: 'extension',
        description: 'May be used to represent additional information that is not part of the basic definition of the resource. To make the use of extensions safe and manageable, there is a strict set of governance applied to the definition and use of extensions. Though any implementer can define an extension, there is a set of requirements that SHALL be met as part of the definition of the extension.'
    },
    {
        name: 'modifierExtension',
        description: 'May be used to represent additional information that is not part of the basic definition of the resource and that modifies the understanding of the element that contains it and/or the understanding of the containing element\'s descendants. Usually modifier elements provide negation or qualification. To make the use of extensions safe and manageable, there is a strict set of governance applied to the definition and use of extensions. Though any implementer is allowed to define an extension, there is a set of requirements that SHALL be met as part of the definition of the extension. Applications processing a resource are required to check for modifier extensions. Modifier extensions SHALL NOT change the meaning of any elements on Resource or DomainResource (including cannot change the meaning of modifierExtension itself).'
    },
    {
        name: 'identifier',
        description: 'An identifier for this patient or contact person. Identifiers are typically used when a direct URL reference to the resource is not appropriate because the referenced resource is not hosted on the same server or at all'
    }
];

console.log('Two-Row Description Truncation Test Results:\n');

testElements.forEach((element, index) => {
    console.log(`${index + 1}. Element: ${element.name}`);
    console.log(`   Original: ${element.description.length} chars`);
    console.log(`   Original: "${element.description}"`);
    
    const result = renderElementDescription(element);
    const hasTooltip = result.includes('title=');
    
    if (hasTooltip) {
        // Extract truncated text
        const match = result.match(/>([^<]+)<\/span>/);
        const truncatedText = match ? match[1] : '';
        console.log(`   Truncated: ${truncatedText.length} chars`);
        console.log(`   Truncated: "${truncatedText}"`);
        console.log(`   Status: ✅ Truncated with tooltip`);
    } else {
        console.log(`   Status: ✅ No truncation needed`);
    }
    console.log('');
});

console.log('Summary:');
console.log('- Short descriptions: No change');
console.log('- Long descriptions: Truncated to ~160 chars (2 rows @ 80 chars each)');
console.log('- All truncated descriptions: Available via hover tooltip');
console.log('- Word boundaries: Respected to avoid breaking words');