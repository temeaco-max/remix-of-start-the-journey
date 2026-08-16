# Dataset Lifecycle

Dataset versions are immutable.

```text
scenario/example candidates
 -> validation
 -> privacy/redaction
 -> teacher judgement
 -> curation
 -> deduplication
 -> balancing
 -> dataset snapshot
 -> training
```

The dataset must preserve provenance sufficient to explain why an example exists without retaining unnecessary personal data.

Synthetic examples must identify their generation template/source. Production-derived examples must identify the applicable privacy/redaction path.
