# AI Usage Declaration

In accordance with the assignment guidelines, this document explicitly outlines the usage of AI tools (Google Gemini) during the development of the Intelligent Vendor Routing Platform. 

My approach was to utilize AI as an interactive pair-programming assistant and architectural sounding board, ensuring the core design decisions were driven by engineering best practices while leveraging the LLM for acceleration and formatting.

## 1. Architectural Brainstorming & Edge-Case Analysis
* **Multi-Criteria Decision Making (MCDM):** Brainstormed mathematical approaches to balance conflicting client requirements (e.g., requesting both `preferLowCost` and `preferFastest`) rather than relying on brittle `if/else` override chains.
* **Resilience Patterns:** Discussed the transition from treating "Failover" as a selectable routing strategy to implementing it as an implicit, foundational `while`-loop mechanism (Circuit Breaker) directly within the routing engine.
* **System Error Edge Cases:** Brainstormed integration pitfalls, specifically identifying how to handle "200 OK" HTTP responses that actually contain system-level payload errors (e.g., rate limits). This led to the creation of the `systemErrorIndicator` configuration mapping.

## 2. Boilerplate Generation & Code Refactoring
* **OOP Skeleton:** Utilized AI to generate the initial ES6 class structures, module exports, and baseline Mongoose schemas to accelerate the setup phase.
* **JSON Path Traversal:** Used AI to assist in writing and refining the traversal logic (dot-notation parsing) inside the `VendorExecutionClient` to dynamically map request/response templates without hardcoding capability names.

## 3. Documentation & Presentation
* **README Generation:** Used AI to synthesize the project's features into a concise, declarative, and developer-first `README.md`.
* **Architectural Report:** Utilized AI to help structure the final project report and format the routing algorithms (like the MCDM composite score) into proper mathematical equations for clearer presentation.