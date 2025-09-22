// FHIR R4 Resource Documentation Links
class FHIRR4Links {
    constructor() {
        // Base URL for FHIR R4 specification
        this.baseUrl = 'https://hl7.org/fhir/R4/';
        
        // Map FHIR R4 resource names to official specification URLs
        this.resourceLinks = {
            'AllergyIntolerance': 'https://hl7.org/fhir/R4/allergyintolerance.html',
            'Basic': 'https://hl7.org/fhir/R4/basic.html',
            'Binary': 'https://hl7.org/fhir/R4/binary.html',
            'Bundle': 'https://hl7.org/fhir/R4/bundle.html',
            'CapabilityStatement': 'https://hl7.org/fhir/R4/capabilitystatement.html',
            'CarePlan': 'https://hl7.org/fhir/R4/careplan.html',
            'CareTeam': 'https://hl7.org/fhir/R4/careteam.html',
            'CodeSystem': 'https://hl7.org/fhir/R4/codesystem.html',
            'CompartmentDefinition': 'https://hl7.org/fhir/R4/compartmentdefinition.html',
            'ConceptMap': 'https://hl7.org/fhir/R4/conceptmap.html',
            'Condition': 'https://hl7.org/fhir/R4/condition.html',
            'Coverage': 'https://hl7.org/fhir/R4/coverage.html',
            'Device': 'https://hl7.org/fhir/R4/device.html',
            'DiagnosticReport': 'https://hl7.org/fhir/R4/diagnosticreport.html',
            'DocumentReference': 'https://hl7.org/fhir/R4/documentreference.html',
            'Encounter': 'https://hl7.org/fhir/R4/encounter.html',
            'ExampleScenario': 'https://hl7.org/fhir/R4/examplescenario.html',
            'Goal': 'https://hl7.org/fhir/R4/goal.html',
            'GraphDefinition': 'https://hl7.org/fhir/R4/graphdefinition.html',
            'Immunization': 'https://hl7.org/fhir/R4/immunization.html',
            'ImplementationGuide': 'https://hl7.org/fhir/R4/implementationguide.html',
            'Linkage': 'https://hl7.org/fhir/R4/linkage.html',
            'Location': 'https://hl7.org/fhir/R4/location.html',
            'Medication': 'https://hl7.org/fhir/R4/medication.html',
            'MedicationAdministration': 'https://hl7.org/fhir/R4/medicationadministration.html',
            'MedicationDispense': 'https://hl7.org/fhir/R4/medicationdispense.html',
            'MedicationRequest': 'https://hl7.org/fhir/R4/medicationrequest.html',
            'MedicationStatement': 'https://hl7.org/fhir/R4/medicationstatement.html',
            'MessageDefinition': 'https://hl7.org/fhir/R4/messagedefinition.html',
            'NamingSystem': 'https://hl7.org/fhir/R4/namingsystem.html',
            'Observation': 'https://hl7.org/fhir/R4/observation.html',
            'OperationDefinition': 'https://hl7.org/fhir/R4/operationdefinition.html',
            'Organization': 'https://hl7.org/fhir/R4/organization.html',
            'Patient': 'https://hl7.org/fhir/R4/patient.html',
            'Practitioner': 'https://hl7.org/fhir/R4/practitioner.html',
            'PractitionerRole': 'https://hl7.org/fhir/R4/practitionerrole.html',
            'Procedure': 'https://hl7.org/fhir/R4/procedure.html',
            'Provenance': 'https://hl7.org/fhir/R4/provenance.html',
            'RelatedPerson': 'https://hl7.org/fhir/R4/relatedperson.html',
            'Resource': 'https://hl7.org/fhir/R4/resource.html',
            'SearchParameter': 'https://hl7.org/fhir/R4/searchparameter.html',
            'ServiceRequest': 'https://hl7.org/fhir/R4/servicerequest.html',
            'Specimen': 'https://hl7.org/fhir/R4/specimen.html',
            'StructureDefinition': 'https://hl7.org/fhir/R4/structuredefinition.html',
            'StructureMap': 'https://hl7.org/fhir/R4/structuremap.html',
            'TerminologyCapabilities': 'https://hl7.org/fhir/R4/terminologycapabilities.html',
            'ValueSet': 'https://hl7.org/fhir/R4/valueset.html',
            'Claim': 'https://hl7.org/fhir/R4/claim.html',
            'ClaimResponse': 'https://hl7.org/fhir/R4/claimresponse.html',
            'EnrollmentRequest': 'https://hl7.org/fhir/R4/enrollmentrequest.html',
            'EnrollmentResponse': 'https://hl7.org/fhir/R4/enrollmentresponse.html',
            'Invoice': 'https://hl7.org/fhir/R4/invoice.html',
            'PaymentNotice': 'https://hl7.org/fhir/R4/paymentnotice.html',
            'PaymentReconciliation': 'https://hl7.org/fhir/R4/paymentreconciliation.html',
            'Appointment': 'https://hl7.org/fhir/R4/appointment.html',
            'AppointmentResponse': 'https://hl7.org/fhir/R4/appointmentresponse.html',
            'Communication': 'https://hl7.org/fhir/R4/communication.html',
            'CommunicationRequest': 'https://hl7.org/fhir/R4/communicationrequest.html',
            'Task': 'https://hl7.org/fhir/R4/task.html',
            'List': 'https://hl7.org/fhir/R4/list.html',
            'Questionnaire': 'https://hl7.org/fhir/R4/questionnaire.html',
            'QuestionnaireResponse': 'https://hl7.org/fhir/R4/questionnaireresponse.html',
            'Account': 'https://hl7.org/fhir/R4/account.html',
            'ActivityDefinition': 'https://hl7.org/fhir/R4/activitydefinition.html',
            'AdverseEvent': 'https://hl7.org/fhir/R4/adverseevent.html',
            'AuditEvent': 'https://hl7.org/fhir/R4/auditevent.html',
            'BiologicallyDerivedProduct': 'https://hl7.org/fhir/R4/biologicallyderivedproduct.html',
            'BodyStructure': 'https://hl7.org/fhir/R4/bodystructure.html',
            'CatalogEntry': 'https://hl7.org/fhir/R4/catalogentry.html',
            'ChargeItem': 'https://hl7.org/fhir/R4/chargeitem.html',
            'ChargeItemDefinition': 'https://hl7.org/fhir/R4/chargeitemdefinition.html',
            'ClinicalImpression': 'https://hl7.org/fhir/R4/clinicalimpression.html',
            'DetectedIssue': 'https://hl7.org/fhir/R4/detectedissue.html',
            'Composition': 'https://hl7.org/fhir/R4/composition.html',
            'Consent': 'https://hl7.org/fhir/R4/consent.html',
            'Contract': 'https://hl7.org/fhir/R4/contract.html',
            'CoverageEligibilityRequest': 'https://hl7.org/fhir/R4/coverageeligibilityrequest.html',
            'CoverageEligibilityResponse': 'https://hl7.org/fhir/R4/coverageeligibilityresponse.html',
            'DeviceRequest': 'https://hl7.org/fhir/R4/devicerequest.html',
            'EpisodeOfCare': 'https://hl7.org/fhir/R4/episodeofcare.html',
            'ExplanationOfBenefit': 'https://hl7.org/fhir/R4/explanationofbenefit.html',
            'FamilyMemberHistory': 'https://hl7.org/fhir/R4/familymemberhistory.html',
            'Flag': 'https://hl7.org/fhir/R4/flag.html',
            'ImagingStudy': 'https://hl7.org/fhir/R4/imagingstudy.html',
            'InsurancePlan': 'https://hl7.org/fhir/R4/insuranceplan.html',
            'Schedule': 'https://hl7.org/fhir/R4/schedule.html',
            'Slot': 'https://hl7.org/fhir/R4/slot.html',
            'DeviceUseStatement': 'https://hl7.org/fhir/R4/deviceusestatement.html',
            'Endpoint': 'https://hl7.org/fhir/R4/endpoint.html',
            'Group': 'https://hl7.org/fhir/R4/group.html',
            'HealthcareService': 'https://hl7.org/fhir/R4/healthcareservice.html',
            'Media': 'https://hl7.org/fhir/R4/media.html',
            'MolecularSequence': 'https://hl7.org/fhir/R4/molecularsequence.html',
            'RiskAssessment': 'https://hl7.org/fhir/R4/riskassessment.html',
            'VisionPrescription': 'https://hl7.org/fhir/R4/visionprescription.html',
            'GuidanceResponse': 'https://hl7.org/fhir/R4/guidanceresponse.html',
            'Library': 'https://hl7.org/fhir/R4/library.html',
            'Measure': 'https://hl7.org/fhir/R4/measure.html',
            'MeasureReport': 'https://hl7.org/fhir/R4/measurereport.html',
            'Person': 'https://hl7.org/fhir/R4/person.html',
            'RequestGroup': 'https://hl7.org/fhir/R4/requestgroup.html',
            'SupplyDelivery': 'https://hl7.org/fhir/R4/supplydelivery.html',
            'SupplyRequest': 'https://hl7.org/fhir/R4/supplyrequest.html',
            'EventDefinition': 'https://hl7.org/fhir/R4/eventdefinition.html',
            'Parameters': 'https://hl7.org/fhir/R4/parameters.html',
            'PlanDefinition': 'https://hl7.org/fhir/R4/plandefinition.html',
            'ResearchStudy': 'https://hl7.org/fhir/R4/researchstudy.html',
            'ResearchSubject': 'https://hl7.org/fhir/R4/researchsubject.html',
            'Substance': 'https://hl7.org/fhir/R4/substance.html',
            'TestReport': 'https://hl7.org/fhir/R4/testreport.html',
            'TestScript': 'https://hl7.org/fhir/R4/testscript.html'
        };
        
        // Map FHIR R4 data type names to official specification URLs
        this.dataTypeLinks = {
            'Address': 'https://hl7.org/fhir/R4/datatypes.html#Address',
            'Annotation': 'https://hl7.org/fhir/R4/datatypes.html#Annotation',
            'Attachment': 'https://hl7.org/fhir/R4/datatypes.html#Attachment',
            'CodeableConcept': 'https://hl7.org/fhir/R4/datatypes.html#CodeableConcept',
            'Coding': 'https://hl7.org/fhir/R4/datatypes.html#Coding',
            'ContactPoint': 'https://hl7.org/fhir/R4/datatypes.html#ContactPoint',
            'Element': 'https://hl7.org/fhir/R4/element.html',
            'Extension': 'https://hl7.org/fhir/R4/extensibility.html#Extension',
            'HumanName': 'https://hl7.org/fhir/R4/datatypes.html#HumanName',
            'Identifier': 'https://hl7.org/fhir/R4/datatypes.html#Identifier',
            'Meta': 'https://hl7.org/fhir/R4/resource.html#Meta',
            'Period': 'https://hl7.org/fhir/R4/datatypes.html#Period',
            'Quantity': 'https://hl7.org/fhir/R4/datatypes.html#Quantity',
            'Range': 'https://hl7.org/fhir/R4/datatypes.html#Range',
            'Ratio': 'https://hl7.org/fhir/R4/datatypes.html#Ratio',
            'Reference': 'https://hl7.org/fhir/R4/references.html#Reference'
        };
    }
    
    /**
     * Get the official FHIR R4 documentation link for a resource or data type
     * @param {string} name - The resource or data type name (e.g., "Patient", "Period")
     * @param {string} type - The type ("resource" or "datatype")
     * @returns {string|null} - The official FHIR R4 spec URL or null if not found
     */
    getResourceLink(name, type = 'resource') {
        if (type === 'datatype') {
            return this.dataTypeLinks[name] || null;
        }
        return this.resourceLinks[name] || null;
    }
    
    /**
     * Check if a resource or data type has official FHIR R4 documentation
     * @param {string} name - The resource or data type name
     * @param {string} type - The type ("resource" or "datatype")
     * @returns {boolean}
     */
    hasResourceLink(name, type = 'resource') {
        if (type === 'datatype') {
            return !!this.dataTypeLinks[name];
        }
        return !!this.resourceLinks[name];
    }
}

// US Core Profile Documentation Links
class USCoreLinks {
    constructor() {
        // Base URL for US Core STU6.1 specification
        this.baseUrl = 'https://hl7.org/fhir/us/core/STU6.1/';
        
        // Map US Core profile names to official FHIR specification URLs
        // Names match the processed format after stripping "USCore" prefix
        this.profileLinks = {
            // Main Resource Profiles (exact names after USCore prefix removal)
            'Allergyintolerance': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-allergyintolerance.html',
            'Careplan': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-careplan.html',
            'Careteam': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-careteam.html',
            'ConditionEncounterDiagnosis': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-condition-encounter-diagnosis.html',
            'ConditionProblemsHealthConcerns': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-condition-problems-health-concerns.html',
            'Coverage': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-coverage.html',
            'DiagnosticreportLab': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-diagnosticreport-lab.html',
            'DiagnosticreportNote': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-diagnosticreport-note.html',
            'Documentreference': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-documentreference.html',
            'Encounter': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-encounter.html',
            'Goal': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-goal.html',
            'Immunization': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-immunization.html',
            'ImplantableDevice': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-implantable-device.html',
            'Location': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-location.html',
            'Medication': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-medication.html',
            'Medicationrequest': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-medicationrequest.html',
            'ObservationLab': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-observation-lab.html',
            'Organization': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-organization.html',
            'Patient': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-patient.html',
            'Practitioner': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitioner.html',
            'PractitionerRole': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitionerrole.html',
            'Procedure': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-procedure.html',
            'Specimen': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-specimen.html'
        };
        
        // Special vital signs profiles
        this.vitalSignsLinks = {
            'VitalSigns': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-vital-signs.html',
            'BloodPressure': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-blood-pressure.html',
            'BMI': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-bmi.html',
            'BodyHeight': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-body-height.html',
            'BodyTemperature': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-body-temperature.html',
            'BodyWeight': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-body-weight.html',
            'HeadCircumference': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-head-circumference.html',
            'HeartRate': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-heart-rate.html',
            'PulseOximetry': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-pulse-oximetry.html',
            'RespiratoryRate': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-respiratory-rate.html'
        };
        
        // Pediatric vital signs profiles
        this.pediatricVitalSignsLinks = {
            'PediatricHeadOccipitalFrontalCircumferencePercentile': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-head-occipital-frontal-circumference-percentile.html',
            'PediatricBMIForAge': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-pediatric-bmi-for-age.html',
            'PediatricWeightForHeight': 'https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-pediatric-weight-for-height.html'
        };
    }
    
    /**
     * Get the official FHIR documentation link for a US Core profile
     * @param {string} profileName - The cleaned profile name (e.g., "Patient", "Goal")
     * @returns {string|null} - The official FHIR spec URL or null if not found
     */
    getProfileLink(profileName) {
        return this.profileLinks[profileName] || 
               this.vitalSignsLinks[profileName] || 
               this.pediatricVitalSignsLinks[profileName] || 
               null;
    }
    
    /**
     * Check if a profile has official FHIR documentation
     * @param {string} profileName - The cleaned profile name
     * @returns {boolean}
     */
    hasProfileLink(profileName) {
        return !!(this.profileLinks[profileName] || 
                  this.vitalSignsLinks[profileName] || 
                  this.pediatricVitalSignsLinks[profileName]);
    }
    
    /**
     * Get all available profile names
     * @returns {string[]}
     */
    getAllProfileNames() {
        return [...Object.keys(this.profileLinks), 
                ...Object.keys(this.vitalSignsLinks), 
                ...Object.keys(this.pediatricVitalSignsLinks)];
    }
    
    /**
     * Create a link HTML for a US Core profile
     * @param {string} profileName - The cleaned profile name
     * @param {string} displayText - Text to display (defaults to profileName)
     * @returns {string} - HTML link or plain text if no link available
     */
    createProfileLink(profileName, displayText = null) {
        const linkUrl = this.getProfileLink(profileName);
        const text = displayText || profileName;
        
        if (linkUrl) {
            return `<a href="${linkUrl}" target="_blank" class="us-core-profile-link" title="View ${profileName} US Core profile documentation">${text}</a>`;
        }
        
        return text;
    }
}

// Export for use in the main app
window.USCoreLinks = USCoreLinks;