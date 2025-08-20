# Act II Implementation Plan

## Overview

This document outlines the implementation plan for Act II of RetroQuest, based on the detailed design in RoomsAct2.md. Act II introduces the player to Greendale and the Enchanted Forest, featuring more complex quest chains, advanced magic systems, and deeper narrative elements.

## Directory Structure to Create

```
src/retroquest/act2/
├── __init__.py
├── Act2.py                     # Main act controller
├── Act2StoryFlags.py          # Story flags specific to Act II
├── characters/
│   ├── __init__.py
│   ├── SirCedric.py          # Main quest giver
│   ├── MasterHealerLyria.py  # Advanced healing teacher
│   ├── Nyx.py                # Forest sprite, act completion
│   ├── SpectralLibrarian.py  # Hidden library guardian
│   ├── AncientTreeSpirit.py  # Forest wisdom giver
│   ├── WaterNymphs.py        # Whispering Glade inhabitants
│   ├── ForestGuardian.py     # Ancient Grove protector
│   ├── CastleGuards.py       # Various castle NPCs
│   ├── Craftsmen.py          # Residential quarter workers
│   └── ForestCreatures.py    # Minor forest encounters
├── items/
│   ├── __init__.py
│   ├── AncientSpellbook.py   # Hidden library treasure
│   ├── ProphecyScroll.py     # Key lore item
│   ├── CrystalFocus.py       # Magical enhancement
│   ├── ForestGuide.py        # Navigation aid
│   ├── NyxsToken.py          # Act completion reward
│   ├── ForestHeartCrystal.py # Major magical artifact
│   ├── BoundaryStone.py      # Forest transition item
│   ├── SilverLeaves.py       # Ancient Grove materials
│   ├── Moonflowers.py        # Magical enhancement herbs
│   └── CrystalWater.py       # Purification/healing item
├── quests/
│   ├── __init__.py
│   ├── TheGatheringStorm.py  # Main quest
│   ├── TheHealersBurden.py   # Lyria's quest
│   ├── SecretsOfTheLibrary.py # Hidden knowledge quest
│   ├── ForestWisdom.py       # Ancient Grove learning
│   ├── WhispersInTheWind.py  # Communication quest
│   ├── TheForestGuardian.py  # Ancient Grove protector
│   ├── NyxsTrials.py         # Final forest challenges
│   ├── LostInTheWoods.py     # Rescue quest
│   ├── CursedWaters.py       # Purification quest
│   └── ProphecyRevealed.py   # Lore discovery quest
├── rooms/
│   ├── __init__.py
│   ├── MainSquare.py         # Central Greendale hub
│   ├── MarketDistrict.py     # Shopping and supplies
│   ├── CastleApproach.py     # Entry to castle area
│   ├── CastleCourtyard.py    # Sir Cedric's location
│   ├── GreatHall.py          # Noble ceremonies
│   ├── ResidentialQuarter.py # Craftsmen and families
│   ├── HealersHouse.py       # Lyria's domain
│   ├── HiddenLibrary.py      # Secret magical knowledge
│   ├── MountainPath.py       # Transition from Act I
│   ├── ForestTransition.py   # Boundary between worlds
│   ├── ForestEntrance.py     # Entry to Enchanted Forest
│   ├── AncientGrove.py       # Tree spirit's domain
│   ├── WhisperingGlade.py    # Water nymph home
│   ├── HeartOfForest.py      # Nyx's sanctuary
│   └── BlacksmithShop.py     # Equipment and upgrades
└── spells/
    ├── __init__.py
    ├── Shield.py             # Knight training spell
    ├── Mend.py               # Craftsman utility spell
    ├── GreaterHeal.py        # Advanced healing
    ├── Dispel.py             # Counter-magic
    ├── Ward.py               # Protective magic
    ├── NatureSense.py        # Forest awareness
    ├── ForestSpeech.py       # Tree communication
    ├── AncientWisdom.py      # Divination magic
    ├── Whisper.py            # Long-distance communication
    ├── ForestMastery.py      # Nature control
    └── PropheticVision.py    # Future sight
```

## Implementation Priority

### Phase 1: Core Infrastructure (High Priority)

1. **Act2.py** - Main act controller with room registry and quest management
2. **Act2StoryFlags.py** - Centralized story state management
3. **Essential Rooms** - MainSquare, CastleCourtyard, HealersHouse, ForestEntrance, HeartOfForest
4. **Key Characters** - SirCedric, MasterHealerLyria, Nyx
5. **Main Quest** - TheGatheringStorm.py

### Phase 2: Core Gameplay (Medium Priority)

1. **Essential Spells** - GreaterHeal, NatureSense, ForestSpeech, PropheticVision
2. **Navigation Items** - ForestGuide, BoundaryStone
3. **Supporting Rooms** - ForestTransition, AncientGrove, WhisperingGlade
4. **Key Quests** - TheHealersBurden, ForestWisdom, NyxsTrials

### Phase 3: Rich Content (Low Priority)

1. **Remaining Rooms** - All market, castle, and forest locations
2. **All Spells** - Complete magical system
3. **All Items** - Full item ecosystem
4. **Side Quests** - All remaining quest content
5. **Minor Characters** - Supporting NPCs and flavor

## Key Design Patterns

### Story Flag Integration

- Use centralized Act2StoryFlags similar to Act1StoryFlags
- Flags should track quest progression, character meetings, spell learning
- Integration with GameState for persistent save/load

### Quest Chain Architecture

- Main quest branches into multiple side quests
- Side quest completion affects main quest options
- Clear dependency tracking between quests

### Spell Learning System

- Teachers require specific story conditions to teach spells
- Spells have prerequisites and unlock in logical progression
- Integration with existing Spell base class architecture

### Character Interactions

- Rich dialogue trees with story flag dependencies
- Multiple interaction types (quest giving, teaching, trading)
- Character state changes based on quest progress

## Technical Considerations

### Integration with Existing Systems

- Use existing Game.py, GameState.py, Quest.py base classes
- Follow established patterns from Act I implementation
- Maintain compatibility with UI system and save/load

### Testing Strategy

- Unit tests for each major component
- Integration tests for quest chains
- End-to-end testing for act completion

### Performance

- Lazy loading of rooms and characters
- Efficient story flag checking
- Minimal memory footprint for unused content

## Content Guidelines

### Narrative Consistency

- Maintain tone and style established in Act I
- Characters have consistent personalities and motivations
- World-building elements connect logically

### Gameplay Balance

- Spell learning curve appropriate for mid-game
- Item economy balanced with increased capabilities
- Quest difficulty scales appropriately

### User Experience

- Clear navigation between areas
- Intuitive quest progression indicators
- Helpful NPCs provide guidance when needed

## Completion Criteria

Act II implementation is complete when:

1. All rooms are accessible and functional
2. Main quest "The Gathering Storm" can be completed
3. All spells can be learned through intended methods
4. Save/load system works with Act II content
5. UI properly displays Act II elements
6. All tests pass including integration tests
7. Documentation is updated with Act II content

## Future Considerations

- Act III integration points
- Potential expansions to Act II content
- Performance optimizations for larger content
- Localization support for text content
- Modding support for community content

This implementation plan provides a roadmap for bringing Act II from design to fully functional gameplay.
