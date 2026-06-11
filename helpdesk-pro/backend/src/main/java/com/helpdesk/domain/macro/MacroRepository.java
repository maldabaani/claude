package com.helpdesk.domain.macro;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MacroRepository extends JpaRepository<Macro, UUID> {
    List<Macro> findAllByActiveTrue();
}
