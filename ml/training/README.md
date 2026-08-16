# Training

Initial training target: `HuggingFaceTB/SmolLM2-1.7B-Instruct` using LoRA/QLoRA.

Training must be reproducible and staged. Each run records:

- base model revision;
- dataset version;
- training configuration;
- random seed;
- code revision;
- adapter configuration;
- hardware/runtime profile;
- resulting artifact hashes;
- evaluation references.

The trainer must support resuming, checkpointing and exporting adapters. A later export stage may merge and/or quantize the adapter for local production inference.

No production user data may enter training without the repository's privacy/redaction policy being satisfied.
