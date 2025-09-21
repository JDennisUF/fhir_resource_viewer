#!/usr/bin/env python3
"""
Update Index with Data Types
Adds the created FHIR data types to the resource index
"""

import json
from pathlib import Path

def update_indexes():
    """Update the resource and master indexes to include data types"""
    base_dir = Path(__file__).parent.parent
    data_dir = base_dir / 'data'
    datatypes_dir = data_dir / 'fhir-r4' / 'datatypes'
    index_dir = data_dir / 'index'
    
    # Load existing resource index
    resources_index_path = index_dir / 'resources.json'
    with open(resources_index_path, 'r', encoding='utf-8') as f:
        resources_index = json.load(f)
    
    # Load existing master index
    master_index_path = index_dir / 'master.json'
    with open(master_index_path, 'r', encoding='utf-8') as f:
        master_index = json.load(f)
    
    # Process data type files
    data_types_added = 0
    for datatype_file in datatypes_dir.glob('*.json'):
        with open(datatype_file, 'r', encoding='utf-8') as f:
            datatype_data = json.load(f)
        
        datatype_name = datatype_file.stem
        
        # Add to resources index
        resources_index['byName'][datatype_name] = {
            'spec': 'fhir-r4',
            'type': 'datatype',
            'file': f'fhir-r4/datatypes/{datatype_name}.json',
            'hash': f"sha256:{datatype_data['_metadata']['hash']}",
            'elementCount': datatype_data['_metadata']['elementCount'],
            'kind': datatype_data.get('kind', 'complex-type'),
            'lastModified': 'manual'
        }
        data_types_added += 1
        print(f"✅ Added {datatype_name} to index")
    
    # Update bySpec list
    if 'fhir-r4' not in resources_index['bySpec']:
        resources_index['bySpec']['fhir-r4'] = []
        
    # Add data types to FHIR R4 spec list
    for datatype_file in datatypes_dir.glob('*.json'):
        datatype_name = datatype_file.stem
        if datatype_name not in resources_index['bySpec']['fhir-r4']:
            resources_index['bySpec']['fhir-r4'].append(datatype_name)
    
    # Sort the list
    resources_index['bySpec']['fhir-r4'].sort()
    
    # Update byType to include datatype category
    if 'datatype' not in resources_index['byType']:
        resources_index['byType']['datatype'] = []
        
    for datatype_file in datatypes_dir.glob('*.json'):
        datatype_name = datatype_file.stem
        if datatype_name not in resources_index['byType']['datatype']:
            resources_index['byType']['datatype'].append(datatype_name)
    
    resources_index['byType']['datatype'].sort()
    
    # Update statistics
    resources_index['statistics']['totalResources'] += data_types_added
    resources_index['statistics']['dataTypes'] = data_types_added
    
    # Update master index
    master_index['stats']['totalResources'] += data_types_added
    master_index['stats']['dataTypesCreated'] = data_types_added
    
    # Save updated indexes
    with open(resources_index_path, 'w', encoding='utf-8') as f:
        json.dump(resources_index, f, indent=2, ensure_ascii=False)
    
    with open(master_index_path, 'w', encoding='utf-8') as f:
        json.dump(master_index, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 Successfully added {data_types_added} data types to indexes")
    print(f"✅ Resource index updated: {resources_index_path}")
    print(f"✅ Master index updated: {master_index_path}")

if __name__ == '__main__':
    update_indexes()