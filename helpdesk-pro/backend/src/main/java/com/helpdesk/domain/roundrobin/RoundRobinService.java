package com.helpdesk.domain.roundrobin;

import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoundRobinService {

    private final RoundRobinConfigRepository roundRobinConfigRepository;
    private final UserRepository userRepository;

    public RoundRobinConfig getConfig(UUID departmentId) {
        Optional<RoundRobinConfig> existing = departmentId != null
                ? roundRobinConfigRepository.findByDepartmentId(departmentId)
                : roundRobinConfigRepository.findByDepartmentIdIsNull();
        return existing.orElseGet(() -> RoundRobinConfig.builder()
                .departmentId(departmentId)
                .isEnabled(false)
                .build());
    }

    @Transactional
    public RoundRobinConfig updateConfig(UUID departmentId, boolean enabled) {
        RoundRobinConfig config = departmentId != null
                ? roundRobinConfigRepository.findByDepartmentId(departmentId)
                        .orElseGet(() -> RoundRobinConfig.builder().departmentId(departmentId).build())
                : roundRobinConfigRepository.findByDepartmentIdIsNull()
                        .orElseGet(() -> RoundRobinConfig.builder().build());
        config.setEnabled(enabled);
        return roundRobinConfigRepository.save(config);
    }

    @Transactional
    public Optional<UUID> getNextAgent(UUID departmentId) {
        RoundRobinConfig config = getConfig(departmentId);
        if (!config.isEnabled()) {
            // Fall back to global config
            RoundRobinConfig globalConfig = getConfig(null);
            if (!globalConfig.isEnabled()) return Optional.empty();
            config = globalConfig;
        }

        List<User> agents = departmentId != null
                ? userRepository.findActiveAgentsByDepartment(departmentId)
                : userRepository.findAllActiveAgents();

        if (agents.isEmpty()) return Optional.empty();

        UUID lastId = config.getLastAssignedAgentId();
        UUID nextAgentId = pickNext(agents, lastId);

        config.setLastAssignedAgentId(nextAgentId);
        roundRobinConfigRepository.save(config);

        return Optional.of(nextAgentId);
    }

    private UUID pickNext(List<User> agents, UUID lastAssignedId) {
        if (lastAssignedId == null) {
            return agents.get(0).getId();
        }
        for (int i = 0; i < agents.size(); i++) {
            if (agents.get(i).getId().equals(lastAssignedId)) {
                int nextIndex = (i + 1) % agents.size();
                return agents.get(nextIndex).getId();
            }
        }
        return agents.get(0).getId();
    }

    public List<RoundRobinConfig> getAllDepartmentConfigs() {
        return roundRobinConfigRepository.findAll().stream()
                .filter(c -> c.getDepartmentId() != null)
                .toList();
    }
}
