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

    @Query(value = "SELECT COALESCE(AVG(CAST(r.rating AS double precision)), 0) FROM csat_ratings r WHERE r.agent_id = :agentId AND r.created_at >= :from AND r.created_at <= :to", nativeQuery = true)
    Double avgCsatByAgent(@org.springframework.data.repository.query.Param("agentId") java.util.UUID agentId,
                          @org.springframework.data.repository.query.Param("from") java.time.Instant from,
                          @org.springframework.data.repository.query.Param("to") java.time.Instant to);

}
