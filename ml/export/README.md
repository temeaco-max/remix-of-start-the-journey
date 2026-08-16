# Model Export

Export produces a deployment-ready, versioned model artifact.

The exporter must support:

1. adapter-only artifact;
2. optional merged model;
3. quantized local inference artifact (for example GGUF where compatible with the selected runtime);
4. manifest containing base model revision, dataset version, training method, evaluation result, artifact hash and runtime requirements.

The export step must not claim a model is production-ready until the evaluation gate has passed.
