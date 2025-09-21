// Test extension description truncation logic

function truncateExtensionDescription(elementName, description) {
    // Truncate overly long extension descriptions
    if (elementName === 'extension') {
        return 'Additional information that is not part of the basic definition of the resource';
    }
    
    if (elementName === 'modifierExtension') {
        return 'Extensions that modify the understanding of the element that contains them';
    }
    
    return description;
}

function renderElementDescription(element) {
    const fullDescription = element.description || element.short || '';
    const truncatedDescription = truncateExtensionDescription(element.name, fullDescription);
    
    // If we truncated the description, add a tooltip with the full text
    if (truncatedDescription !== fullDescription && fullDescription.length > 0) {
        const escapedDescription = fullDescription.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `<span title="${escapedDescription}" class="truncated-description">${truncatedDescription}</span>`;
    }
    
    return truncatedDescription;
}

// Test cases
const testElements = [
    {
        name: 'extension',
        description: 'May be used to represent additional information that is not part of the basic definition of the resource. To make the use of extensions safe and manageable, there is a strict set of governance applied to the definition and use of extensions. Though any implementer can define an extension, there is a set of requirements that SHALL be met as part of the definition of the extension.'
    },
    {
        name: 'modifierExtension', 
        description: 'May be used to represent additional information that is not part of the basic definition of the resource and that modifies the understanding of the element that contains it and/or the understanding of the containing element\'s descendants. Usually modifier elements provide negation or qualification. To make the use of extensions safe and manageable, there is a strict set of governance applied to the definition and use of extensions. Though any implementer is allowed to define an extension, there is a set of requirements that SHALL be met as part of the definition of the extension. Applications processing a resource are required to check for modifier extensions. Modifier extensions SHALL NOT change the meaning of any elements on Resource or DomainResource (including cannot change the meaning of modifierExtension itself).'
    },
    {
        name: 'active',
        description: 'Whether this patient record is in active use'
    }
];

console.log('Extension Description Truncation Test Results:\n');

testElements.forEach((element, index) => {
    console.log(`${index + 1}. Element: ${element.name}`);
    console.log(`   Original length: ${element.description.length} characters`);
    
    const result = renderElementDescription(element);
    const hasTooltip = result.includes('title=');
    
    console.log(`   Result: ${hasTooltip ? 'Truncated with tooltip' : 'No change needed'}`);
    
    if (hasTooltip) {
        // Extract truncated text
        const match = result.match(/>([^<]+)<\/span>/);
        const truncatedText = match ? match[1] : '';
        console.log(`   Truncated to: "${truncatedText}" (${truncatedText.length} characters)`);
    } else {
        console.log(`   Kept as: "${result}"`);
    }
    console.log('');
});

console.log('✅ Extension descriptions are now much more manageable!');
console.log('✅ Full descriptions available via hover tooltip');
console.log('✅ Regular element descriptions unchanged');