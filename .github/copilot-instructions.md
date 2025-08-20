# Design Rules

This document outlines the design rules and guidelines for both the game story and the implementation the game, focusing on key design patterns, technical considerations, and content guidelines to ensure a cohesive and engaging player experience.

## Game Story Design Rules

### Narrative Structure

- Each act should have a main quest that drives the story forward, with side quests that enrich the world and characters.
- The story should unfold through a series of key events that reveal character backstories, world lore, and the overarching conflict.
- Each act should also have a number of side quests that provide additional context and depth to the main narrative.
- All side quests need to be completed before the main quest can be finished, ensuring players fully engage with the story.
- The design should describe a golden path through the story which contain all the steps needed to complete all quests, including the main quest and side quests.
- The design should also contain additional optional content that can be explored for deeper lore and character development.

### Character Development

- Characters should have distinct personalities, motivations, and arcs that evolve throughout the game.

### Dialogue

- Dialogue should be engaging and reflect the character's personality.
- Dialogue choices should impact relationships and story outcomes, allowing for player agency.

### World-Building

- The world should be rich with lore, with locations, items, and characters that contribute to the overall narrative.
- Locations should be interconnected, with logical transitions and exploration opportunities.

## Implementation Design Rules

### Architecture

- Use a modular architecture that allows for easy expansion and maintenance.
- Follow established design patterns for quest management, character interactions, and spell systems.
- Implement a centralized game state management system to track player progress, story flags, and inventory.

### Quest Management

- Quests should be structured in a way that allows for branching paths and dependencies.
- Use a quest chain architecture where the main quest of an act is built up from all the side quests.
- Each quest should have clear objectives, rewards, and consequences that affect the game world and player choices.

### Spell System

- Spells should be learned through interactions with characters or found in the world.
- Implement a spell learning system that requires specific conditions to be met before a spell can be taught.
- Spells should have logical prerequisites and unlock in a way that feels natural to the player.

### Character Interactions

- Characters should have rich dialogue trees that allow for multiple interaction types, such as quest giving, teaching, and trading.
- Character states should change based on quest progress, affecting future interactions and story outcomes.
- Implement a system for tracking character relationships and their impact on the story.

### Technical Considerations

- Ensure integration with existing systems, such as Game.py, GameState.py, and Quest.py base classes.
- Maintain compatibility with the user interface system and save/load functionality.
- Uses object-oriented programming principles to encapsulate game logic and data.
- Create one class per file and name files according to the class they contain.
- Use descriptive names for classes, methods, and variables to enhance readability and maintainability.

### Testing

- Implement unit tests for each major component, including quests, spells, and character interactions.
- Use integration tests to ensure that quest chains and character interactions work as intended.
- Conduct end-to-end testing to verify that the act can be completed successfully and that all quests are properly integrated.
