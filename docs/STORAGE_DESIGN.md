# FHIR Local Storage System Design

## Overview

A high-performance JSON-based storage system for FHIR R4 and US Core STU6.1 specifications optimized for fast queries and minimal loading times.

## Architecture

```
data/
├── index/                          # Master indexes for fast lookups
│   ├── master.json                 # Main index with metadata
│   ├── resources.json              # Resource name to file mapping
│   ├── elements.json               # Element search index
│   ├── types.json                  # Data type index
│   └── bindings.json               # Value set binding index
├── fhir-r4/                        # FHIR R4 base specification
│   ├── resources/                  # Individual resource files
│   │   ├── Patient.json
│   │   ├── Observation.json
│   │   └── ...
│   ├── datatypes/                  # Data type definitions
│   │   ├── primitives.json
│   │   ├── complex.json
│   │   └── special.json
│   ├── valuesets/                  # Value set definitions
│   │   ├── administrative-gender.json
│   │   └── ...
│   └── metadata.json              # FHIR R4 specification metadata
├── us-core-stu6.1/                # US Core STU6.1 profiles
│   ├── profiles/                   # Individual profile files
│   │   ├── USCorePatient.json
│   │   ├── USCoreObservation.json
│   │   └── ...
│   ├── extensions/                 # US Core extensions
│   │   ├── us-core-race.json
│   │   └── ...
│   ├── valuesets/                  # US Core value sets
│   │   ├── us-core-provider-specialty.json
│   │   └── ...
│   └── metadata.json              # US Core specification metadata
└── cache/                          # Runtime cache files
    ├── search-index.json           # Precomputed search index
    ├── element-tree.json           # Element hierarchy cache
    └── frequent-queries.json       # Cached frequent query results
```

## Data Structure Schemas

### Master Index (data/index/master.json)
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-20T15:30:00.000Z",
  "specifications": {
    "fhir-r4": {
      "version": "4.0.1",
      "resourceCount": 145,
      "dataTypeCount": 67,
      "valueSetCount": 847,
      "path": "fhir-r4/metadata.json"
    },
    "us-core-stu6.1": {
      "version": "6.1.0",
      "profileCount": 47,
      "extensionCount": 23,
      "valueSetCount": 156,
      "path": "us-core-stu6.1/metadata.json"
    }
  },
  "indexes": {
    "resources": "index/resources.json",
    "elements": "index/elements.json",
    "types": "index/types.json",
    "bindings": "index/bindings.json"
  },
  "stats": {
    "totalResources": 192,
    "totalElements": 8450,
    "indexSize": "2.3MB",
    "avgLoadTime": "45ms"
  }
}
```

### Resource Index (data/index/resources.json)
```json
{
  "byName": {
    "Patient": {
      "spec": "fhir-r4",
      "type": "resource",
      "file": "fhir-r4/resources/Patient.json",
      "hash": "sha256:abc123...",
      "size": 15234,
      "elementCount": 47
    },
    "USCorePatient": {
      "spec": "us-core-stu6.1",
      "type": "profile",
      "baseDefinition": "Patient",
      "file": "us-core-stu6.1/profiles/USCorePatient.json",
      "hash": "sha256:def456...",
      "size": 8456,
      "elementCount": 23,
      "mustSupportCount": 12
    }
  },
  "bySpec": {
    "fhir-r4": ["Patient", "Observation", "Practitioner", "..."],
    "us-core-stu6.1": ["USCorePatient", "USCoreObservation", "..."]
  },
  "byType": {
    "resource": ["Patient", "Observation", "..."],
    "profile": ["USCorePatient", "USCoreObservation", "..."],
    "extension": ["us-core-race", "us-core-ethnicity", "..."]
  }
}
```

### Element Search Index (data/index/elements.json)
```json
{
  "byName": {
    "identifier": {
      "resources": ["Patient", "Practitioner", "Organization"],
      "profiles": ["USCorePatient", "USCorePractitioner"],
      "frequency": 85,
      "types": ["Identifier"]
    },
    "name": {
      "resources": ["Patient", "Practitioner", "Organization"],
      "profiles": ["USCorePatient", "USCorePractitioner"],
      "frequency": 73,
      "types": ["HumanName", "string"]
    }
  },
  "byPath": {
    "Patient.identifier": {
      "cardinality": "0..*",
      "type": "Identifier",
      "mustSupport": false,
      "profiles": {
        "USCorePatient": {
          "cardinality": "1..*",
          "mustSupport": true,
          "constraints": ["us-core-1"]
        }
      }
    }
  },
  "searchTerms": {
    "patient": ["Patient", "USCorePatient"],
    "demographics": ["Patient", "USCorePatient"],
    "identifier": ["Patient.identifier", "Practitioner.identifier"]
  }
}
```

## Query Optimization Strategies

### 1. Lazy Loading
- Load only master index on startup
- Load individual resources on demand
- Cache loaded resources in memory

### 2. Chunked Loading
- Split large resources into logical chunks
- Load element definitions separately from metadata
- Progressive loading for large profiles

### 3. Precomputed Indexes
- Search index with tokenized terms
- Element hierarchy for tree navigation
- Cross-references between resources and profiles

### 4. Compression
- Gzip compression for large files
- Deduplicated common structures
- Reference-based element definitions

## Performance Targets

| Operation | Target Time | Current |
|-----------|-------------|---------|
| Initial load | < 100ms | TBD |
| Resource search | < 50ms | TBD |
| Element lookup | < 25ms | TBD |
| Profile comparison | < 200ms | TBD |
| Tree navigation | < 10ms | TBD |

## Implementation Phases

### Phase 1: Core Structure
1. Create directory structure
2. Define JSON schemas
3. Build basic indexes
4. Implement loading mechanism

### Phase 2: Optimization
1. Add search indexes
2. Implement caching
3. Add compression
4. Performance testing

### Phase 3: Advanced Features
1. Profile comparison
2. Element diffing
3. Must Support analysis
4. Constraint validation

## Benefits

### Fast Queries
- O(1) lookups via indexes
- Precomputed search results
- Cached frequent operations

### Minimal Loading
- Only load what's needed
- Progressive enhancement
- Efficient memory usage

### Scalability
- Handles full FHIR specification
- Supports multiple versions
- Extensible for future specs

### Maintainability
- Clear file organization
- Documented schemas
- Version control friendly