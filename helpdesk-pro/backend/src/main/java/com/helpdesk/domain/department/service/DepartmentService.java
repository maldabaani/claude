package com.helpdesk.domain.department.service;

import com.helpdesk.domain.department.entity.Department;
import com.helpdesk.domain.department.repository.DepartmentRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public Page<Department> findAll(Pageable pageable) {
        return departmentRepository.findByDeletedAtIsNull(pageable);
    }

    public Department findById(UUID id) {
        return departmentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
    }

    @Transactional
    public Department create(Department department) {
        return departmentRepository.save(department);
    }

    @Transactional
    public Department update(UUID id, Department request) {
        Department dept = findById(id);
        dept.setName(request.getName());
        dept.setDescription(request.getDescription());
        dept.setInboundEmail(request.getInboundEmail());
        dept.setTeamLeadId(request.getTeamLeadId());
        dept.setActive(request.isActive());
        return departmentRepository.save(dept);
    }

    @Transactional
    public void delete(UUID id) {
        Department dept = findById(id);
        dept.softDelete();
        departmentRepository.save(dept);
    }
}
