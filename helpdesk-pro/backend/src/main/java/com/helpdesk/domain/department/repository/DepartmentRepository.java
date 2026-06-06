package com.helpdesk.domain.department.repository;

import com.helpdesk.domain.department.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findByIdAndDeletedAtIsNull(UUID id);
    Page<Department> findByDeletedAtIsNull(Pageable pageable);
    List<Department> findByActiveAndDeletedAtIsNull(boolean active);
    boolean existsByNameAndDeletedAtIsNull(String name);
}
