# Markdown with Mermaid Diagrams

This document demonstrates **Mermaid diagrams** embedded in markdown!

## Flowchart

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Awesome!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server

    User->>Browser: Request page
    Browser->>Server: HTTP GET
    Server-->>Browser: HTML response
    Browser-->>User: Render page
```

## Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +meow()
    }

    Animal <|-- Dog
    Animal <|-- Cat
```

## Regular Markdown Content

You can mix **regular markdown** with Mermaid diagrams seamlessly!

- Lists work fine
- Code blocks too:

```javascript
console.log('Hello from JavaScript!');
```

## Pie Chart

```mermaid
pie title Project Time Distribution
    "Development" : 45
    "Testing" : 25
    "Documentation" : 15
    "Meetings" : 15
```

---

**Pretty cool, right?** 🎨
