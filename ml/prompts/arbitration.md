# Context Arbitration Prompt

Given the current conversation state and candidate long-lived contexts, identify candidate owners of the new turn. Never force a turn into a pending slot solely because a request is open. Preserve unrelated contexts. Return structured candidates, confidence, ambiguity and whether clarification is needed.
