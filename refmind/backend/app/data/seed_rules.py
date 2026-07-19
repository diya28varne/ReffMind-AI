"""Seed IFAB rule snippets for RAG when PDFs are not yet ingested.

Page numbers map to IFAB Laws of the Game 2024/25 (official PDF pagination).
"""

SEED_RULES: list[dict[str, str | int]] = [
    {
        "topic": "handball",
        "source": "IFAB Law 12 — Handball",
        "law": "Law 12",
        "page": 107,
        "section": "Handball",
        "text": (
            "Handball offence if a player deliberately touches the ball with the hand or arm, "
            "including moving the hand or arm towards the ball. It is also handball when a player "
            "makes their body unnaturally bigger by having the hand/arm in a position that is not "
            "justifiable by the player's body movement for that specific situation. "
            "The upper boundary of the arm is in line with the bottom of the armpit. "
            "Not every touch of hand/arm is an offence."
        ),
    },
    {
        "topic": "handball denying goal",
        "source": "IFAB Law 12 — Denying a goal",
        "law": "Law 12",
        "page": 112,
        "section": "Denying a goal or obvious goal-scoring opportunity",
        "text": (
            "A player who deliberately handles the ball to deny the opposing team a goal or an "
            "obvious goal-scoring opportunity must be sent off (red card). "
            "A penalty kick is awarded if the offence took place inside the penalty area."
        ),
    },
    {
        "topic": "offside",
        "source": "IFAB Law 11 — Offside",
        "law": "Law 11",
        "page": 91,
        "section": "Offside position & offence",
        "text": (
            "A player is in an offside position if any part of the head, body or feet is nearer "
            "to the opponents' goal line than both the ball and the second-last opponent. "
            "The hands and arms of all players are not considered. "
            "A player is not offside if they receive the ball from a deliberate play by an opponent."
        ),
    },
    {
        "topic": "penalty foul",
        "source": "IFAB Law 12 — Fouls and misconduct",
        "law": "Law 12",
        "page": 103,
        "section": "Direct free kick / penalty",
        "text": (
            "A direct free kick (or penalty if in the penalty area) is awarded if a player "
            "carelessly, recklessly or with excessive force commits any of the listed offences "
            "including charges, jumps at, kicks, pushes, strikes, tackles, or trips an opponent. "
            "Careless is when a player shows a lack of attention or consideration when making a "
            "challenge or acts without precaution. Minimal contact alone does not always constitute a foul."
        ),
    },
    {
        "topic": "VAR",
        "source": "IFAB VAR Protocol",
        "law": "VAR Protocol",
        "page": 145,
        "section": "Scope of VAR review",
        "text": (
            "VAR is used for clear and obvious errors or serious missed incidents in four match-changing "
            "situations: goals, penalty decisions, direct red cards, and mistaken identity. "
            "The referee always makes the final decision. "
            "The on-field review process exists because TV angles can differ from the referee's live view."
        ),
    },
]
