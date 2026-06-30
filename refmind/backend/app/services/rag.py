from __future__ import annotations

import os
from pathlib import Path

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from app.config import settings
from app.data.seed_rules import SEED_RULES


def _is_serverless() -> bool:
    return os.getenv("VERCEL") == "1" or os.getenv("REFMIND_SERVERLESS") == "1"


class _LocalEmbeddings(Embeddings):
    """Lightweight local embeddings — no API key required for hackathon demo."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._hash_embed(t) for t in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._hash_embed(text)

    @staticmethod
    def _hash_embed(text: str, dim: int = 384) -> list[float]:
        import hashlib
        import math

        vec = [0.0] * dim
        tokens = text.lower().split()
        for token in tokens:
            digest = hashlib.sha256(token.encode()).digest()
            for i in range(dim):
                vec[i] += (digest[i % len(digest)] / 255.0) - 0.5
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]


def _persist_path() -> Path:
    path = Path(settings.chroma_persist_dir)
    if not path.is_absolute():
        path = Path(__file__).resolve().parent.parent.parent / path
    path.mkdir(parents=True, exist_ok=True)
    return path


def _retrieve_seed_rules(query: str, topic: str | None = None, k: int = 3) -> list[Document]:
    """Keyword match over seed rules — used on Vercel where Chroma is unavailable."""
    candidates = list(SEED_RULES)
    if topic:
        filtered = [r for r in candidates if r["topic"] == topic]
        if filtered:
            candidates = filtered

    q = query.lower()
    scored: list[tuple[int, dict]] = []
    for rule in candidates:
        text = rule["text"].lower()
        score = sum(1 for word in q.split() if word in text)
        if topic and rule["topic"] == topic:
            score += 2
        scored.append((score, rule))

    scored.sort(key=lambda pair: -pair[0])
    top = [rule for _, rule in scored[:k]] or candidates[:k]
    return [
        Document(
            page_content=rule["text"],
            metadata={"source": rule["source"], "topic": rule["topic"]},
        )
        for rule in top
    ]


def get_vectorstore():
    from langchain_chroma import Chroma

    return Chroma(
        collection_name="ifab_rules",
        embedding_function=_LocalEmbeddings(),
        persist_directory=str(_persist_path()),
    )


def seed_vectorstore() -> int:
    """Load seed rules into Chroma. Returns number of documents added."""
    if _is_serverless():
        return len(SEED_RULES)

    docs = [
        Document(
            page_content=rule["text"],
            metadata={"source": rule["source"], "topic": rule["topic"]},
        )
        for rule in SEED_RULES
    ]
    store = get_vectorstore()
    existing = store._collection.count()  # noqa: SLF001 — hackathon simplicity
    if existing >= len(docs):
        return existing
    store.add_documents(docs)
    return store._collection.count()  # noqa: SLF001


def retrieve_rules(query: str, topic: str | None = None, k: int = 3) -> list[Document]:
    if _is_serverless():
        return _retrieve_seed_rules(query, topic=topic, k=k)

    seed_vectorstore()
    store = get_vectorstore()
    if topic:
        results = store.similarity_search(query, k=k, filter={"topic": topic})
        if results:
            return results
    return store.similarity_search(query, k=k)
