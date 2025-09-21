#!/usr/bin/env python3
"""
Fetch Essential Clinical FHIR Resources
Downloads the most commonly used clinical resources and their US Core profiles
"""

import json
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))
from fetch_real_data import FHIRDataFetcher


def fetch_clinical_resources():
    """Fetch essential clinical resources"""
    fetcher = FHIRDataFetcher()
    
    # Essential clinical FHIR R4 resources
    clinical_resources = [
        'Patient', 'Observation', 'Practitioner', 'PractitionerRole', 'Organization',
        'Encounter', 'Condition', 'Procedure', 'MedicationRequest', 'MedicationAdministration',
        'MedicationDispense', 'MedicationStatement', 'Medication', 'AllergyIntolerance',
        'DiagnosticReport', 'Specimen', 'Immunization', 'CarePlan', 'CareTeam', 'Goal',
        'DocumentReference', 'Location', 'Device', 'ServiceRequest', 'Coverage',
        'RelatedPerson', 'Provenance'
    ]
    
    # Essential US Core profiles
    clinical_profiles = [
        'us-core-patient', 'us-core-practitioner', 'us-core-practitionerrole',
        'us-core-organization', 'us-core-observation-lab', 'us-core-vital-signs',
        'us-core-blood-pressure', 'us-core-body-height', 'us-core-body-weight',
        'us-core-body-temperature', 'us-core-heart-rate', 'us-core-respiratory-rate',
        'us-core-medicationrequest', 'us-core-procedure', 'us-core-specimen'
    ]
    
    print("🏥 Fetching Essential Clinical Resources")
    print("=" * 50)
    
    # Download FHIR resources
    print(f"📦 Downloading {len(clinical_resources)} clinical FHIR resources...")
    fetcher.download_fhir_resources(clinical_resources)
    
    # Download US Core profiles  
    print(f"📦 Downloading {len(clinical_profiles)} clinical US Core profiles...")
    fetcher.download_us_core_profiles(clinical_profiles)
    
    # Regenerate indexes with new data
    print("📊 Regenerating indexes...")
    fetcher.generate_indexes()
    
    print(f"\n🎉 Clinical Resources Download Complete!")
    print(f"✅ Total FHIR Resources: {fetcher.stats['fhir_resources_downloaded']}")
    print(f"✅ Total US Core Profiles: {fetcher.stats['us_core_profiles_downloaded']}")


if __name__ == '__main__':
    fetch_clinical_resources()