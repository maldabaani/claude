package com.helpdesk.domain.team;

import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public List<Team> findAll() {
        return teamRepository.findAllByOrderByNameAsc();
    }

    public Team findById(UUID id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team", id));
    }

    @Transactional
    public Team create(Team team) {
        return teamRepository.save(team);
    }

    @Transactional
    public Team update(UUID id, Team request) {
        Team team = findById(id);
        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setColor(request.getColor());
        return teamRepository.save(team);
    }

    @Transactional
    public void delete(UUID id) {
        Team team = findById(id);
        teamRepository.delete(team);
    }

    public List<User> getMembers(UUID teamId) {
        Team team = findById(teamId);
        return List.copyOf(team.getMembers());
    }

    @Transactional
    public Team addMember(UUID teamId, UUID userId) {
        Team team = findById(teamId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        team.getMembers().add(user);
        return teamRepository.save(team);
    }

    @Transactional
    public Team removeMember(UUID teamId, UUID userId) {
        Team team = findById(teamId);
        team.getMembers().removeIf(u -> u.getId().equals(userId));
        return teamRepository.save(team);
    }
}
