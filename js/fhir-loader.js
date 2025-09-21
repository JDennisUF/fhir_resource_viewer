// FHIR Data Loader and Parser
class FHIRLoader {
    constructor() {
        this.baseUrls = {
            'fhir-r4': 'https://hl7.org/fhir/R4/',
            'us-core': 'https://hl7.org/fhir/us/core/'
        };
        this.cache = new Map();
    }

    async loadResourceDefinitions(type = 'all') {
        try {
            const promises = [];
            
            if (type === 'all' || type === 'fhir-r4') {
                promises.push(this.loadFHIRR4Resources());
            }
            
            if (type === 'all' || type === 'us-core') {
                promises.push(this.loadUSCoreProfiles());
            }
            
            const results = await Promise.all(promises);
            
            let combinedData = {};
            results.forEach(result => {
                combinedData = { ...combinedData, ...result };
            });
            
            return combinedData;
        } catch (error) {
            console.error('Error loading FHIR resources:', error);
            throw new Error('Failed to load FHIR resource definitions');
        }
    }

    async loadFHIRR4Resources() {
        // In a real implementation, this would fetch from FHIR servers
        // For now, we'll return sample data structure
        return {
            'fhir-r4': await this.getSampleFHIRResources()
        };
    }

    async loadUSCoreProfiles() {
        // In a real implementation, this would fetch US Core profiles
        // For now, we'll return sample data structure
        return {
            'us-core': await this.getSampleUSCoreProfiles()
        };
    }

    async getSampleFHIRResources() {
        return {
            "Patient": {
                "name": "Patient",
                "description": "Demographics and other administrative information about an individual or animal receiving care or other health-related services.",
                "type": "resource",
                "url": "http://hl7.org/fhir/StructureDefinition/Patient",
                "version": "4.0.1",
                "status": "active",
                "kind": "resource",
                "abstract": false,
                "elements": [
                    {
                        "name": "id",
                        "type": "id",
                        "cardinality": "0..1",
                        "description": "Logical id of this artifact",
                        "path": "Patient.id"
                    },
                    {
                        "name": "meta",
                        "type": "Meta",
                        "cardinality": "0..1",
                        "description": "Metadata about the resource",
                        "path": "Patient.meta"
                    },
                    {
                        "name": "identifier",
                        "type": "Identifier",
                        "cardinality": "0..*",
                        "description": "An identifier for this patient",
                        "path": "Patient.identifier"
                    },
                    {
                        "name": "active",
                        "type": "boolean",
                        "cardinality": "0..1",
                        "description": "Whether this patient's record is in active use",
                        "path": "Patient.active"
                    },
                    {
                        "name": "name",
                        "type": "HumanName",
                        "cardinality": "0..*",
                        "description": "A name associated with the patient",
                        "path": "Patient.name"
                    },
                    {
                        "name": "telecom",
                        "type": "ContactPoint",
                        "cardinality": "0..*",
                        "description": "A contact detail for the individual",
                        "path": "Patient.telecom"
                    },
                    {
                        "name": "gender",
                        "type": "code",
                        "cardinality": "0..1",
                        "description": "male | female | other | unknown",
                        "path": "Patient.gender",
                        "binding": {
                            "strength": "required",
                            "valueSet": "http://hl7.org/fhir/ValueSet/administrative-gender"
                        }
                    },
                    {
                        "name": "birthDate",
                        "type": "date",
                        "cardinality": "0..1",
                        "description": "The date of birth for the individual",
                        "path": "Patient.birthDate"
                    },
                    {
                        "name": "deceased[x]",
                        "type": "boolean | dateTime",
                        "cardinality": "0..1",
                        "description": "Indicates if the individual is deceased or not",
                        "path": "Patient.deceased[x]"
                    },
                    {
                        "name": "address",
                        "type": "Address",
                        "cardinality": "0..*",
                        "description": "An address for the individual",
                        "path": "Patient.address"
                    }
                ]
            },
            "Observation": {
                "name": "Observation",
                "description": "Measurements and simple assertions made about a patient, device or other subject.",
                "type": "resource",
                "url": "http://hl7.org/fhir/StructureDefinition/Observation",
                "version": "4.0.1",
                "status": "active",
                "kind": "resource",
                "abstract": false,
                "elements": [
                    {
                        "name": "id",
                        "type": "id",
                        "cardinality": "0..1",
                        "description": "Logical id of this artifact",
                        "path": "Observation.id"
                    },
                    {
                        "name": "status",
                        "type": "code",
                        "cardinality": "1..1",
                        "description": "registered | preliminary | final | amended +",
                        "path": "Observation.status",
                        "binding": {
                            "strength": "required",
                            "valueSet": "http://hl7.org/fhir/ValueSet/observation-status"
                        }
                    },
                    {
                        "name": "category",
                        "type": "CodeableConcept",
                        "cardinality": "0..*",
                        "description": "Classification of type of observation",
                        "path": "Observation.category"
                    },
                    {
                        "name": "code",
                        "type": "CodeableConcept",
                        "cardinality": "1..1",
                        "description": "Type of observation (code / type)",
                        "path": "Observation.code"
                    },
                    {
                        "name": "subject",
                        "type": "Reference(Patient | Group | Device | Location)",
                        "cardinality": "0..1",
                        "description": "Who and/or what the observation is about",
                        "path": "Observation.subject"
                    },
                    {
                        "name": "encounter",
                        "type": "Reference(Encounter)",
                        "cardinality": "0..1",
                        "description": "Healthcare event during which this observation is made",
                        "path": "Observation.encounter"
                    },
                    {
                        "name": "effective[x]",
                        "type": "dateTime | Period | Timing | instant",
                        "cardinality": "0..1",
                        "description": "Clinically relevant time/time-period for observation",
                        "path": "Observation.effective[x]"
                    },
                    {
                        "name": "value[x]",
                        "type": "Quantity | CodeableConcept | string | boolean | integer | Range | Ratio | SampledData | time | dateTime | Period",
                        "cardinality": "0..1",
                        "description": "Actual result",
                        "path": "Observation.value[x]"
                    }
                ]
            },
            "Practitioner": {
                "name": "Practitioner",
                "description": "A person who is directly or indirectly involved in the provisioning of healthcare.",
                "type": "resource",
                "url": "http://hl7.org/fhir/StructureDefinition/Practitioner",
                "version": "4.0.1",
                "status": "active",
                "kind": "resource",
                "abstract": false,
                "elements": [
                    {
                        "name": "id",
                        "type": "id",
                        "cardinality": "0..1",
                        "description": "Logical id of this artifact",
                        "path": "Practitioner.id"
                    },
                    {
                        "name": "identifier",
                        "type": "Identifier",
                        "cardinality": "0..*",
                        "description": "An identifier for the person as this agent",
                        "path": "Practitioner.identifier"
                    },
                    {
                        "name": "active",
                        "type": "boolean",
                        "cardinality": "0..1",
                        "description": "Whether this practitioner's record is in active use",
                        "path": "Practitioner.active"
                    },
                    {
                        "name": "name",
                        "type": "HumanName",
                        "cardinality": "0..*",
                        "description": "The name(s) associated with the practitioner",
                        "path": "Practitioner.name"
                    },
                    {
                        "name": "telecom",
                        "type": "ContactPoint",
                        "cardinality": "0..*",
                        "description": "A contact detail for the practitioner",
                        "path": "Practitioner.telecom"
                    }
                ]
            },
            "Organization": {
                "name": "Organization",
                "description": "A formally or informally recognized grouping of people or organizations formed for the purpose of achieving some form of collective action.",
                "type": "resource",
                "url": "http://hl7.org/fhir/StructureDefinition/Organization",
                "version": "4.0.1",
                "status": "active",
                "kind": "resource",
                "abstract": false,
                "elements": [
                    {
                        "name": "id",
                        "type": "id",
                        "cardinality": "0..1",
                        "description": "Logical id of this artifact",
                        "path": "Organization.id"
                    },
                    {
                        "name": "identifier",
                        "type": "Identifier",
                        "cardinality": "0..*",
                        "description": "Identifies this organization across multiple systems",
                        "path": "Organization.identifier"
                    },
                    {
                        "name": "active",
                        "type": "boolean",
                        "cardinality": "0..1",
                        "description": "Whether the organization's record is still in active use",
                        "path": "Organization.active"
                    },
                    {
                        "name": "name",
                        "type": "string",
                        "cardinality": "0..1",
                        "description": "Name used for the organization",
                        "path": "Organization.name"
                    },
                    {
                        "name": "telecom",
                        "type": "ContactPoint",
                        "cardinality": "0..*",
                        "description": "A contact detail for the organization",
                        "path": "Organization.telecom"
                    },
                    {
                        "name": "address",
                        "type": "Address",
                        "cardinality": "0..*",
                        "description": "An address for the organization",
                        "path": "Organization.address"
                    }
                ]
            }
        };
    }

    async getSampleUSCoreProfiles() {
        return {
            "USCorePatient": {
                "name": "US Core Patient Profile",
                "description": "The US Core Patient Profile is based upon the core FHIR Patient Resource and meets the U.S. Core Data for Interoperability (USCDI) v1 'Patient Demographics' requirements.",
                "type": "profile",
                "baseResource": "Patient",
                "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
                "version": "3.1.1",
                "status": "active",
                "mustSupport": true,
                "elements": [
                    {
                        "name": "identifier",
                        "type": "Identifier",
                        "cardinality": "1..*",
                        "description": "An identifier for this patient (REQUIRED in US Core)",
                        "mustSupport": true,
                        "path": "Patient.identifier",
                        "constraint": "Patient.identifier must be present"
                    },
                    {
                        "name": "name",
                        "type": "HumanName",
                        "cardinality": "1..*",
                        "description": "A name associated with the patient (REQUIRED in US Core)",
                        "mustSupport": true,
                        "path": "Patient.name",
                        "constraint": "Patient.name must be present"
                    },
                    {
                        "name": "telecom",
                        "type": "ContactPoint",
                        "cardinality": "0..*",
                        "description": "A contact detail for the individual",
                        "mustSupport": true,
                        "path": "Patient.telecom"
                    },
                    {
                        "name": "gender",
                        "type": "code",
                        "cardinality": "1..1",
                        "description": "Administrative Gender (REQUIRED in US Core)",
                        "mustSupport": true,
                        "path": "Patient.gender",
                        "constraint": "Patient.gender must be present"
                    },
                    {
                        "name": "birthDate",
                        "type": "date",
                        "cardinality": "0..1",
                        "description": "The date of birth for the individual",
                        "mustSupport": true,
                        "path": "Patient.birthDate"
                    },
                    {
                        "name": "address",
                        "type": "Address",
                        "cardinality": "0..*",
                        "description": "An address for the individual",
                        "mustSupport": true,
                        "path": "Patient.address"
                    }
                ]
            },
            "USCoreObservation": {
                "name": "US Core Observation Profile",
                "description": "The US Core Observation Profile is based upon the core FHIR Observation Resource and meets the U.S. Core Data for Interoperability (USCDI) requirements.",
                "type": "profile",
                "baseResource": "Observation",
                "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab",
                "version": "3.1.1",
                "status": "active",
                "mustSupport": true,
                "elements": [
                    {
                        "name": "status",
                        "type": "code",
                        "cardinality": "1..1",
                        "description": "registered | preliminary | final | amended +",
                        "mustSupport": true,
                        "path": "Observation.status"
                    },
                    {
                        "name": "category",
                        "type": "CodeableConcept",
                        "cardinality": "1..*",
                        "description": "Classification of type of observation",
                        "mustSupport": true,
                        "path": "Observation.category",
                        "constraint": "Must have a category of 'laboratory'"
                    },
                    {
                        "name": "code",
                        "type": "CodeableConcept",
                        "cardinality": "1..1",
                        "description": "Laboratory Test Name",
                        "mustSupport": true,
                        "path": "Observation.code"
                    },
                    {
                        "name": "subject",
                        "type": "Reference(US Core Patient)",
                        "cardinality": "1..1",
                        "description": "Who and/or what the observation is about",
                        "mustSupport": true,
                        "path": "Observation.subject",
                        "constraint": "Must reference US Core Patient"
                    },
                    {
                        "name": "effective[x]",
                        "type": "dateTime | Period",
                        "cardinality": "1..1",
                        "description": "Clinically relevant time/time-period for observation",
                        "mustSupport": true,
                        "path": "Observation.effective[x]"
                    },
                    {
                        "name": "value[x]",
                        "type": "Quantity | CodeableConcept | string",
                        "cardinality": "0..1",
                        "description": "Laboratory Result Value",
                        "mustSupport": true,
                        "path": "Observation.value[x]"
                    }
                ]
            },
            "USCorePractitioner": {
                "name": "US Core Practitioner Profile",
                "description": "The US Core Practitioner Profile is based upon the core FHIR Practitioner Resource and meets the U.S. Core Data for Interoperability (USCDI) 'Provider' requirements.",
                "type": "profile",
                "baseResource": "Practitioner",
                "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-practitioner",
                "version": "3.1.1",
                "status": "active",
                "mustSupport": true,
                "elements": [
                    {
                        "name": "identifier",
                        "type": "Identifier",
                        "cardinality": "1..*",
                        "description": "An identifier for the person as this agent (NPI required)",
                        "mustSupport": true,
                        "path": "Practitioner.identifier",
                        "constraint": "Must have NPI identifier"
                    },
                    {
                        "name": "name",
                        "type": "HumanName",
                        "cardinality": "1..*",
                        "description": "The name(s) associated with the practitioner",
                        "mustSupport": true,
                        "path": "Practitioner.name",
                        "constraint": "Must have name"
                    },
                    {
                        "name": "telecom",
                        "type": "ContactPoint",
                        "cardinality": "0..*",
                        "description": "A contact detail for the practitioner",
                        "mustSupport": true,
                        "path": "Practitioner.telecom"
                    }
                ]
            }
        };
    }

    // Utility methods for processing FHIR data
    processResourceDefinition(definition) {
        // Process and normalize resource definition
        const processed = {
            ...definition,
            elements: definition.elements || [],
            processedAt: new Date().toISOString()
        };
        
        // Add additional metadata
        processed.elementCount = processed.elements.length;
        processed.requiredElements = processed.elements.filter(e => 
            e.cardinality && (e.cardinality.startsWith('1') || e.mustSupport)
        ).length;
        
        return processed;
    }

    validateResourceStructure(resource) {
        const required = ['name', 'description', 'type'];
        return required.every(field => resource.hasOwnProperty(field));
    }

    async fetchFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    getCachedData(key) {
        return this.cache.get(key);
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    isCacheValid(key, maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        const cached = this.cache.get(key);
        if (!cached) return false;
        return (Date.now() - cached.timestamp) < maxAge;
    }
}

// Export for use in other modules
window.FHIRLoader = FHIRLoader;