#!/usr/bin/env python3
"""
Create FHIR Data Type Definitions
Manually creates essential FHIR R4 data type definitions based on the specification
"""

import json
import hashlib
from pathlib import Path

class FHIRDataTypeCreator:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / 'data'
        self.datatypes_dir = self.data_dir / 'fhir-r4' / 'datatypes'
        
        # Ensure directories exist
        self.datatypes_dir.mkdir(parents=True, exist_ok=True)

    def create_extension_type(self):
        """Create Extension data type definition"""
        return {
            'id': 'Extension',
            'name': 'Extension',
            'title': 'Extension',
            'description': 'Optional Extension Element - found in all resources.',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Extension',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Extension',
                    'name': 'Extension',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'Optional Extension Element - found in all resources.'
                },
                {
                    'path': 'Extension.url',
                    'name': 'url',
                    'cardinality': '1..1',
                    'type': 'uri',
                    'description': 'identifies the meaning of the extension'
                },
                {
                    'path': 'Extension.value[x]',
                    'name': 'value[x]',
                    'cardinality': '0..1',
                    'type': 'base64Binary | boolean | canonical | code | date | dateTime | decimal | id | instant | integer | markdown | oid | positiveInt | string | time | unsignedInt | uri | url | uuid | Address | Age | Annotation | Attachment | CodeableConcept | Coding | ContactPoint | Count | Distance | Duration | HumanName | Identifier | Money | Period | Quantity | Range | Ratio | Reference | SampledData | Signature | Timing | ContactDetail | Contributor | DataRequirement | Expression | ParameterDefinition | RelatedArtifact | TriggerDefinition | UsageContext | Dosage | Meta',
                    'description': 'Value of extension'
                }
            ]
        }

    def create_meta_type(self):
        """Create Meta data type definition"""
        return {
            'id': 'Meta',
            'name': 'Meta',
            'title': 'Meta',
            'description': 'Metadata about a resource',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Meta',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Meta',
                    'name': 'Meta',
                    'cardinality': '0..1',
                    'type': 'Element',
                    'description': 'Metadata about a resource'
                },
                {
                    'path': 'Meta.versionId',
                    'name': 'versionId',
                    'cardinality': '0..1',
                    'type': 'id',
                    'description': 'Version specific identifier'
                },
                {
                    'path': 'Meta.lastUpdated',
                    'name': 'lastUpdated',
                    'cardinality': '0..1',
                    'type': 'instant',
                    'description': 'When the resource version last changed'
                },
                {
                    'path': 'Meta.source',
                    'name': 'source',
                    'cardinality': '0..1',
                    'type': 'uri',
                    'description': 'Identifies where the resource comes from'
                },
                {
                    'path': 'Meta.profile',
                    'name': 'profile',
                    'cardinality': '0..*',
                    'type': 'canonical',
                    'description': 'Profiles this resource claims to conform to'
                },
                {
                    'path': 'Meta.security',
                    'name': 'security',
                    'cardinality': '0..*',
                    'type': 'Coding',
                    'description': 'Security Labels applied to this resource'
                },
                {
                    'path': 'Meta.tag',
                    'name': 'tag',
                    'cardinality': '0..*',
                    'type': 'Coding',
                    'description': 'Tags applied to this resource'
                }
            ]
        }

    def create_identifier_type(self):
        """Create Identifier data type definition"""
        return {
            'id': 'Identifier',
            'name': 'Identifier',
            'title': 'Identifier',
            'description': 'An identifier intended for computation',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Identifier',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Identifier',
                    'name': 'Identifier',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'An identifier intended for computation'
                },
                {
                    'path': 'Identifier.use',
                    'name': 'use',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'usual | official | temp | secondary | old (If known)'
                },
                {
                    'path': 'Identifier.type',
                    'name': 'type',
                    'cardinality': '0..1',
                    'type': 'CodeableConcept',
                    'description': 'Description of identifier'
                },
                {
                    'path': 'Identifier.system',
                    'name': 'system',
                    'cardinality': '0..1',
                    'type': 'uri',
                    'description': 'The namespace for the identifier value'
                },
                {
                    'path': 'Identifier.value',
                    'name': 'value',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'The value that is unique'
                },
                {
                    'path': 'Identifier.period',
                    'name': 'period',
                    'cardinality': '0..1',
                    'type': 'Period',
                    'description': 'Time period when id is/was valid for use'
                },
                {
                    'path': 'Identifier.assigner',
                    'name': 'assigner',
                    'cardinality': '0..1',
                    'type': 'Reference(Organization)',
                    'description': 'Organization that issued id (may be just text)'
                }
            ]
        }

    def create_coding_type(self):
        """Create Coding data type definition"""
        return {
            'id': 'Coding',
            'name': 'Coding',
            'title': 'Coding',
            'description': 'A reference to a code defined by a terminology system',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Coding',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Coding',
                    'name': 'Coding',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'A reference to a code defined by a terminology system'
                },
                {
                    'path': 'Coding.system',
                    'name': 'system',
                    'cardinality': '0..1',
                    'type': 'uri',
                    'description': 'Identity of the terminology system'
                },
                {
                    'path': 'Coding.version',
                    'name': 'version',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Version of the system - if relevant'
                },
                {
                    'path': 'Coding.code',
                    'name': 'code',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'Symbol in syntax defined by the system'
                },
                {
                    'path': 'Coding.display',
                    'name': 'display',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Representation defined by the system'
                },
                {
                    'path': 'Coding.userSelected',
                    'name': 'userSelected',
                    'cardinality': '0..1',
                    'type': 'boolean',
                    'description': 'If this coding was chosen directly by the user'
                }
            ]
        }

    def create_codeableconcept_type(self):
        """Create CodeableConcept data type definition"""
        return {
            'id': 'CodeableConcept',
            'name': 'CodeableConcept',
            'title': 'CodeableConcept',
            'description': 'Concept - reference to a terminology or just text',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'CodeableConcept',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'CodeableConcept',
                    'name': 'CodeableConcept',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'Concept - reference to a terminology or just text'
                },
                {
                    'path': 'CodeableConcept.coding',
                    'name': 'coding',
                    'cardinality': '0..*',
                    'type': 'Coding',
                    'description': 'Code defined by a terminology system'
                },
                {
                    'path': 'CodeableConcept.text',
                    'name': 'text',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Plain text representation of the concept'
                }
            ]
        }

    def create_period_type(self):
        """Create Period data type definition"""
        return {
            'id': 'Period',
            'name': 'Period',
            'title': 'Period',
            'description': 'Time range defined by start and end date/time',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Period',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Period',
                    'name': 'Period',
                    'cardinality': '0..1',
                    'type': 'Element',
                    'description': 'Time range defined by start and end date/time'
                },
                {
                    'path': 'Period.start',
                    'name': 'start',
                    'cardinality': '0..1',
                    'type': 'dateTime',
                    'description': 'Starting time with inclusive boundary'
                },
                {
                    'path': 'Period.end',
                    'name': 'end',
                    'cardinality': '0..1',
                    'type': 'dateTime',
                    'description': 'End time with inclusive boundary, if not ongoing'
                }
            ]
        }

    def create_reference_type(self):
        """Create Reference data type definition"""
        return {
            'id': 'Reference',
            'name': 'Reference',
            'title': 'Reference',
            'description': 'A reference from one resource to another',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Reference',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Reference',
                    'name': 'Reference',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'A reference from one resource to another'
                },
                {
                    'path': 'Reference.reference',
                    'name': 'reference',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Literal reference, Relative, internal or absolute URL'
                },
                {
                    'path': 'Reference.type',
                    'name': 'type',
                    'cardinality': '0..1',
                    'type': 'uri',
                    'description': 'Type the reference refers to (e.g. "Patient")'
                },
                {
                    'path': 'Reference.identifier',
                    'name': 'identifier',
                    'cardinality': '0..1',
                    'type': 'Identifier',
                    'description': 'Logical reference, when literal reference is not known'
                },
                {
                    'path': 'Reference.display',
                    'name': 'display',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Text alternative for the resource'
                }
            ]
        }

    def save_data_type(self, type_name, data):
        """Save data type to file with metadata"""
        file_path = self.datatypes_dir / f"{type_name}.json"
        
        # Add metadata
        data['_metadata'] = {
            'downloaded': False,
            'created': True,
            'source': 'FHIR R4 Specification',
            'elementCount': len(data['elements']),
            'hash': hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"  ✅ Created {type_name} ({len(data['elements'])} elements)")

    def run(self):
        """Create all essential FHIR data types"""
        print("🔧 Creating FHIR Data Type Definitions")
        print("=" * 50)
        
        data_types = {
            'Extension': self.create_extension_type(),
            'Meta': self.create_meta_type(),
            'Identifier': self.create_identifier_type(),
            'Coding': self.create_coding_type(),
            'CodeableConcept': self.create_codeableconcept_type(),
            'Period': self.create_period_type(),
            'Reference': self.create_reference_type()
        }
        
        for type_name, type_data in data_types.items():
            self.save_data_type(type_name, type_data)
            
        print(f"\n🎉 Created {len(data_types)} essential FHIR data types")
        print(f"Data types saved to: {self.datatypes_dir}")
        return len(data_types)

if __name__ == '__main__':
    creator = FHIRDataTypeCreator()
    creator.run()