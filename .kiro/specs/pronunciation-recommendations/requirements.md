# Requirements Document

## Introduction

This feature enhances the English practice application by displaying detailed pronunciation feedback from the backend API response. When users complete a conversation test, the system will show mispronounced words with specific guidance in the Tutor Recommendations section under the Pronunciation tab.

## Glossary

- **Pronunciation_Tab**: The pronunciation section within the tutor recommendations panel
- **Mispronounced_Words**: Array of words that were incorrectly pronounced during the conversation
- **IPA_Notation**: International Phonetic Alphabet representation of correct pronunciation
- **Pronunciation_Notes**: Specific guidance for improving pronunciation of individual words
- **Backend_Response**: The API response containing pronunciation analysis data
- **Tutor_Recommendations**: The right sidebar panel showing personalized feedback

## Requirements

### Requirement 1: Display Mispronounced Words

**User Story:** As a user, I want to see which specific words I mispronounced during my conversation, so that I can focus on improving those particular sounds.

#### Acceptance Criteria

1. WHEN a conversation is completed and pronunciation data is available, THE Pronunciation_Tab SHALL display a list of mispronounced words
2. WHEN no mispronounced words are found, THE Pronunciation_Tab SHALL display an encouraging message about good pronunciation
3. WHEN pronunciation data is not available, THE Pronunciation_Tab SHALL display the current generic recommendation text
4. THE Pronunciation_Tab SHALL organize mispronounced words in a clear, readable format

### Requirement 2: Show Pronunciation Guidance

**User Story:** As a user, I want to see detailed guidance for each mispronounced word, so that I can understand how to pronounce it correctly.

#### Acceptance Criteria

1. WHEN displaying a mispronounced word, THE System SHALL show the word text prominently
2. WHEN IPA notation is available, THE System SHALL display the correct phonetic pronunciation
3. WHEN pronunciation notes are available, THE System SHALL display specific improvement guidance
4. WHEN multiple attempts were made, THE System SHALL indicate the number of attempts

### Requirement 3: Integrate with Backend Data

**User Story:** As a developer, I want the system to use real pronunciation data from the backend API, so that users receive accurate and personalized feedback.

#### Acceptance Criteria

1. WHEN the backend returns pronunciation data with mispronouncedWords array, THE System SHALL parse and store this data
2. WHEN the pronunciation object contains a score, THE System SHALL display the overall pronunciation score
3. WHEN mispronouncedWords contains word objects with properties (word, attempts, lastHeard, ipa, notes), THE System SHALL extract and display all available information
4. THE System SHALL handle missing or incomplete pronunciation data gracefully

### Requirement 4: Visual Design Integration

**User Story:** As a user, I want the pronunciation feedback to match the existing design system, so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. THE Pronunciation_Tab SHALL use consistent typography and spacing with the existing design
2. THE System SHALL apply appropriate dark/light mode styling based on user preference
3. WHEN displaying mispronounced words, THE System SHALL use visual hierarchy to distinguish between word, IPA, and notes
4. THE System SHALL use appropriate colors to indicate pronunciation difficulty or improvement areas

### Requirement 5: Data Persistence and Updates

**User Story:** As a user, I want to see updated pronunciation feedback each time I complete a new conversation, so that I can track my improvement over time.

#### Acceptance Criteria

1. WHEN a new conversation is completed, THE System SHALL update the pronunciation recommendations with the latest data
2. WHEN switching between different conversations, THE System SHALL display the pronunciation data specific to that conversation
3. WHEN no conversation is selected, THE System SHALL display generic pronunciation guidance
4. THE System SHALL maintain pronunciation data for each conversation in the conversation history