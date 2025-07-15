# Documentation Structure

This document describes the organization of all documentation in the Budget Tracker project.

## Directory Structure

```
docs/
├── application-features.md            # Feature overview
├── development-workflow.md            # Development guidelines
├── documentation-structure.md         # This file (current structure)
├── github-wiki-setup.md              # Wiki setup guide
├── DOCUMENTATION_REORGANIZATION_SUMMARY.md  # Cleanup summary
│
├── components/                        # Component-specific documentation
│   ├── base-table-guide.md           # BaseTable component guide
│   ├── executive-summary-guide.md    # ExecutiveSummary component guide
│   └── css-architecture.md           # CSS architecture and styling
│
├── export-features/                   # Export functionality documentation
│   ├── csv-export-guide.md           # CSV export documentation
│   ├── powerpoint-export-guide.md    # PowerPoint export documentation
│   ├── export-troubleshooting.md     # Consolidated troubleshooting
│   ├── export-implementation.md      # Technical implementation guide
│   └── export-user-guide.md          # User-focused export guide
│
├── guides/                            # User and technical guides
│   ├── budget-totals-feature.md      # Budget totals feature
│   ├── content-extraction-styling-cleanup-guide.md  # Export styling fixes
│   ├── technical-guide.md            # Technical documentation
│   └── user-guide.md                 # User documentation
│
├── refactoring/                       # Refactoring and migration docs
│   ├── CSS_REFACTORING_COMPLETE.md   # CSS refactoring reference
│   ├── DataExportService.migration.md # Export service migration
│   ├── ExecutiveSummary-migration.md  # Executive summary migration (pending)
│   ├── MIGRATION_GUIDE.md            # General migration guide
│   ├── POST_REFACTOR_MIGRATION_INDEX.md  # Migration index
│   ├── React-memo-implementation.md   # Performance optimization docs
│   └── VendorManagement-migration.md  # Vendor management migration (pending)
│
├── planning-feature/                  # Planning feature documentation
│   ├── COMPONENT_ARCHITECTURE.md     # Component structure
│   ├── DATA_MIGRATION_GUIDE.md       # Data migration guide
│   ├── IMPLEMENTATION_PLAN.md        # Master implementation plan
│   ├── IMPLEMENTATION_STATUS.md      # Current implementation status
│   ├── LESSONS_LEARNED.md           # Consolidated learnings
│   ├── MANUAL_TESTING_GUIDE.md      # Testing procedures
│   ├── README.md                    # Planning feature overview
│   └── TECHNICAL_REFERENCE.md       # Technical specifications
│
├── future-features/                   # Unimplemented features
│   ├── vendor-portfolio-analysis.md   # Advanced vendor analytics
│   └── vendor-portfolio-implementation.md  # Implementation guide
│
└── App documentation/                 # Application-specific docs
    └── Adding-Summary-Sections.md
```

## Key Documents

### For New Developers
1. Start with [development-workflow.md](./development-workflow.md)
2. Review [application-features.md](./application-features.md)
3. Check [technical-guide.md](./guides/technical-guide.md)

### For Migration from Pre-Refactor Code
1. **Primary Resource**: [POST_REFACTOR_MIGRATION_INDEX.md](./refactoring/POST_REFACTOR_MIGRATION_INDEX.md)
2. Component-specific migration guides in `/refactoring/`
3. New component documentation in `/components/`

### For Users
1. [user-guide.md](./guides/user-guide.md)
2. [export-user-guide.md](./export-features/export-user-guide.md)

### For Feature Implementation
1. Planning feature docs in `/planning-feature/`
2. Vendor management guides in `/guides/`
3. Export feature troubleshooting in `/export-features/`

## Documentation Standards

- All new features should have documentation in the appropriate subdirectory
- Migration guides go in `/refactoring/`
- User-facing guides go in `/guides/`
- Technical implementation details go in `/components/` or feature-specific directories
- Keep README files with their components but also copy to `/docs/components/`

## Note on Requirements

The `/requirements` folder is maintained separately and contains project requirements and specifications. It is not part of this general documentation structure.