# Model Registry

The registry records candidate, shadow, canary, active and retired Kurukoo model versions.

Each version must reference:

- immutable model artifact;
- base model revision;
- dataset version;
- training run;
- evaluation results;
- resource benchmark;
- runtime compatibility;
- promotion history;
- rollback predecessor.

Only one production model should be active for a given runtime role unless an explicit routing policy says otherwise.
