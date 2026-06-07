package com.helpdesk.domain.csat.repository;

import com.helpdesk.domain.csat.entity.CsatRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface CsatRatingRepository extends JpaRepository<CsatRating, UUID> {

    Optional<CsatRating> findByTicketId(UUID ticketId);

    @Query("SELECT AVG(CAST(r.rating AS double)) FROM CsatRating r")
    Optional<Double> avgOverall();

    long count();
}
