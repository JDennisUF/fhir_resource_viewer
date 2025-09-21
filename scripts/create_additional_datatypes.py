#!/usr/bin/env python3
"""
Create Additional FHIR Data Type Definitions
Creates the remaining essential FHIR R4 data type definitions
"""

import json
import hashlib
from pathlib import Path

class AdditionalFHIRDataTypeCreator:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / 'data'
        self.datatypes_dir = self.data_dir / 'fhir-r4' / 'datatypes'
        
        # Ensure directories exist
        self.datatypes_dir.mkdir(parents=True, exist_ok=True)

    def create_humanname_type(self):
        """Create HumanName data type definition"""
        return {
            'id': 'HumanName',
            'name': 'HumanName',
            'title': 'HumanName',
            'description': 'A human name with the ability to identify parts and usage.',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'HumanName',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'HumanName',
                    'name': 'HumanName',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'A human name with the ability to identify parts and usage.'
                },
                {
                    'path': 'HumanName.use',
                    'name': 'use',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'usual | official | temp | nickname | anonymous | old | maiden'
                },
                {
                    'path': 'HumanName.text',
                    'name': 'text',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Text representation of the full name'
                },
                {
                    'path': 'HumanName.family',
                    'name': 'family',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Family name (often called surname)'
                },
                {
                    'path': 'HumanName.given',
                    'name': 'given',
                    'cardinality': '0..*',
                    'type': 'string',
                    'description': 'Given names (not always first). Includes middle names'
                },
                {
                    'path': 'HumanName.prefix',
                    'name': 'prefix',
                    'cardinality': '0..*',
                    'type': 'string',
                    'description': 'Parts that come before the name'
                },
                {
                    'path': 'HumanName.suffix',
                    'name': 'suffix',
                    'cardinality': '0..*',
                    'type': 'string',
                    'description': 'Parts that come after the name'
                },
                {
                    'path': 'HumanName.period',
                    'name': 'period',
                    'cardinality': '0..1',
                    'type': 'Period',
                    'description': 'Time period when name was/is in use'
                }
            ]
        }

    def create_address_type(self):
        """Create Address data type definition"""
        return {
            'id': 'Address',
            'name': 'Address',
            'title': 'Address',
            'description': 'An address expressed using postal conventions (as opposed to GPS or other location definition formats).',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Address',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Address',
                    'name': 'Address',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'An address expressed using postal conventions.'
                },
                {
                    'path': 'Address.use',
                    'name': 'use',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'home | work | temp | old | billing - purpose of this address'
                },
                {
                    'path': 'Address.type',
                    'name': 'type',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'postal | physical | both'
                },
                {
                    'path': 'Address.text',
                    'name': 'text',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Text representation of the address'
                },
                {
                    'path': 'Address.line',
                    'name': 'line',
                    'cardinality': '0..*',
                    'type': 'string',
                    'description': 'Street name, number, direction & P.O. Box etc.'
                },
                {
                    'path': 'Address.city',
                    'name': 'city',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Name of city, town etc.'
                },
                {
                    'path': 'Address.district',
                    'name': 'district',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'District name (aka county)'
                },
                {
                    'path': 'Address.state',
                    'name': 'state',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Sub-unit of country (abbreviations ok)'
                },
                {
                    'path': 'Address.postalCode',
                    'name': 'postalCode',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Postal code for area'
                },
                {
                    'path': 'Address.country',
                    'name': 'country',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Country (e.g. can be ISO 3166 2 or 3 letter code)'
                },
                {
                    'path': 'Address.period',
                    'name': 'period',
                    'cardinality': '0..1',
                    'type': 'Period',
                    'description': 'Time period when address was/is in use'
                }
            ]
        }

    def create_contactpoint_type(self):
        """Create ContactPoint data type definition"""
        return {
            'id': 'ContactPoint',
            'name': 'ContactPoint',
            'title': 'ContactPoint',
            'description': 'Details for all kinds of technology mediated contact points for a person or organization.',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'ContactPoint',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'ContactPoint',
                    'name': 'ContactPoint',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'Details for all kinds of technology mediated contact points.'
                },
                {
                    'path': 'ContactPoint.system',
                    'name': 'system',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'phone | fax | email | pager | url | sms | other'
                },
                {
                    'path': 'ContactPoint.value',
                    'name': 'value',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'The actual contact point details'
                },
                {
                    'path': 'ContactPoint.use',
                    'name': 'use',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'home | work | temp | old | mobile - purpose of this contact point'
                },
                {
                    'path': 'ContactPoint.rank',
                    'name': 'rank',
                    'cardinality': '0..1',
                    'type': 'positiveInt',
                    'description': 'Specify preferred order of use (1 = highest)'
                },
                {
                    'path': 'ContactPoint.period',
                    'name': 'period',
                    'cardinality': '0..1',
                    'type': 'Period',
                    'description': 'Time period when the contact point was/is in use'
                }
            ]
        }

    def create_quantity_type(self):
        """Create Quantity data type definition"""
        return {
            'id': 'Quantity',
            'name': 'Quantity',
            'title': 'Quantity',
            'description': 'A measured amount (or an amount that can potentially be measured).',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Quantity',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Quantity',
                    'name': 'Quantity',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'A measured amount (or an amount that can potentially be measured).'
                },
                {
                    'path': 'Quantity.value',
                    'name': 'value',
                    'cardinality': '0..1',
                    'type': 'decimal',
                    'description': 'Numerical value (with implicit precision)'
                },
                {
                    'path': 'Quantity.comparator',
                    'name': 'comparator',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': '< | <= | >= | > - how to understand the value'
                },
                {
                    'path': 'Quantity.unit',
                    'name': 'unit',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Unit representation'
                },
                {
                    'path': 'Quantity.system',
                    'name': 'system',
                    'cardinality': '0..1',
                    'type': 'uri',
                    'description': 'System that defines coded unit form'
                },
                {
                    'path': 'Quantity.code',
                    'name': 'code',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'Coded form of the unit'
                }
            ]
        }

    def create_range_type(self):
        """Create Range data type definition"""
        return {
            'id': 'Range',
            'name': 'Range',
            'title': 'Range',
            'description': 'A set of ordered Quantities defined by a low and high limit.',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Range',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Range',
                    'name': 'Range',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'A set of ordered Quantities defined by a low and high limit.'
                },
                {
                    'path': 'Range.low',
                    'name': 'low',
                    'cardinality': '0..1',
                    'type': 'Quantity',
                    'description': 'Low limit'
                },
                {
                    'path': 'Range.high',
                    'name': 'high',
                    'cardinality': '0..1',
                    'type': 'Quantity',
                    'description': 'High limit'
                }
            ]
        }

    def create_ratio_type(self):
        """Create Ratio data type definition"""
        return {
            'id': 'Ratio',
            'name': 'Ratio',
            'title': 'Ratio',
            'description': 'A relationship of two Quantity values - expressed as a numerator and a denominator.',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Ratio',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Ratio',
                    'name': 'Ratio',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'A relationship of two Quantity values - expressed as a numerator and a denominator.'
                },
                {
                    'path': 'Ratio.numerator',
                    'name': 'numerator',
                    'cardinality': '0..1',
                    'type': 'Quantity',
                    'description': 'Numerator value'
                },
                {
                    'path': 'Ratio.denominator',
                    'name': 'denominator',
                    'cardinality': '0..1',
                    'type': 'Quantity',
                    'description': 'Denominator value'
                }
            ]
        }

    def create_attachment_type(self):
        """Create Attachment data type definition"""
        return {
            'id': 'Attachment',
            'name': 'Attachment',
            'title': 'Attachment',
            'description': 'For referring to data content defined in other formats.',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Attachment',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Attachment',
                    'name': 'Attachment',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'Content in a format defined elsewhere'
                },
                {
                    'path': 'Attachment.contentType',
                    'name': 'contentType',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'Mime type of the content, with charset etc.'
                },
                {
                    'path': 'Attachment.language',
                    'name': 'language',
                    'cardinality': '0..1',
                    'type': 'code',
                    'description': 'Human language of the content (BCP-47)'
                },
                {
                    'path': 'Attachment.data',
                    'name': 'data',
                    'cardinality': '0..1',
                    'type': 'base64Binary',
                    'description': 'Data inline, base64ed'
                },
                {
                    'path': 'Attachment.url',
                    'name': 'url',
                    'cardinality': '0..1',
                    'type': 'url',
                    'description': 'Uri where the data can be found'
                },
                {
                    'path': 'Attachment.size',
                    'name': 'size',
                    'cardinality': '0..1',
                    'type': 'unsignedInt',
                    'description': 'Number of bytes of content (if url provided)'
                },
                {
                    'path': 'Attachment.hash',
                    'name': 'hash',
                    'cardinality': '0..1',
                    'type': 'base64Binary',
                    'description': 'Hash of the data (sha-1, base64ed)'
                },
                {
                    'path': 'Attachment.title',
                    'name': 'title',
                    'cardinality': '0..1',
                    'type': 'string',
                    'description': 'Label to display in place of the data'
                },
                {
                    'path': 'Attachment.creation',
                    'name': 'creation',
                    'cardinality': '0..1',
                    'type': 'dateTime',
                    'description': 'Date attachment was first created'
                }
            ]
        }

    def create_annotation_type(self):
        """Create Annotation data type definition"""
        return {
            'id': 'Annotation',
            'name': 'Annotation',
            'title': 'Annotation',
            'description': 'A text note which also contains information about who made the statement and when.',
            'kind': 'complex-type',
            'abstract': False,
            'type': 'Annotation',
            'baseDefinition': 'http://hl7.org/fhir/StructureDefinition/Element',
            'elements': [
                {
                    'path': 'Annotation',
                    'name': 'Annotation',
                    'cardinality': '0..*',
                    'type': 'Element',
                    'description': 'A text note which also contains information about who made the statement and when.'
                },
                {
                    'path': 'Annotation.author[x]',
                    'name': 'author[x]',
                    'cardinality': '0..1',
                    'type': 'Reference(Practitioner | Patient | RelatedPerson | Organization) | string',
                    'description': 'Individual responsible for the annotation'
                },
                {
                    'path': 'Annotation.time',
                    'name': 'time',
                    'cardinality': '0..1',
                    'type': 'dateTime',
                    'description': 'When the annotation was made'
                },
                {
                    'path': 'Annotation.text',
                    'name': 'text',
                    'cardinality': '1..1',
                    'type': 'markdown',
                    'description': 'The annotation - text content (as markdown)'
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
        """Create additional essential FHIR data types"""
        print("🔧 Creating Additional FHIR Data Type Definitions")
        print("=" * 50)
        
        data_types = {
            'HumanName': self.create_humanname_type(),
            'Address': self.create_address_type(),
            'ContactPoint': self.create_contactpoint_type(),
            'Quantity': self.create_quantity_type(),
            'Range': self.create_range_type(),
            'Ratio': self.create_ratio_type(),
            'Attachment': self.create_attachment_type(),
            'Annotation': self.create_annotation_type()
        }
        
        for type_name, type_data in data_types.items():
            self.save_data_type(type_name, type_data)
            
        print(f"\n🎉 Created {len(data_types)} additional FHIR data types")
        print(f"Data types saved to: {self.datatypes_dir}")
        return len(data_types)

if __name__ == '__main__':
    creator = AdditionalFHIRDataTypeCreator()
    creator.run()