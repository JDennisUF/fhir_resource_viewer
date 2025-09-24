const fs = require('fs');

// Load CarePlan data
const carePlanData = JSON.parse(fs.readFileSync('./data/fhir-r4/resources/CarePlan.json', 'utf8'));

console.log('Total elements:', carePlanData.elements.length);

// Find all activity.detail elements
const activityDetailElements = carePlanData.elements.filter(e => 
    e.path && e.path.includes('CarePlan.activity.detail')
);

console.log('Activity.detail elements found:', activityDetailElements.length);
console.log('Paths:');
activityDetailElements.forEach((e, i) => {
    console.log(`${i + 1}. ${e.path} (${e.name})`);
});

// Check specifically for the parent element
const detailParent = carePlanData.elements.find(e => e.path === 'CarePlan.activity.detail');
console.log('\nDetail parent element found:', !!detailParent);
if (detailParent) {
    console.log('Detail parent:', detailParent.name, detailParent.cardinality);
}

// Check for activity parent
const activityParent = carePlanData.elements.find(e => e.path === 'CarePlan.activity');
console.log('Activity parent element found:', !!activityParent);
if (activityParent) {
    console.log('Activity parent:', activityParent.name, activityParent.cardinality);
}