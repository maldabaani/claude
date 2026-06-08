package com.helpdesk.domain.emailinbox;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailInboxScheduler {

    private final EmailInboxRepository emailInboxRepository;
    private final EmailInboxService emailInboxService;

    @Scheduled(fixedDelay = 300000)
    public void pollAllInboxes() {
        emailInboxRepository.findByActiveTrue().forEach(inbox -> {
            log.info("Polling inbox: {}", inbox.getName());
            emailInboxService.pollInbox(inbox);
        });
    }
}
