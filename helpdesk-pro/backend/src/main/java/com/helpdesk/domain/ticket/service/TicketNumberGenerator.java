package com.helpdesk.domain.ticket.service;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class TicketNumberGenerator {

    private final AtomicLong counter = new AtomicLong(System.currentTimeMillis() % 100000);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    public String generate() {
        long seq = counter.incrementAndGet() % 100000;
        return String.format("TKT-%s-%05d", LocalDate.now().format(DATE_FORMAT), seq);
    }
}
