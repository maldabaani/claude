package com.helpdesk.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findAllByOrderByNameAsc();
    boolean existsByName(String name);
}
