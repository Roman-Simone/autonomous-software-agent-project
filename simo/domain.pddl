;; domain file: new_domain.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        (tile ?t)
        (delivery ?t)
        (agent ?a)
        (parcel ?p)
        (me ?a)
        (at ?agentOrParcel ?tile)
        (right ?t1 ?t2)
        (left ?t1 ?t2)
        (up ?t1 ?t2)
        (down ?t1 ?t2)
        (holding ?a ?p)
        (posing ?t)
    )
    
    (:action move-right
        :parameters (?me ?from ?to)
        :precondition (and
            (me ?me)
            (at ?me ?from)
            (right ?from ?to)
        )
        :effect (and
            (at ?me ?to)
            (not (at ?me ?from))
        )
    )

    (:action move-left
        :parameters (?me ?from ?to)
        :precondition (and
            (me ?me)
            (at ?me ?from)
            (left ?from ?to)
        )
        :effect (and
            (at ?me ?to)
            (not (at ?me ?from))
        )
    )

    (:action move-up
        :parameters (?me ?from ?to)
        :precondition (and
            (me ?me)
            (at ?me ?from)
            (up ?from ?to)
        )
        :effect (and
            (at ?me ?to)
            (not (at ?me ?from))
        )
    )

    (:action move-down
        :parameters (?me ?from ?to)
        :precondition (and
            (me ?me)
            (at ?me ?from)
            (down ?from ?to)
        )
        :effect (and
            (at ?me ?to)
            (not (at ?me ?from))
        )
    )

    (:action pick-up
        :parameters (?me ?p ?t)
        :precondition (and
            (me ?me)
            (parcel ?p)
            (at ?me ?t)
            (at ?p ?t)
        )
        :effect (and
            (holding ?me ?p)
            (not (at ?p ?t))
        )
    )

    (:action put-down
        :parameters (?me ?p ?t)
        :precondition (and
            (me ?me)
            (at ?me ?t)
        )
        :effect (and
            (posing ?t)
        )
    )
)