;; domain file: new_domain.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        (down ?tile1 ?tile2)
        (up ?tile1 ?tile2)
        (left ?tile1 ?tile2)
        (right ?tile1 ?tile2)
        (at ?tile)
        (parcel_at ?p ?tile)
        (carrying ?p)
    )

    (:action move-down
        :parameters (?tile1 ?tile2)
        :precondition (and (at ?tile1) (down ?tile2 ?tile1))
        :effect (and (at ?tile2) (not (at ?tile1)))
    )
    (:action move-up
        :parameters (?tile1 ?tile2)
        :precondition (and (at ?tile1) (up ?tile2 ?tile1))
        :effect (and (at ?tile2) (not (at ?tile1)))
    )
    (:action move-left
        :parameters (?tile1 ?tile2)
        :precondition (and(at ?tile1) (left ?tile2 ?tile1))
        :effect (and (at ?tile2) (not (at ?tile1)))
    )
    (:action move-right
        :parameters (?tile1 ?tile2)
        :precondition (and (at ?tile1) (right ?tile2 ?tile1))
        :effect (and (at ?tile2) (not (at ?tile1)))
    )
    (:action pick-up
        :parameters (?p ?tile)
        :precondition (and (parcel_at ?p ?tile) (at ?tile) (not (carrying ?p)))
        :effect (and (carrying ?p) (not(parcel_at ?p ?tile)))
    )
    (:action put-down
        :parameters (?p ?tile)
        :precondition (and (at ?tile)(carrying ?p))
        :effect (and (parcel_at ?p ?tile) (not(carrying ?p)))
    )
)