#!/usr/bin/env python3
"""
FHIR Data Types Fetcher
Downloads FHIR R4 data type definitions (Extension, Meta, Identifier, etc.)
"""

import json
import os
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import hashlib

class FHIRDataTypeFetcher:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / 'data'
        self.datatypes_dir = self.data_dir / 'fhir-r4' / 'datatypes'
        self.fhir_base_url = 'https://hl7.org/fhir/R4/'
        
        # Ensure directories exist
        self.datatypes_dir.mkdir(parents=True, exist_ok=True)
        
        # Key FHIR data types we want to fetch
        self.data_types = [
            'Extension',
            'Meta', 
            'Identifier',
            'Narrative',
            'Period',
            'Coding',
            'CodeableConcept',
            'Reference',
            'Quantity',
            'HumanName',
            'Address',
            'ContactPoint',
            'Attachment',
            'Range',
            'Ratio',
            'Annotation',
            'Timing',
            'Signature',
            'Money',
            'BackboneElement',
            'ContactDetail',
            'UsageContext',
            'Dosage',
            'ElementDefinition'
        ]
        
        self.downloaded_types = {}
        self.errors = []

    def fetch_json(self, url, timeout=30):
        """Fetch JSON data from URL with error handling"""
        try:
            print(f"  Fetching: {url}")
            request = Request(url, headers={
                'User-Agent': 'FHIR-Resource-Viewer/1.0',
                'Accept': 'application/json'
            })
            
            with urlopen(request, timeout=timeout) as response:
                if response.status == 200:
                    data = response.read().decode('utf-8')
                    return json.loads(data)
                else:
                    print(f"  ❌ HTTP {response.status}")
                    return None
                    
        except HTTPError as e:
            print(f"  ❌ HTTP Error {e.code}: {e.reason}")
            return None
        except URLError as e:
            print(f"  ❌ URL Error: {e.reason}")
            return None
        except json.JSONDecodeError as e:
            print(f"  ❌ JSON Error: {e}")
            return None
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return None

    def download_data_type(self, type_name):
        """Download a specific FHIR data type"""
        print(f"📦 Downloading {type_name}...")
        
        # Try different URL patterns
        url_patterns = [
            f"{self.fhir_base_url}{type_name.lower()}.json",
            f"{self.fhir_base_url}StructureDefinition/{type_name}.json",
            f"{self.fhir_base_url}StructureDefinition-{type_name}.json"
        ]
        
        for url in url_patterns:
            data = self.fetch_json(url)
            if data and data.get('resourceType') == 'StructureDefinition':
                # Process and save the data type
                processed_data = self.process_structure_definition(data)
                if processed_data:
                    self.save_data_type(type_name, processed_data)
                    self.downloaded_types[type_name] = processed_data
                    return True
                    
        print(f"  ❌ Failed to download {type_name}")
        self.errors.append(f"Could not find StructureDefinition for {type_name}")
        return False

    def process_structure_definition(self, structure_def):
        """Process FHIR StructureDefinition into our format"""
        try:
            # Extract key information
            processed = {
                'id': structure_def.get('id', ''),
                'name': structure_def.get('name', ''),
                'title': structure_def.get('title', ''),
                'description': structure_def.get('description', ''),
                'kind': structure_def.get('kind', ''),
                'abstract': structure_def.get('abstract', False),
                'type': structure_def.get('type', ''),
                'baseDefinition': structure_def.get('baseDefinition', ''),
                'elements': []
            }
            
            # Process elements from differential or snapshot
            if 'differential' in structure_def and 'element' in structure_def['differential']:
                elements = structure_def['differential']['element']
            elif 'snapshot' in structure_def and 'element' in structure_def['snapshot']:
                elements = structure_def['snapshot']['element']
            else:
                elements = []
            
            for element in elements:
                element_data = {
                    'path': element.get('path', ''),
                    'name': element.get('path', '').split('.')[-1] if element.get('path') else '',
                    'cardinality': f"{element.get('min', 0)}..{element.get('max', '*')}",
                    'type': self.extract_element_type(element),
                    'description': element.get('definition', element.get('short', '')),
                    'binding': self.extract_binding(element)
                }
                processed['elements'].append(element_data)
                
            return processed
            
        except Exception as e:
            print(f"  ❌ Error processing StructureDefinition: {e}")
            return None

    def extract_element_type(self, element):
        """Extract type information from element"""
        if 'type' in element and element['type']:
            types = [t.get('code', '') for t in element['type']]
            return ' | '.join(filter(None, types))
        return 'Element'

    def extract_binding(self, element):
        """Extract binding information if present"""
        if 'binding' in element:
            binding = element['binding']
            return {
                'strength': binding.get('strength', ''),
                'valueSet': binding.get('valueSet', '')
            }
        return None

    def save_data_type(self, type_name, data):
        """Save processed data type to file"""
        file_path = self.datatypes_dir / f"{type_name}.json"
        
        # Add metadata
        data['_metadata'] = {
            'downloaded': True,
            'source': f"{self.fhir_base_url}",
            'elementCount': len(data['elements']),
            'hash': hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"  ✅ Saved {type_name} ({len(data['elements'])} elements)")

    def update_master_index(self):
        """Update the master index to include data types"""
        index_file = self.data_dir / 'index' / 'master.json'
        
        if index_file.exists():
            with open(index_file, 'r', encoding='utf-8') as f:
                master_index = json.load(f)
        else:
            master_index = {'specifications': {}, 'indexes': {}, 'stats': {}}
            
        # Add data types section
        if 'fhir-r4' not in master_index['specifications']:
            master_index['specifications']['fhir-r4'] = {}
            
        master_index['specifications']['fhir-r4']['dataTypes'] = {
            'count': len(self.downloaded_types),
            'path': 'fhir-r4/datatypes/'
        }
        
        # Update stats
        if 'stats' not in master_index:
            master_index['stats'] = {}
        master_index['stats']['dataTypesDownloaded'] = len(self.downloaded_types)
        
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(master_index, f, indent=2, ensure_ascii=False)

    def run(self):
        """Download all FHIR data types"""
        print("🔍 FHIR Data Types Fetcher")
        print("=" * 50)
        
        success_count = 0
        for data_type in self.data_types:
            if self.download_data_type(data_type):
                success_count += 1
                
        print(f"\n📊 Download Summary:")
        print(f"✅ Successfully downloaded: {success_count}/{len(self.data_types)} data types")
        
        if self.errors:
            print(f"❌ Errors encountered: {len(self.errors)}")
            for error in self.errors[:5]:  # Show first 5 errors
                print(f"  - {error}")
                
        if success_count > 0:
            self.update_master_index()
            print("\n🎉 Data types download complete!")
            print(f"Data types saved to: {self.datatypes_dir}")
        else:
            print("\n❌ No data types were successfully downloaded")

if __name__ == '__main__':
    fetcher = FHIRDataTypeFetcher()
    fetcher.run()