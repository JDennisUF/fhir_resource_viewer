#!/usr/bin/env node

/**
 * FHIR Specification Download Script (Node.js)
 * Downloads and processes FHIR R4 and US Core specifications
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class FHIRSpecDownloader {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.dataDir = path.join(this.baseDir, 'data');
        this.fhirDir = path.join(this.dataDir, 'fhir-r4');
        this.usCoreDir = path.join(this.dataDir, 'us-core');
        
        this.fhirBaseUrl = 'https://hl7.org/fhir/R4/';
        this.usCoreBaseUrl = 'https://hl7.org/fhir/us/core/';
        
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.dataDir, this.fhirDir, this.usCoreDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }

    async downloadJSON(url) {
        return new Promise((resolve, reject) => {
            console.log(`Downloading: ${url}`);
            
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (error) {
                        reject(new Error(`JSON parse error: ${error.message}`));
                    }
                });
            }).on('error', reject);
        });
    }

    async downloadFHIRResources() {
        console.log('\n=== Downloading FHIR R4 Resources ===');
        
        // Core FHIR resources to download
        const coreResources = [
            'Patient', 'Observation', 'Practitioner', 'Organization', 
            'Encounter', 'Procedure', 'Medication', 'MedicationRequest',
            'Condition', 'AllergyIntolerance', 'DiagnosticReport', 
            'DocumentReference', 'Immunization', 'Location'
        ];
        
        const fhirData = {};
        
        for (const resourceName of coreResources) {
            try {
                // Download structure definition
                const url = `${this.fhirBaseUrl}${resourceName.toLowerCase()}.profile.json`;
                const structureDefinition = await this.downloadJSON(url);
                
                // Process and simplify the structure definition
                const processedResource = this.processStructureDefinition(structureDefinition);
                fhirData[resourceName] = processedResource;
                
                console.log(`✓ Downloaded ${resourceName}`);
                
                // Add delay to be respectful to the server
                await this.delay(100);
                
            } catch (error) {
                console.warn(`⚠ Failed to download ${resourceName}: ${error.message}`);
                
                // Fallback to sample data
                fhirData[resourceName] = this.createFallbackResource(resourceName);
            }
        }
        
        // Save processed FHIR data
        const outputFile = path.join(this.fhirDir, 'resources.json');
        fs.writeFileSync(outputFile, JSON.stringify(fhirData, null, 2));
        console.log(`Saved FHIR resources to: ${outputFile}`);
        
        return fhirData;
    }

    async downloadUSCoreProfiles() {
        console.log('\n=== Downloading US Core Profiles ===');
        
        // US Core profiles to download
        const usCoreProfiles = [
            'us-core-patient', 'us-core-observation-lab', 'us-core-practitioner',
            'us-core-organization', 'us-core-encounter', 'us-core-procedure',
            'us-core-medication', 'us-core-medicationrequest', 'us-core-condition',
            'us-core-allergyintolerance', 'us-core-diagnosticreport-lab',
            'us-core-documentreference', 'us-core-immunization', 'us-core-location'
        ];
        
        const usCoreData = {};
        
        for (const profileName of usCoreProfiles) {
            try {
                // Download structure definition
                const url = `${this.usCoreBaseUrl}StructureDefinition-${profileName}.json`;
                const structureDefinition = await this.downloadJSON(url);
                
                // Process and simplify the structure definition
                const processedProfile = this.processUSCoreProfile(structureDefinition);
                
                // Use a clean name for the key
                const cleanName = this.getCleanProfileName(profileName);
                usCoreData[cleanName] = processedProfile;
                
                console.log(`✓ Downloaded ${cleanName}`);
                
                // Add delay to be respectful to the server
                await this.delay(100);
                
            } catch (error) {
                console.warn(`⚠ Failed to download ${profileName}: ${error.message}`);
                
                // Fallback to sample data
                const cleanName = this.getCleanProfileName(profileName);
                usCoreData[cleanName] = this.createFallbackUSCoreProfile(profileName);
            }
        }
        
        // Save processed US Core data
        const outputFile = path.join(this.usCoreDir, 'profiles.json');
        fs.writeFileSync(outputFile, JSON.stringify(usCoreData, null, 2));
        console.log(`Saved US Core profiles to: ${outputFile}`);
        
        return usCoreData;
    }

    processStructureDefinition(structureDefinition) {
        const processed = {
            name: structureDefinition.name || structureDefinition.id,
            description: structureDefinition.description || '',
            type: 'resource',
            url: structureDefinition.url,
            version: structureDefinition.version,
            status: structureDefinition.status,
            kind: structureDefinition.kind,
            abstract: structureDefinition.abstract,
            elements: []
        };
        
        // Process snapshot elements
        if (structureDefinition.snapshot && structureDefinition.snapshot.element) {
            processed.elements = structureDefinition.snapshot.element
                .filter(element => element.path && element.path.includes('.'))
                .map(element => this.processElement(element))
                .filter(element => element !== null);
        }
        
        return processed;
    }

    processUSCoreProfile(structureDefinition) {
        const processed = this.processStructureDefinition(structureDefinition);
        processed.type = 'profile';
        processed.baseResource = structureDefinition.baseDefinition ? 
            structureDefinition.baseDefinition.split('/').pop() : 'Unknown';
        
        // Mark must-support elements
        if (structureDefinition.snapshot && structureDefinition.snapshot.element) {
            processed.elements = structureDefinition.snapshot.element
                .filter(element => element.path && element.path.includes('.'))
                .map(element => {
                    const processedElement = this.processElement(element);
                    if (processedElement && element.mustSupport) {
                        processedElement.mustSupport = true;
                    }
                    return processedElement;
                })
                .filter(element => element !== null);
        }
        
        return processed;
    }

    processElement(element) {
        if (!element.path || !element.path.includes('.')) {
            return null;
        }
        
        const pathParts = element.path.split('.');
        const elementName = pathParts[pathParts.length - 1];
        
        return {
            name: elementName,
            type: this.getElementType(element),
            cardinality: element.min !== undefined && element.max !== undefined ? 
                `${element.min}..${element.max}` : '0..*',
            description: element.short || element.definition || '',
            path: element.path,
            binding: element.binding ? {
                strength: element.binding.strength,
                valueSet: element.binding.valueSet
            } : undefined
        };
    }

    getElementType(element) {
        if (element.type && element.type.length > 0) {
            return element.type.map(t => t.code).join(' | ');
        }
        return 'unknown';
    }

    getCleanProfileName(profileName) {
        return profileName
            .replace('us-core-', '')
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
    }

    createFallbackResource(resourceName) {
        return {
            name: resourceName,
            description: `${resourceName} resource definition (fallback)`,
            type: 'resource',
            url: `http://hl7.org/fhir/StructureDefinition/${resourceName}`,
            version: '4.0.1',
            status: 'active',
            kind: 'resource',
            abstract: false,
            elements: [
                {
                    name: 'id',
                    type: 'id',
                    cardinality: '0..1',
                    description: 'Logical id of this artifact',
                    path: `${resourceName}.id`
                }
            ]
        };
    }

    createFallbackUSCoreProfile(profileName) {
        const cleanName = this.getCleanProfileName(profileName);
        return {
            name: `${cleanName} Profile`,
            description: `US Core ${cleanName} profile (fallback)`,
            type: 'profile',
            baseResource: cleanName.replace(/^USCore/, ''),
            url: `http://hl7.org/fhir/us/core/StructureDefinition/${profileName}`,
            version: '3.1.1',
            status: 'active',
            mustSupport: true,
            elements: []
        };
    }

    async createIndexFile(fhirData, usCoreData) {
        const index = {
            lastUpdated: new Date().toISOString(),
            fhirVersion: '4.0.1',
            usCoreVersion: '3.1.1',
            stats: {
                fhirResources: Object.keys(fhirData).length,
                usCoreProfiles: Object.keys(usCoreData).length
            },
            resources: {
                'fhir-r4': Object.keys(fhirData),
                'us-core': Object.keys(usCoreData)
            }
        };
        
        const indexFile = path.join(this.dataDir, 'index.json');
        fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
        console.log(`\nCreated index file: ${indexFile}`);
        
        return index;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        try {
            console.log('FHIR Specification Downloader');
            console.log('=============================');
            
            const fhirData = await this.downloadFHIRResources();
            const usCoreData = await this.downloadUSCoreProfiles();
            const index = await this.createIndexFile(fhirData, usCoreData);
            
            console.log('\n=== Download Complete ===');
            console.log(`FHIR R4 Resources: ${index.stats.fhirResources}`);
            console.log(`US Core Profiles: ${index.stats.usCoreProfiles}`);
            console.log(`Data directory: ${this.dataDir}`);
            
        } catch (error) {
            console.error('\n❌ Download failed:', error.message);
            process.exit(1);
        }
    }
}

// Run the downloader if this script is executed directly
if (require.main === module) {
    const downloader = new FHIRSpecDownloader();
    downloader.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = FHIRSpecDownloader;