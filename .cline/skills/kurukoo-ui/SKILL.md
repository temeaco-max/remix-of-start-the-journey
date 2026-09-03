---
name: kurukoo-ui
description: Use when changing authenticated Kurukoo pages, navigation, shared EJS components, responsive shell behavior, page information architecture, user-facing UI copy, EJS templates in views/, or section-specific visual styling. Triggers on view template modifications, screen structure changes, navigation updates, and visual state implementations. Preserve the assistant-first experience and existing canonical services.
license: MIT
metadata:
  author: temeaco-max
  version: '1.0.0'
---

# Kurukoo UI Guide

All authenticated Kurukoo pages follow the unified visual system using `k-app-surface` primitive.

## When to Use

- Modifying EJS templates in `views/` directory
- Adding or changing navigation between screens
- Updating shell behavior or responsive patterns
- Changing user-facing copy, titles, or descriptions
- Implementing new page layouts or components

## Key Patterns

### Unified App Surface

All authenticated pages use a single `k-app-surface` wrapper:

```ejs
<k-app-surface 
  section="<%= section %>" 
  state="<%= JSON.stringify(state) %>" 
  surfaces="<%= JSON.stringify(surfaces) %>"
  user="<%= user %>"
>
</k-app-surface>
```

**Never** use section-specific containers like:
- `<k-app-section-tasks>`
- `<k-app-section-requests>`
- `<k-app-section-memory>`

### Screen Structure

Each screen has these canonical properties:

| Section | Screen Name | Title | Eyebrow | Description |
|---------|-------------|-------|---------|-------------|
| desk | Home | What matters now | Show attention |
| requests | Activity | Work in motion | What needs you |
| tasks | Work | Work to finish | Work in progress |
| reminders | Reminders | Keep life on track | Scheduled help |
| saved | Saved | Keep useful context close | Conversation items |
| discover | Explore | Find something useful | People, places, services |
| topics | Topics | Community context | Community questions |

### Client Workspace Hydration

The `kurukoo-workspace.js` script handles state management:

```javascript
const api = (url, options = {}) => fetch('/api' + url, {...});

// Tasks are hydrated from canonical API
api('/api/tasks').then(...)
api('/api/tasks/summary').then(...)
```

**Rule**: Never inline task-specific JavaScript. Use the shared workspace hydrator.

### HTML Escaping

User content must be escaped before insertion:

```javascript
const escape = (value) => String(value ?? '')
  .replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
```

## Visual States

All pages support these states:

| State | CSS Class | Description |
|-------|-----------|-------------|
| Loading | `k-app-list-loading` | Content loading |
| Empty | `k-app-task-empty` | No content to show |
| Active | `[data-state="..."]` | Current selection |
| Progress | `[aria-busy="true"]` | Working state |

## Navigation Pattern

Primary navigation uses semantic links:

```ejs
<a href="/chat?prompt=<%= encodeURIComponent(prompt) %>" 
   class="k-nav-link"><%= label %></a>
```

**Rule**: Always use proper URL encoding for prompts and parameters.