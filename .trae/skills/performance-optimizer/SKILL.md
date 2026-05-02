---
name: "performance-optimizer"
description: "Analyzes and optimizes game performance, improves frame rate, reduces memory usage. Invoke when game has performance issues or needs optimization."
---

# Performance Optimizer

## Overview

This skill provides performance optimization capabilities for HTML5 games, focusing on:

## Optimization Categories

### 1. Rendering Optimization
- Sprite batching
- Canvas clearing strategies
- Render layers management
- Offscreen rendering

### 2. Memory Management
- Object pooling
- Garbage collection optimization
- Texture compression
- Resource unloading

### 3. Animation Optimization
- Frame skipping
- LOD (Level of Detail)
- Sprite sheet optimization
- Animation caching

### 4. Physics Optimization
- Collision detection optimization
- Broad-phase culling
- Physics step tuning

## Common Issues

### Low Frame Rate
**Causes:**
- Too many objects rendered
- Complex collision detection
- Unoptimized drawing calls

**Solutions:**
- Implement object pooling
- Add frustum culling
- Reduce draw calls

### Memory Leaks
**Causes:**
- Unremoved event listeners
- Retained references
- Unreleased resources

**Solutions:**
- Weak references where possible
- Explicit cleanup functions
- Resource lifecycle management

### Jank/Stuttering
**Causes:**
- Long frame times
- Garbage collection pauses
- Synchronous loading

**Solutions:**
- Async loading
- Time slicing
- GC-friendly code

## Optimization Checklist

### Rendering
- [ ] Batch draw calls
- [ ] Use sprite sheets
- [ ] Implement culling
- [ ] Minimize state changes

### Logic
- [ ] Avoid nested loops
- [ ] Use efficient data structures
- [ ] Cache frequently accessed values
- [ ] Debounce/throttle events

### Memory
- [ ] Pool reusable objects
- [ ] Unload unused assets
- [ ] Clear event listeners
- [ ] Use weak references

## Tools

### Profiling
- Chrome DevTools Performance tab
- Lighthouse for web apps
- Memory profilers

### Monitoring
- FPS counters
- Memory usage tracking
- Frame time logging

## Best Practices

1. **Measure First**: Profile before optimizing
2. **Hotspots**: Focus on bottlenecks
3. **Trade-offs**: Balance quality vs performance
4. **Testing**: Verify improvements

## Output

- Performance report with bottleneck analysis
- Optimization recommendations
- Before/after metrics comparison
- Implementation suggestions