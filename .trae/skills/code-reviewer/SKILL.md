---
name: "code-reviewer"
description: "Reviews code for best practices, bugs, and improvements. Invoke when user asks for code review or before merging changes."
---

# Code Reviewer

## Overview

This skill provides comprehensive code review capabilities for JavaScript/TypeScript game projects.

## Review Categories

### 1. Code Quality
- Readability and maintainability
- Consistent coding style
- Naming conventions
- Comment quality

### 2. Architecture
- Modular design
- Single responsibility
- Dependency management
- Code organization

### 3. Performance
- Efficient algorithms
- Memory management
- Avoiding anti-patterns
- Optimizing hot paths

### 4. Security
- Input validation
- Sanitization practices
- Secure data handling
- XSS prevention

### 5. Best Practices
- Design patterns usage
- Error handling
- Testing coverage
- Documentation

## Common Issues

### Code Smells
- Duplicate code
- Long functions/methods
- Deep nesting
- Magic numbers

### Anti-patterns
- Callback hell
- Global state abuse
- Tight coupling
- Premature optimization

### Bug Prone Patterns
- Null/undefined checks missing
- Race conditions
- Off-by-one errors
- Type coercion issues

## Review Checklist

### General
- [ ] Code follows project conventions
- [ ] Comments explain why, not what
- [ ] Functions have single responsibility
- [ ] Error handling is proper

### Performance
- [ ] No unnecessary computations
- [ ] DOM operations minimized
- [ ] Event listeners cleaned up
- [ ] Objects properly disposed

### Security
- [ ] Inputs validated
- [ ] Data sanitized
- [ ] No eval() usage
- [ ] No XSS vulnerabilities

### Testing
- [ ] Test coverage adequate
- [ ] Tests are meaningful
- [ ] Edge cases covered
- [ ] Mocking appropriate

## Review Process

1. **Initial Scan**: Quick overview of changes
2. **Detailed Review**: Line-by-line analysis
3. **Issue Identification**: Flag problems and improvements
4. **Feedback Generation**: Constructive suggestions
5. **Follow-up**: Verify fixes implemented

## Best Practices

1. **Be Constructive**: Focus on solutions, not just problems
2. **Be Specific**: Provide concrete examples
3. **Consider Context**: Understand the bigger picture
4. **Respect Style**: Follow project conventions
5. **Balance Quality**: Don't block progress unnecessarily

## Output

- Summary of findings
- Priority-ranked issues
- Code improvement suggestions
- Security concerns
- Performance recommendations