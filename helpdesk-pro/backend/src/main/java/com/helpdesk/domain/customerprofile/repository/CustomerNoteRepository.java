package com.helpdesk.domain.customerprofile.repository;

import com.helpdesk.domain.customerprofile.entity.CustomerNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CustomerNoteRepository extends JpaRepository<CustomerNote, UUID> {

    List<CustomerNote> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}
