---
name: "game-tester"
description: "Creates game test cases and automation scripts for quality assurance. Invoke when user wants to test game functionality, performance, or behavior."
---

# Game Tester

## Overview

This skill provides game testing capabilities for quality assurance, including:

## Test Categories

### 1. Functional Testing
- Game start/end flow verification
- Player movement controls
- Shooting mechanics
- Dragon spawn and behavior
- Collision detection
- Power-up collection

### 2. Performance Testing
- Frame rate monitoring
- Memory usage tracking
- Load time measurement
- Rendering performance

### 3. Balance Testing
- Difficulty curve analysis
- Score progression
- Power-up effectiveness
- Dragon behavior patterns

## Usage Examples

### Test Case Template

```javascript
// Example: Player Movement Test
describe('Player Movement', () => {
  test('Player should move within screen bounds', () => {
    // Test left/right movement
    // Verify boundary constraints
  });
  
  test('Player should auto-shoot continuously', () => {
    // Verify shooting frequency
    // Check bullet trajectory
  });
});
```

## Testing Guidelines

1. **Pre-Test Setup**: Ensure game is in clean state
2. **Test Execution**: Run tests in controlled environment
3. **Result Verification**: Check expected vs actual behavior
4. **Report Generation**: Document test outcomes

## Best Practices

- Test in isolation when possible
- Use mock data for controlled testing
- Maintain reproducibility
- Log all test results systematically

## Common Test Scenarios

1. **Start Screen**: Verify buttons and modes
2. **Gameplay**: Test core mechanics
3. **Level Progression**: Check difficulty scaling
4. **End Conditions**: Verify victory/defeat states
5. **Power-ups**: Test bonus effects

## Tools Required

- Jest or similar testing framework
- Canvas mock for rendering tests
- Timers for performance measurement

## Output

Test reports with:
- Pass/fail status
- Execution time
- Error messages
- Suggestions for fixes