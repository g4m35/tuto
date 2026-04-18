# Roadmap

## Known Limitation

User-uploaded documents are currently passed to DeepTutor as prompt context only. They are not ingested into the knowledge base for retrieval, so long uploads can fall out of the context window and lose coverage.

## Fix Path

Wire `/api/v1/knowledge/create` and `/knowledge/{kb_name}/upload` into course creation, then pass `kb_name` to `guide/start` instead of raw text.
