#!/usr/bin/env python3
"""
FHIR Specification Download Script (Python)
Downloads and processes FHIR R4 and US Core specifications
"""

import json
import os
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError


class FHIRSpecDownloader:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / 'data'
        self.fhir_dir = self.data_dir / 'fhir-r4'
        self.us_core_dir = self.data_dir / 'us-core'
        
        self.fhir_base_url = 'https://hl7.org/fhir/R4/'
        self.us_core_base_url = 'https://hl7.org/fhir/us/core/'
        
        self.ensure_directories()

    def ensure_directories(self):
        """Create necessary directories if they don't exist."""
        for directory in [self.data_dir, self.fhir_dir, self.us_core_dir]:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"Created directory: {directory}")

    def download_json(self, url, timeout=30):
        """Download JSON data from a URL."""
        print(f"Downloading: {url}")
        
        try:
            # Create request with headers
            request = Request(url)
            request.add_header('User-Agent', 'FHIR-Resource-Viewer/1.0')
            request.add_header('Accept', 'application/json')
            
            with urlopen(request, timeout=timeout) as response:
                if response.status != 200:
                    raise HTTPError(url, response.status, response.reason, None, None)
                
                data = response.read().decode('utf-8')
                return json.loads(data)
                
        except (URLError, HTTPError, json.JSONDecodeError) as error:
            raise Exception(f"Download failed: {error}")

    def download_fhir_resources(self):
        """Download FHIR R4 core resources."""
        print('\n=== Downloading FHIR R4 Resources ===')
        
        # Core FHIR resources to download
        core_resources = [
            'Patient', 'Observation', 'Practitioner', 'Organization',
            'Encounter', 'Procedure', 'Medication', 'MedicationRequest',
            'Condition', 'AllergyIntolerance', 'DiagnosticReport',
            'DocumentReference', 'Immunization', 'Location'
        ]
        
        fhir_data = {}
        
        for resource_name in core_resources:
            try:
                # Download structure definition
                url = f"{self.fhir_base_url}{resource_name.lower()}.profile.json"
                structure_definition = self.download_json(url)
                
                # Process and simplify the structure definition
                processed_resource = self.process_structure_definition(structure_definition)
                fhir_data[resource_name] = processed_resource
                
                print(f"✓ Downloaded {resource_name}")
                
                # Add delay to be respectful to the server
                time.sleep(0.1)
                
            except Exception as error:
                print(f"⚠ Failed to download {resource_name}: {error}")
                
                # Fallback to sample data
                fhir_data[resource_name] = self.create_fallback_resource(resource_name)
        
        # Save processed FHIR data
        output_file = self.fhir_dir / 'resources.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(fhir_data, f, indent=2, ensure_ascii=False)
        print(f"Saved FHIR resources to: {output_file}")
        
        return fhir_data

    def download_us_core_profiles(self):
        """Download US Core profiles."""
        print('\n=== Downloading US Core Profiles ===')
        
        # US Core profiles to download
        us_core_profiles = [
            'us-core-patient', 'us-core-observation-lab', 'us-core-practitioner',
            'us-core-organization', 'us-core-encounter', 'us-core-procedure',
            'us-core-medication', 'us-core-medicationrequest', 'us-core-condition',
            'us-core-allergyintolerance', 'us-core-diagnosticreport-lab',
            'us-core-documentreference', 'us-core-immunization', 'us-core-location'
        ]
        
        us_core_data = {}
        
        for profile_name in us_core_profiles:
            try:
                # Download structure definition
                url = f"{self.us_core_base_url}StructureDefinition-{profile_name}.json"
                structure_definition = self.download_json(url)
                
                # Process and simplify the structure definition
                processed_profile = self.process_us_core_profile(structure_definition)
                
                # Use a clean name for the key
                clean_name = self.get_clean_profile_name(profile_name)
                us_core_data[clean_name] = processed_profile
                
                print(f"✓ Downloaded {clean_name}")
                
                # Add delay to be respectful to the server
                time.sleep(0.1)
                
            except Exception as error:
                print(f"⚠ Failed to download {profile_name}: {error}")
                
                # Fallback to sample data
                clean_name = self.get_clean_profile_name(profile_name)
                us_core_data[clean_name] = self.create_fallback_us_core_profile(profile_name)
        
        # Save processed US Core data
        output_file = self.us_core_dir / 'profiles.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(us_core_data, f, indent=2, ensure_ascii=False)
        print(f"Saved US Core profiles to: {output_file}")
        
        return us_core_data

    def process_structure_definition(self, structure_definition):
        """Process a FHIR structure definition."""
        processed = {
            'name': structure_definition.get('name', structure_definition.get('id', '')),
            'description': structure_definition.get('description', ''),
            'type': 'resource',
            'url': structure_definition.get('url', ''),
            'version': structure_definition.get('version', ''),
            'status': structure_definition.get('status', ''),
            'kind': structure_definition.get('kind', ''),
            'abstract': structure_definition.get('abstract', False),
            'elements': []
        }
        
        # Process snapshot elements
        snapshot = structure_definition.get('snapshot', {})
        elements = snapshot.get('element', [])
        
        for element in elements:
            if element.get('path') and '.' in element['path']:
                processed_element = self.process_element(element)
                if processed_element:
                    processed['elements'].append(processed_element)
        
        return processed

    def process_us_core_profile(self, structure_definition):
        """Process a US Core profile definition."""
        processed = self.process_structure_definition(structure_definition)
        processed['type'] = 'profile'
        
        base_definition = structure_definition.get('baseDefinition', '')
        processed['baseResource'] = base_definition.split('/')[-1] if base_definition else 'Unknown'
        
        # Mark must-support elements
        snapshot = structure_definition.get('snapshot', {})
        elements = snapshot.get('element', [])
        
        processed['elements'] = []
        for element in elements:
            if element.get('path') and '.' in element['path']:
                processed_element = self.process_element(element)
                if processed_element:
                    if element.get('mustSupport'):
                        processed_element['mustSupport'] = True
                    processed['elements'].append(processed_element)
        
        return processed

    def process_element(self, element):
        """Process a FHIR element definition."""
        path = element.get('path', '')
        if not path or '.' not in path:
            return None
        
        path_parts = path.split('.')
        element_name = path_parts[-1]
        
        return {
            'name': element_name,
            'type': self.get_element_type(element),
            'cardinality': f"{element.get('min', 0)}..{element.get('max', '*')}",
            'description': element.get('short', element.get('definition', '')),
            'path': path,
            'binding': self.get_element_binding(element)
        }

    def get_element_type(self, element):
        """Extract element type from FHIR element definition."""
        types = element.get('type', [])
        if types:
            return ' | '.join(t.get('code', 'unknown') for t in types)
        return 'unknown'

    def get_element_binding(self, element):
        """Extract binding information from FHIR element definition."""
        binding = element.get('binding')
        if binding:
            return {
                'strength': binding.get('strength'),
                'valueSet': binding.get('valueSet')
            }
        return None

    def get_clean_profile_name(self, profile_name):
        """Convert profile name to clean display name."""
        return ''.join(
            part.capitalize() 
            for part in profile_name.replace('us-core-', '').split('-')
        )

    def create_fallback_resource(self, resource_name):
        """Create fallback resource definition."""
        return {
            'name': resource_name,
            'description': f'{resource_name} resource definition (fallback)',
            'type': 'resource',
            'url': f'http://hl7.org/fhir/StructureDefinition/{resource_name}',
            'version': '4.0.1',
            'status': 'active',
            'kind': 'resource',
            'abstract': False,
            'elements': [
                {
                    'name': 'id',
                    'type': 'id',
                    'cardinality': '0..1',
                    'description': 'Logical id of this artifact',
                    'path': f'{resource_name}.id'
                }
            ]
        }

    def create_fallback_us_core_profile(self, profile_name):
        """Create fallback US Core profile definition."""
        clean_name = self.get_clean_profile_name(profile_name)
        base_resource = clean_name.replace('USCore', '') if clean_name.startswith('USCore') else clean_name
        
        return {
            'name': f'{clean_name} Profile',
            'description': f'US Core {clean_name} profile (fallback)',
            'type': 'profile',
            'baseResource': base_resource,
            'url': f'http://hl7.org/fhir/us/core/StructureDefinition/{profile_name}',
            'version': '3.1.1',
            'status': 'active',
            'mustSupport': True,
            'elements': []
        }

    def create_index_file(self, fhir_data, us_core_data):
        """Create index file with metadata."""
        index = {
            'lastUpdated': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            'fhirVersion': '4.0.1',
            'usCoreVersion': '3.1.1',
            'stats': {
                'fhirResources': len(fhir_data),
                'usCoreProfiles': len(us_core_data)
            },
            'resources': {
                'fhir-r4': list(fhir_data.keys()),
                'us-core': list(us_core_data.keys())
            }
        }
        
        index_file = self.data_dir / 'index.json'
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        print(f"\nCreated index file: {index_file}")
        
        return index

    def run(self):
        """Run the complete download process."""
        try:
            print('FHIR Specification Downloader')
            print('=============================')
            
            fhir_data = self.download_fhir_resources()
            us_core_data = self.download_us_core_profiles()
            index = self.create_index_file(fhir_data, us_core_data)
            
            print('\n=== Download Complete ===')
            print(f"FHIR R4 Resources: {index['stats']['fhirResources']}")
            print(f"US Core Profiles: {index['stats']['usCoreProfiles']}")
            print(f"Data directory: {self.data_dir}")
            
        except Exception as error:
            print(f'\n❌ Download failed: {error}')
            sys.exit(1)


def main():
    """Main entry point."""
    if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h']:
        print(__doc__)
        print("\nUsage: python download_specs.py")
        print("\nThis script downloads FHIR R4 and US Core specifications")
        print("and saves them as JSON files in the data directory.")
        return
    
    downloader = FHIRSpecDownloader()
    downloader.run()


if __name__ == '__main__':
    main()