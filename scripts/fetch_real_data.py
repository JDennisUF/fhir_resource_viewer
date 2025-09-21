#!/usr/bin/env python3
"""
Enhanced FHIR Data Fetcher
Downloads real FHIR R4 resources and US Core STU6.1 profiles
Generates optimized local JSON storage files
"""

import json
import os
import sys
import time
import hashlib
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import urljoin, urlparse
import re


class FHIRDataFetcher:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / 'data'
        
        # FHIR R4 URLs
        self.fhir_base_url = 'https://hl7.org/fhir/R4/'
        self.fhir_resource_list_url = 'https://hl7.org/fhir/R4/resourcelist.html'
        
        # US Core URLs
        self.us_core_base_url = 'https://hl7.org/fhir/us/core/STU6.1/'
        self.us_core_profiles_url = 'https://hl7.org/fhir/us/core/STU6.1/profiles.html'
        
        # Storage paths
        self.fhir_dir = self.data_dir / 'fhir-r4' / 'resources'
        self.us_core_dir = self.data_dir / 'us-core-stu6.1' / 'profiles'
        self.index_dir = self.data_dir / 'index'
        
        # Downloaded data
        self.fhir_resources = {}
        self.us_core_profiles = {}
        self.resource_index = {}
        self.element_index = {}
        
        # Statistics
        self.stats = {
            'fhir_resources_downloaded': 0,
            'us_core_profiles_downloaded': 0,
            'total_elements': 0,
            'errors': []
        }
        
        self.ensure_directories()

    def ensure_directories(self):
        """Create necessary directories"""
        for directory in [self.fhir_dir, self.us_core_dir, self.index_dir]:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"✓ Directory ready: {directory}")

    def fetch_json(self, url, timeout=30):
        """Fetch JSON data from URL with error handling"""
        try:
            print(f"📥 Fetching: {url}")
            request = Request(url)
            request.add_header('User-Agent', 'FHIR-Resource-Viewer/1.0')
            request.add_header('Accept', 'application/fhir+json, application/json')
            
            with urlopen(request, timeout=timeout) as response:
                if response.status != 200:
                    raise HTTPError(url, response.status, response.reason, None, None)
                
                data = response.read().decode('utf-8')
                return json.loads(data)
                
        except Exception as error:
            print(f"❌ Failed to fetch {url}: {error}")
            self.stats['errors'].append(f"Failed to fetch {url}: {error}")
            return None

    def fetch_html(self, url, timeout=30):
        """Fetch HTML content for parsing resource lists"""
        try:
            print(f"📄 Fetching HTML: {url}")
            request = Request(url)
            request.add_header('User-Agent', 'FHIR-Resource-Viewer/1.0')
            
            with urlopen(request, timeout=timeout) as response:
                if response.status != 200:
                    raise HTTPError(url, response.status, response.reason, None, None)
                
                return response.read().decode('utf-8')
                
        except Exception as error:
            print(f"❌ Failed to fetch HTML {url}: {error}")
            return None

    def extract_fhir_resources(self):
        """Extract FHIR R4 resource names from the resource list page"""
        print("\n🔍 Discovering FHIR R4 resources...")
        
        # Common FHIR R4 resources (comprehensive list)
        fhir_resources = [
            # Foundation
            'CapabilityStatement', 'StructureDefinition', 'ImplementationGuide', 
            'SearchParameter', 'MessageDefinition', 'OperationDefinition', 
            'CompartmentDefinition', 'StructureMap', 'GraphDefinition', 
            'ExampleScenario', 'CodeSystem', 'ValueSet', 'ConceptMap', 
            'NamingSystem', 'TerminologyCapabilities',
            
            # Base
            'Resource', 'Basic', 'Binary', 'Bundle', 'Linkage', 'MessageHeader', 
            'OperationOutcome', 'Parameters', 'Subscription',
            
            # Individuals
            'Patient', 'Practitioner', 'PractitionerRole', 'RelatedPerson', 
            'Person', 'Group',
            
            # Entities
            'Organization', 'OrganizationAffiliation', 'HealthcareService', 
            'Endpoint', 'Location', 'Substance', 'BiologicallyDerivedProduct', 
            'Device', 'DeviceMetric', 'Task', 'Appointment', 'AppointmentResponse', 
            'Schedule', 'Slot', 'VerificationResult',
            
            # Workflow
            'ServiceRequest', 'CommunicationRequest', 'DeviceRequest', 
            'NutritionOrder', 'VisionPrescription', 'RequestGroup',
            
            # Clinical
            'AllergyIntolerance', 'AdverseEvent', 'Condition', 'Procedure', 
            'Family MemberHistory', 'ClinicalImpression', 'DetectedIssue', 
            'Observation', 'Media', 'DiagnosticReport', 'Specimen', 
            'BodyStructure', 'ImagingStudy', 'QuestionnaireResponse', 
            'MolecularSequence', 'RiskAssessment', 'RequestGroup',
            
            # Medications
            'MedicationRequest', 'MedicationAdministration', 'MedicationDispense', 
            'MedicationStatement', 'Medication', 'MedicationKnowledge', 
            'Immunization', 'ImmunizationEvaluation', 'ImmunizationRecommendation',
            
            # Care Provision
            'CarePlan', 'CareTeam', 'Goal', 'NutritionOrder', 'ServiceRequest', 
            'VisionPrescription',
            
            # Request & Response
            'Communication', 'CommunicationRequest', 'DeviceRequest', 
            'DeviceUseStatement', 'GuidanceResponse', 'SupplyRequest', 
            'SupplyDelivery',
            
            # Documents
            'Composition', 'DocumentManifest', 'DocumentReference', 
            'CatalogEntry',
            
            # Other
            'Consent', 'Provenance', 'AuditEvent', 'Flag', 'Library', 
            'Measure', 'MeasureReport', 'ResearchDefinition', 'ResearchElementDefinition', 
            'ActivityDefinition', 'DeviceDefinition', 'EventDefinition', 
            'ObservationDefinition', 'PlanDefinition', 'Questionnaire', 
            'SpecimenDefinition', 'ChargeItem', 'ChargeItemDefinition', 
            'Contract', 'ExplanationOfBenefit', 'InsurancePlan', 'Coverage', 
            'CoverageEligibilityRequest', 'CoverageEligibilityResponse', 
            'EnrollmentRequest', 'EnrollmentResponse', 'Claim', 'ClaimResponse', 
            'Invoice', 'PaymentNotice', 'PaymentReconciliation', 'Account', 
            'EpisodeOfCare', 'Encounter', 'List', 'DiagnosticReport', 
            'ImagingStudy', 'MedicationKnowledge', 'SubstanceSpecification', 
            'ManufacturedItemDefinition', 'PackagedProductDefinition', 
            'AdministrableProductDefinition', 'Ingredient', 'ClinicalUseDefinition', 
            'RegulatedAuthorization', 'SubstanceDefinition', 'Evidence', 
            'EvidenceVariable', 'Citation', 'ResearchStudy', 'ResearchSubject'
        ]
        
        # Clean resource names (remove spaces, normalize)
        cleaned_resources = []
        for resource in fhir_resources:
            cleaned = resource.replace(' ', '').replace('-', '')
            cleaned_resources.append(cleaned)
        
        print(f"📋 Found {len(cleaned_resources)} FHIR R4 resources to download")
        return cleaned_resources

    def extract_us_core_profiles(self):
        """Extract US Core profile names"""
        print("\n🔍 Discovering US Core STU6.1 profiles...")
        
        # Known US Core STU6.1 profiles
        us_core_profiles = [
            'us-core-allergyintolerance',
            'us-core-careplan', 
            'us-core-careteam',
            'us-core-condition-encounter-diagnosis',
            'us-core-condition-problems-health-concerns',
            'us-core-coverage',
            'us-core-implantable-device',
            'us-core-diagnosticreport-lab',
            'us-core-diagnosticreport-note', 
            'us-core-documentreference',
            'us-core-encounter',
            'us-core-goal',
            'us-core-immunization',
            'us-core-location',
            'us-core-medication',
            'us-core-medicationdispense',
            'us-core-medicationrequest',
            'us-core-observation-pregnancystatus',
            'us-core-observation-pregnancyintent',
            'us-core-observation-occupation',
            'us-core-simple-observation',
            'us-core-observation-clinical-result',
            'us-core-observation-imaging',
            'us-core-observation-survey',
            'us-core-observation-social-history',
            'us-core-observation-sexual-orientation',
            'us-core-smokingstatus',
            'us-core-observation-screening-assessment',
            'us-core-vital-signs',
            'us-core-blood-pressure',
            'us-core-bmi',
            'us-core-head-circumference',
            'us-core-body-height',
            'us-core-body-weight',
            'us-core-heart-rate',
            'us-core-respiratory-rate',
            'us-core-body-temperature',
            'us-core-pulse-oximetry',
            'us-core-organization',
            'us-core-patient',
            'us-core-practitioner',
            'us-core-practitionerrole',
            'us-core-procedure',
            'us-core-provenance',
            'us-core-relatedperson',
            'us-core-servicerequest',
            'us-core-specimen'
        ]
        
        print(f"📋 Found {len(us_core_profiles)} US Core profiles to download")
        return us_core_profiles

    def download_fhir_resources(self, resource_names):
        """Download FHIR R4 StructureDefinitions"""
        print(f"\n📦 Downloading {len(resource_names)} FHIR R4 resources...")
        
        for i, resource_name in enumerate(resource_names, 1):
            print(f"\n[{i}/{len(resource_names)}] Processing {resource_name}...")
            
            # Construct StructureDefinition URL
            structure_def_url = f"{self.fhir_base_url}{resource_name}.profile.json"
            
            # Fetch the StructureDefinition
            structure_def = self.fetch_json(structure_def_url)
            
            if structure_def:
                # Process and save the resource
                processed_resource = self.process_fhir_structure_definition(structure_def)
                if processed_resource:
                    self.save_resource_file(resource_name, processed_resource, 'fhir-r4')
                    self.fhir_resources[resource_name] = processed_resource
                    self.stats['fhir_resources_downloaded'] += 1
                    print(f"✅ Saved {resource_name}")
                else:
                    print(f"⚠️  Failed to process {resource_name}")
            
            # Rate limiting
            time.sleep(0.1)
        
        print(f"\n🎉 Downloaded {self.stats['fhir_resources_downloaded']} FHIR resources")

    def download_us_core_profiles(self, profile_names):
        """Download US Core profiles"""
        print(f"\n📦 Downloading {len(profile_names)} US Core profiles...")
        
        for i, profile_name in enumerate(profile_names, 1):
            print(f"\n[{i}/{len(profile_names)}] Processing {profile_name}...")
            
            # Construct profile URL
            profile_url = f"{self.us_core_base_url}StructureDefinition-{profile_name}.json"
            
            # Fetch the profile
            profile_def = self.fetch_json(profile_url)
            
            if profile_def:
                # Process and save the profile
                processed_profile = self.process_us_core_profile(profile_def)
                if processed_profile:
                    # Clean name for file storage
                    clean_name = self.clean_profile_name(profile_name)
                    self.save_resource_file(clean_name, processed_profile, 'us-core-stu6.1')
                    self.us_core_profiles[clean_name] = processed_profile
                    self.stats['us_core_profiles_downloaded'] += 1
                    print(f"✅ Saved {clean_name}")
                else:
                    print(f"⚠️  Failed to process {profile_name}")
            
            # Rate limiting
            time.sleep(0.1)
        
        print(f"\n🎉 Downloaded {self.stats['us_core_profiles_downloaded']} US Core profiles")

    def process_fhir_structure_definition(self, structure_def):
        """Process FHIR StructureDefinition into our format"""
        try:
            processed = {
                'id': structure_def.get('id', ''),
                'name': structure_def.get('name', ''),
                'title': structure_def.get('title', ''),
                'description': structure_def.get('description', ''),
                'type': 'resource',
                'resourceType': structure_def.get('type', ''),
                'url': structure_def.get('url', ''),
                'version': structure_def.get('version', ''),
                'status': structure_def.get('status', ''),
                'date': structure_def.get('date', ''),
                'kind': structure_def.get('kind', ''),
                'abstract': structure_def.get('abstract', False),
                'baseDefinition': structure_def.get('baseDefinition', ''),
                'derivation': structure_def.get('derivation', ''),
                'fhirVersion': structure_def.get('fhirVersion', ''),
                'elements': []
            }
            
            # Process elements from snapshot
            snapshot = structure_def.get('snapshot', {})
            elements = snapshot.get('element', [])
            
            processed['elements'] = self.process_elements(elements)
            processed['statistics'] = self.calculate_element_stats(processed['elements'])
            
            return processed
            
        except Exception as e:
            print(f"❌ Error processing FHIR StructureDefinition: {e}")
            return None

    def process_us_core_profile(self, profile_def):
        """Process US Core profile into our format"""
        try:
            processed = {
                'id': profile_def.get('id', ''),
                'name': profile_def.get('name', ''),
                'title': profile_def.get('title', ''),
                'description': profile_def.get('description', ''),
                'type': 'profile',
                'resourceType': profile_def.get('type', ''),
                'url': profile_def.get('url', ''),
                'version': profile_def.get('version', ''),
                'status': profile_def.get('status', ''),
                'date': profile_def.get('date', ''),
                'kind': profile_def.get('kind', ''),
                'abstract': profile_def.get('abstract', False),
                'baseDefinition': profile_def.get('baseDefinition', ''),
                'derivation': profile_def.get('derivation', ''),
                'fhirVersion': profile_def.get('fhirVersion', ''),
                'elements': []
            }
            
            # Process elements from snapshot
            snapshot = profile_def.get('snapshot', {})
            elements = snapshot.get('element', [])
            
            processed['elements'] = self.process_elements(elements, is_profile=True)
            processed['statistics'] = self.calculate_element_stats(processed['elements'])
            
            # Calculate must support count
            must_support_count = sum(1 for elem in processed['elements'] if elem.get('mustSupport'))
            processed['mustSupportCount'] = must_support_count
            
            return processed
            
        except Exception as e:
            print(f"❌ Error processing US Core profile: {e}")
            return None

    def process_elements(self, elements, is_profile=False):
        """Process FHIR elements into our simplified format"""
        processed_elements = []
        
        for element in elements:
            path = element.get('path', '')
            
            # Skip root elements and focus on meaningful paths
            if not path or '.' not in path:
                continue
                
            # Extract element info
            element_info = {
                'id': element.get('id', ''),
                'path': path,
                'name': path.split('.')[-1],
                'short': element.get('short', ''),
                'description': element.get('definition', element.get('short', '')),
                'min': element.get('min', 0),
                'max': element.get('max', '1'),
                'cardinality': f"{element.get('min', 0)}..{element.get('max', '1')}",
                'type': self.extract_element_types(element.get('type', [])),
                'isModifier': element.get('isModifier', False),
                'isSummary': element.get('isSummary', False),
                'binding': self.extract_binding_info(element.get('binding')),
                'constraints': self.extract_constraints(element.get('constraint', [])),
                'mapping': element.get('mapping', [])
            }
            
            # Add must support for profiles
            if is_profile:
                element_info['mustSupport'] = element.get('mustSupport', False)
            
            processed_elements.append(element_info)
            
        return processed_elements

    def extract_element_types(self, type_list):
        """Extract and format element types"""
        if not type_list:
            return 'unknown'
        
        types = []
        for type_def in type_list:
            type_code = type_def.get('code', 'unknown')
            profile = type_def.get('profile')
            if profile:
                # Simplify profile references
                if isinstance(profile, list):
                    profile_names = [p.split('/')[-1] for p in profile]
                    type_code += f"({', '.join(profile_names)})"
                else:
                    profile_name = profile.split('/')[-1]
                    type_code += f"({profile_name})"
            types.append(type_code)
        
        return ' | '.join(types)

    def extract_binding_info(self, binding):
        """Extract value set binding information"""
        if not binding:
            return None
        
        return {
            'strength': binding.get('strength'),
            'description': binding.get('description'),
            'valueSet': binding.get('valueSet')
        }

    def extract_constraints(self, constraints):
        """Extract element constraints"""
        processed_constraints = []
        for constraint in constraints:
            processed_constraints.append({
                'key': constraint.get('key'),
                'severity': constraint.get('severity'),
                'human': constraint.get('human'),
                'expression': constraint.get('expression'),
                'xpath': constraint.get('xpath')
            })
        return processed_constraints

    def calculate_element_stats(self, elements):
        """Calculate statistics for elements"""
        return {
            'elementCount': len(elements),
            'requiredElements': sum(1 for e in elements if e.get('min', 0) > 0),
            'optionalElements': sum(1 for e in elements if e.get('min', 0) == 0),
            'summaryElements': sum(1 for e in elements if e.get('isSummary')),
            'modifierElements': sum(1 for e in elements if e.get('isModifier'))
        }

    def clean_profile_name(self, profile_name):
        """Clean profile name for file naming"""
        # Convert us-core-patient to USCorePatient
        parts = profile_name.split('-')
        if parts[0] == 'us' and parts[1] == 'core':
            # Remove 'us-core-' prefix and capitalize each part
            name_parts = parts[2:]
            cleaned = 'USCore' + ''.join(word.capitalize() for word in name_parts)
            return cleaned
        return profile_name

    def save_resource_file(self, name, data, spec_type):
        """Save processed resource to file"""
        if spec_type == 'fhir-r4':
            file_path = self.fhir_dir / f"{name}.json"
        else:
            file_path = self.us_core_dir / f"{name}.json"
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def generate_indexes(self):
        """Generate optimized index files"""
        print("\n📊 Generating index files...")
        
        # Generate resource index
        self.generate_resource_index()
        
        # Generate element index
        self.generate_element_index()
        
        # Generate master index
        self.generate_master_index()
        
        print("✅ Index files generated")

    def generate_resource_index(self):
        """Generate resource index file"""
        resource_index = {
            'byName': {},
            'bySpec': {
                'fhir-r4': [],
                'us-core-stu6.1': []
            },
            'byType': {
                'resource': [],
                'profile': []
            },
            'statistics': {}
        }
        
        # Process FHIR resources
        for name, data in self.fhir_resources.items():
            file_path = f"fhir-r4/resources/{name}.json"
            resource_index['byName'][name] = {
                'spec': 'fhir-r4',
                'type': 'resource',
                'file': file_path,
                'hash': self.calculate_file_hash(self.fhir_dir / f"{name}.json"),
                'elementCount': len(data.get('elements', [])),
                'lastModified': data.get('date', '')
            }
            resource_index['bySpec']['fhir-r4'].append(name)
            resource_index['byType']['resource'].append(name)
        
        # Process US Core profiles
        for name, data in self.us_core_profiles.items():
            file_path = f"us-core-stu6.1/profiles/{name}.json"
            resource_index['byName'][name] = {
                'spec': 'us-core-stu6.1',
                'type': 'profile',
                'baseDefinition': data.get('baseDefinition', '').split('/')[-1],
                'file': file_path,
                'hash': self.calculate_file_hash(self.us_core_dir / f"{name}.json"),
                'elementCount': len(data.get('elements', [])),
                'mustSupportCount': data.get('mustSupportCount', 0),
                'lastModified': data.get('date', '')
            }
            resource_index['bySpec']['us-core-stu6.1'].append(name)
            resource_index['byType']['profile'].append(name)
        
        # Calculate statistics
        resource_index['statistics'] = {
            'totalResources': len(self.fhir_resources) + len(self.us_core_profiles),
            'fhirResources': len(self.fhir_resources),
            'usCoreProfiles': len(self.us_core_profiles),
            'totalElements': sum(len(data.get('elements', [])) for data in {**self.fhir_resources, **self.us_core_profiles}.values())
        }
        
        # Save index
        index_file = self.index_dir / 'resources.json'
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(resource_index, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Resource index saved: {index_file}")

    def generate_element_index(self):
        """Generate element search index"""
        element_index = {
            'byName': {},
            'byPath': {},
            'searchTerms': {},
            'mustSupportElements': {},
            'dataTypeUsage': {},
            'constraints': {}
        }
        
        # Process all resources and profiles
        all_data = {**self.fhir_resources, **self.us_core_profiles}
        
        for resource_name, resource_data in all_data.items():
            elements = resource_data.get('elements', [])
            
            for element in elements:
                element_name = element.get('name', '')
                element_path = element.get('path', '')
                element_type = element.get('type', 'unknown')
                
                # Index by name
                if element_name and element_name not in element_index['byName']:
                    element_index['byName'][element_name] = {
                        'resources': [],
                        'frequency': 0,
                        'types': set(),
                        'commonPaths': []
                    }
                
                if element_name:
                    element_index['byName'][element_name]['resources'].append(resource_name)
                    element_index['byName'][element_name]['frequency'] += 1
                    element_index['byName'][element_name]['types'].add(element_type)
                    element_index['byName'][element_name]['commonPaths'].append(element_path)
                
                # Index by path
                if element_path:
                    element_index['byPath'][element_path] = {
                        'cardinality': element.get('cardinality', '0..1'),
                        'type': element_type,
                        'mustSupport': element.get('mustSupport', False),
                        'binding': element.get('binding'),
                        'isModifier': element.get('isModifier', False),
                        'isSummary': element.get('isSummary', False)
                    }
                
                # Must support tracking
                if element.get('mustSupport') and resource_data.get('type') == 'profile':
                    if resource_name not in element_index['mustSupportElements']:
                        element_index['mustSupportElements'][resource_name] = []
                    element_index['mustSupportElements'][resource_name].append(element_name)
                
                # Data type usage
                if element_type != 'unknown':
                    if element_type not in element_index['dataTypeUsage']:
                        element_index['dataTypeUsage'][element_type] = {
                            'frequency': 0,
                            'elements': []
                        }
                    element_index['dataTypeUsage'][element_type]['frequency'] += 1
                    element_index['dataTypeUsage'][element_type]['elements'].append(element_path)
                
                # Constraints
                for constraint in element.get('constraints', []):
                    key = constraint.get('key')
                    if key:
                        element_index['constraints'][key] = constraint
        
        # Convert sets to lists for JSON serialization
        for element_data in element_index['byName'].values():
            element_data['types'] = list(element_data['types'])
        
        # Generate search terms
        element_index['searchTerms'] = self.generate_search_terms(all_data)
        
        # Save index
        index_file = self.index_dir / 'elements.json'
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(element_index, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Element index saved: {index_file}")

    def generate_search_terms(self, all_data):
        """Generate search term mappings"""
        search_terms = {}
        
        # Common medical terms mapped to resources
        term_mappings = {
            'patient': ['Patient'],
            'demographics': ['Patient'],
            'observation': ['Observation'],
            'vital': ['Observation'],
            'lab': ['Observation'],
            'practitioner': ['Practitioner'],
            'provider': ['Practitioner'],
            'doctor': ['Practitioner'],
            'organization': ['Organization'],
            'facility': ['Organization'],
            'medication': ['Medication', 'MedicationRequest'],
            'allergy': ['AllergyIntolerance'],
            'condition': ['Condition'],
            'diagnosis': ['Condition'],
            'procedure': ['Procedure'],
            'encounter': ['Encounter'],
            'visit': ['Encounter']
        }
        
        # Add profile variations
        for term, resources in term_mappings.items():
            search_terms[term] = resources.copy()
            for resource in resources:
                # Add US Core variants
                us_core_name = f"USCore{resource}"
                if us_core_name in all_data:
                    search_terms[term].append(us_core_name)
        
        return search_terms

    def generate_master_index(self):
        """Generate master index file"""
        master_index = {
            'version': '1.0.0',
            'lastUpdated': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            'specifications': {
                'fhir-r4': {
                    'version': '4.0.1',
                    'title': 'FHIR R4 Base Specification',
                    'resourceCount': len(self.fhir_resources),
                    'path': 'fhir-r4/metadata.json',
                    'baseUrl': self.fhir_base_url
                },
                'us-core-stu6.1': {
                    'version': '6.1.0',
                    'title': 'US Core Implementation Guide STU6.1',
                    'profileCount': len(self.us_core_profiles),
                    'path': 'us-core-stu6.1/metadata.json',
                    'baseUrl': self.us_core_base_url
                }
            },
            'indexes': {
                'resources': 'index/resources.json',
                'elements': 'index/elements.json'
            },
            'stats': {
                'totalResources': len(self.fhir_resources) + len(self.us_core_profiles),
                'totalElements': sum(len(data.get('elements', [])) for data in {**self.fhir_resources, **self.us_core_profiles}.values()),
                'fhirResourcesDownloaded': self.stats['fhir_resources_downloaded'],
                'usCoreProfilesDownloaded': self.stats['us_core_profiles_downloaded'],
                'errors': len(self.stats['errors'])
            },
            'performance': {
                'targets': {
                    'initialLoad': '100ms',
                    'resourceSearch': '50ms',
                    'elementLookup': '25ms'
                }
            }
        }
        
        # Save master index
        index_file = self.index_dir / 'master.json'
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(master_index, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Master index saved: {index_file}")

    def calculate_file_hash(self, file_path):
        """Calculate SHA256 hash of file"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
                return f"sha256:{hashlib.sha256(content).hexdigest()[:16]}"
        except:
            return "sha256:unknown"

    def run(self):
        """Run the complete data fetching process"""
        print("🚀 FHIR Real Data Fetcher")
        print("=" * 50)
        
        try:
            # Extract resource lists
            fhir_resources = self.extract_fhir_resources()
            us_core_profiles = self.extract_us_core_profiles()
            
            # Download FHIR resources (limit for testing)
            print(f"\n📥 Starting downloads...")
            self.download_fhir_resources(fhir_resources[:20])  # First 20 for testing
            self.download_us_core_profiles(us_core_profiles[:15])  # First 15 for testing
            
            # Generate indexes
            self.generate_indexes()
            
            # Final report
            print(f"\n🎉 Download Complete!")
            print(f"✅ FHIR Resources: {self.stats['fhir_resources_downloaded']}")
            print(f"✅ US Core Profiles: {self.stats['us_core_profiles_downloaded']}")
            print(f"⚠️  Errors: {len(self.stats['errors'])}")
            
            if self.stats['errors']:
                print("\n❌ Errors encountered:")
                for error in self.stats['errors'][:5]:  # Show first 5 errors
                    print(f"   • {error}")
            
        except Exception as error:
            print(f"\n💥 Fatal error: {error}")
            sys.exit(1)


def main():
    """Main entry point"""
    fetcher = FHIRDataFetcher()
    fetcher.run()


if __name__ == '__main__':
    main()